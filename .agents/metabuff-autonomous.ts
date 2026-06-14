import { AgentDefinition } from './types/agent-definition'

const definition: AgentDefinition = {
  id: 'metabuff-autonomous',
  version: '1.0.2',
  displayName: 'MetaBuff Autonomous (Long-Horizon Loop)',
  model: (() => {
    try {
      return require('./model-config').resolveModel()
    } catch {
      return 'deepseek/deepseek-v4-flash'
    }
  })(),
  spawnerPrompt:
    'Spawn MetaBuff Autonomous for long-horizon, overnight, or from-scratch tasks. ' +
    'It decomposes work into phases, executes them sequentially with checkpoint recovery, ' +
    'and validates each phase before moving to the next.',

  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'high',
  },
  toolNames: ['spawn_agents', 'think_deeply', 'run_terminal_command', 'read_files', 'write_file', 'end_turn'],
  spawnableAgents: [
    'ecc-code-architect',
    'metabuff-validator',
    'metabuff-mega',
    'ecc-planner',
    'ecc-code-reviewer',
    'metabuff-resume',
  ],
  systemPrompt:
    'You work until the task is COMPLETE: all tests pass, all phases verified, docs updated. COMPLETE means done, not attempted.',

  handleSteps: function* ({ prompt }: { prompt: string }) {
    const AUTONOMOUS_SESSION_FILE = '.agents/.autonomous-session.json'
    const PHASES_FILE = '.agents/.autonomous-phases.json'
    const RECOVERY_DIR = '.agents/.recovery'
    const SESSION_ID = Date.now().toString()

    // ─── Helper: shell-based checkpoint command ──────────────────────────────
    function buildCheckpointCmd(stepName: string) {
      return (
        `mkdir -p ${RECOVERY_DIR} && ` +
        `echo '{"step":"${stepName}","timestamp":"${new Date().toISOString()}"}' > ${RECOVERY_DIR}/${SESSION_ID}.json && ` +
        `cp ${RECOVERY_DIR}/${SESSION_ID}.json ${RECOVERY_DIR}/latest.json`
      )
    }

    // ─── Helper: poll for phases file with timeout ───────────────────────────
    // Waits up to 60 seconds for the phases file to appear (written by ecc-planner).
    // This prevents the race condition where Phase 2 reads an empty/missing file.
    const D = '$' // used in template literals to produce literal ${VAR} for bash variables
    function buildPollCmd(): string {
      return (
        `TIMEOUT=60 INTERVAL=3 ELAPSED=0 PHASES_FILE="${PHASES_FILE}"` +
        `; while [ "$ELAPSED" -lt "$TIMEOUT" ]; do` +
        ` if [ -s "$PHASES_FILE" ] && head -1 "$PHASES_FILE" | grep -q '^\\['; then` +
        `  echo "PLAN_READY after ${D}{ELAPSED}s" && exit 0;` +
        ` fi;` +
        ` sleep "$INTERVAL";` +
        ` ELAPSED=$((ELAPSED + INTERVAL));` +
        ` done;` +
        ` echo "PLAN_TIMEOUT after ${D}{TIMEOUT}s" && exit 1`
      )
    }

    // ─── Phase 0: Resume or Create Session ──────────────────────────────────
    // Try to read existing session file via shell
    const { toolResult: sessionReadResult } = (yield {
      toolName: 'run_terminal_command',
      input: {
        command: `cat ${AUTONOMOUS_SESSION_FILE} 2>/dev/null || echo "__NO_SESSION__"`,
      },
    }) as { toolResult: string }

    let session: {
      task: string
      phase: number
      completedPhases: string[]
      discoveries: string[]
      startTime: string
    } | null = null

    if (sessionReadResult && !sessionReadResult.includes('__NO_SESSION__')) {
      try {
        session = JSON.parse(sessionReadResult.trim())
      } catch {
        session = null
      }
    }

    if (!session) {
      session = {
        task: prompt,
        phase: 0,
        completedPhases: [],
        discoveries: [],
        startTime: new Date().toISOString(),
      }
      yield {
        toolName: 'write_file',
        input: {
          path: AUTONOMOUS_SESSION_FILE,
          content: JSON.stringify(session, null, 2),
          instructions: 'Create autonomous session file',
        },
      }
    }

    // ─── Phase 1: PLAN ──────────────────────────────────────────────────────
    // Spawns ecc-planner to write a phased plan to the phases file.
    // Then polls (up to 60s) for the file to appear before proceeding.
    if (!session.completedPhases.includes('plan')) {
      yield {
        toolName: 'think_deeply',
        input: {
          thought:
            `Decompose the following task into 3-10 sequential phases: ${prompt}\n` +
            `Each phase should have an id, name, goal, verifyBy condition, and complexity (simple|complex|mega).\n` +
            `Consider the implementation order: plan -> execute -> validate.\n` +
            `Keep the plan focused on the original task.`,
        },
      }

      // Write a fallback plan immediately so Phase 2 has something even if
      // ecc-planner fails or times out.
      yield {
        toolName: 'write_file',
        input: {
          path: PHASES_FILE,
          content: JSON.stringify([
            {
              id: 'phase_implement',
              name: 'Implementation',
              goal: 'Implement the changes described in the task using metabuff-mega',
              verifyBy: 'Typecheck passes, tests pass',
              complexity: 'complex',
            },
            {
              id: 'phase_validate',
              name: 'Validation',
              goal: 'Validate all changes with metabuff-validator',
              verifyBy: 'Validator reports no critical/high issues',
              complexity: 'simple',
            },
          ], null, 2),
          instructions: 'Write fallback plan to phases file (may be overwritten by ecc-planner)',
        },
      }

      // Spawn ecc-planner to write a better plan (overwrites the fallback)
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [
            {
              agent_type: 'ecc-planner',
              prompt:
                `Write a phased implementation plan for the following task:\n\n${prompt}\n\n` +
                `Save the plan as a JSON array to ${PHASES_FILE} using write_file.\n` +
                `Each phase object must have: id (string), name (string), goal (string), ` +
                `verifyBy (string), complexity ("simple"|"complex"|"mega").\n` +
                `The plan should have 2-8 phases. Include implementation and validation phases.`,
            },
          ],
        },
      }

      // Poll for the phases file to exist (written by ecc-planner).
      // The fallback plan was already written above, so even if the poll times out
      // we still have a valid plan to use.
      yield {
        toolName: 'run_terminal_command',
        input: {
          command: buildPollCmd(),
        },
      }

      session.completedPhases.push('plan')
      session.phase = 1
      yield {
        toolName: 'write_file',
        input: {
          path: AUTONOMOUS_SESSION_FILE,
          content: JSON.stringify(session, null, 2),
          instructions: 'Update session after planning phase',
        },
      }

      yield {
        toolName: 'run_terminal_command',
        input: { command: buildCheckpointCmd('phase_1_planned') },
      }
    }

    // ─── Phase 2: EXECUTE ───────────────────────────────────────────────────
    // Reads the phases file (written by ecc-planner in Phase 1, guaranteed to
    // exist because of the polling loop and fallback plan) and passes it to
    // metabuff-mega.
    if (!session.completedPhases.includes('execute')) {
      const { toolResult: phasesContent } = (yield {
        toolName: 'run_terminal_command',
        input: {
          command: `cat ${PHASES_FILE} 2>/dev/null || echo "[]"`,
        },
      }) as { toolResult: string }

      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [
            {
              agent_type: 'metabuff-mega',
              prompt:
                `Execute the following phased plan:\n\n${(phasesContent ?? '') || '[]'}\n\n` +
                `Original task: ${prompt}\n\n` +
                `For each phase:\n` +
                `1. Implement the changes described\n` +
                `2. Run typecheck and tests to verify\n` +
                `3. Log progress\n\n` +
                `When all phases are done, call end_turn.`,
            },
          ],
        },
      }

      session.completedPhases.push('execute')
      session.phase = 2
      yield {
        toolName: 'write_file',
        input: {
          path: AUTONOMOUS_SESSION_FILE,
          content: JSON.stringify(session, null, 2),
          instructions: 'Update session after execution phase',
        },
      }

      yield {
        toolName: 'run_terminal_command',
        input: { command: buildCheckpointCmd('phase_2_executed') },
      }
    }

    // ─── Phase 3: VALIDATE ──────────────────────────────────────────────────
    if (!session.completedPhases.includes('validate')) {
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [
            {
              agent_type: 'metabuff-validator',
              prompt:
                `Perform final validation for the fully completed task: ${prompt}\n` +
                `Ensure everything is fully working according to the plan.`,
            },
          ],
        },
      }

      session.completedPhases.push('validate')
      session.phase = 3
      yield {
        toolName: 'write_file',
        input: {
          path: AUTONOMOUS_SESSION_FILE,
          content: JSON.stringify(session, null, 2),
          instructions: 'Update session after validation phase',
        },
      }

      yield {
        toolName: 'run_terminal_command',
        input: { command: buildCheckpointCmd('phase_3_validated') },
      }
    }

    // ─── Phase 4: SUMMARY ───────────────────────────────────────────────────
    if (!session.completedPhases.includes('summary')) {
      yield {
        toolName: 'run_terminal_command',
        input: {
          command:
            `echo "=== METABUFF AUTONOMOUS SESSION COMPLETE ===" && ` +
            `cat .agents/.session-log.md 2>/dev/null || echo "Task complete. No log file found."`,
        },
      }

      session.completedPhases.push('summary')
      session.phase = 4
      yield {
        toolName: 'write_file',
        input: {
          path: AUTONOMOUS_SESSION_FILE,
          content: JSON.stringify(session, null, 2),
          instructions: 'Final session update — task complete',
        },
      }
    }
  },
}

export default definition
