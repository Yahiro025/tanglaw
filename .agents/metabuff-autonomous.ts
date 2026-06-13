import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'metabuff-autonomous',
  version: '1.0.1',
  displayName: 'MetaBuff Autonomous (Long-Horizon Loop)',
  model: resolveModel(),
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
    if (session.phase === 0) {
      yield {
        toolName: 'think_deeply',
        input: {
          thought:
            `Decompose the following task into 3-10 sequential phases: ${prompt}\n` +
            `Each phase should have an id, name, goal, verifyBy condition, and complexity (simple|complex|mega). ` +
            `Output your plan as a JSON array and save it to ${PHASES_FILE} using write_file.`,
        },
      }

      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [
            {
              agent_type: 'ecc-planner',
              prompt:
                `Write the phased plan for: ${prompt}\n` +
                `Ensure it follows the required JSON schema with id, name, goal, verifyBy, and complexity fields, ` +
                `and save it to ${PHASES_FILE} using write_file.`,
            },
          ],
        },
      }

      // Update session to phase 1
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
    if (session.phase === 1) {
      // Read the phases file to pass context to executor
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

      // Update session to phase 2
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
    if (session.phase === 2) {
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

      // Update session to phase 3
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
    if (session.phase === 3) {
      yield {
        toolName: 'run_terminal_command',
        input: {
          command:
            `echo "=== METABUFF AUTONOMOUS SESSION COMPLETE ===" && ` +
            `cat .agents/.session-log.md 2>/dev/null || echo "Task complete. No log file found."`,
        },
      }

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
