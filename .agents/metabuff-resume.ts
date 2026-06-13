import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'metabuff-resume',
  version: '1.0.0',
  displayName: 'MetaBuff Resume Specialist',
  spawnerPrompt: 'Spawn to resume interrupted tasks from checkpoints. Detects incomplete sessions, reads recovery data, and resumes the correct pipeline without restarting completed work.',
  model: resolveModel(),
  toolNames: ['run_terminal_command', 'read_files', 'think_deeply', 'spawn_agents', 'find_files', 'end_turn'],
  spawnableAgents: ['metabuff-mega', 'ecc-code-architect', 'metabuff-validator', 'ecc-code-reviewer'],
  
  systemPrompt: 'You are the MetaBuff Recovery Specialist. Your job is to resume interrupted tasks. ' +
                'Never restart completed work. Always pick up right where the task left off.',

  handleSteps: function* ({ prompt }) {
    // Inlined helpers — module-level imports are NOT available at runtime
    const RECOVERY_DIR = '.agents/.recovery'
    const READ_LATEST_CHECKPOINT_CMD = `cat ${RECOVERY_DIR}/latest.json 2>/dev/null || echo "NO_CHECKPOINT_FOUND"`
    const LIST_RECOVERY_SESSIONS_CMD = `python3 -c "
import os, json
d = '${RECOVERY_DIR}'
if not os.path.exists(d):
    print('No recovery sessions found.')
    exit(0)
files = [f for f in os.listdir(d) if f.startswith('session-') and f.endswith('.json')]
for f in files:
    try:
        data = json.load(open(os.path.join(d, f)))
        print(\"- ID: \" + str(data.get('id')) + \" | Status: \" + str(data.get('status')) + \" | Time: \" + str(data.get('lastCheckpoint')) + \" | Task: \" + str(data.get('task', ''))[:80] + \"...\")
    except:
        pass
"`
    function writeCheckpointCmd(checkpoint: Record<string, unknown>): string {
      const safeJson = JSON.stringify(checkpoint).replace(/'/g, "'\\''")
      const id = checkpoint.id as string
      return `mkdir -p ${RECOVERY_DIR} && echo '${safeJson}' > ${RECOVERY_DIR}/${id}.json && cp ${RECOVERY_DIR}/${id}.json ${RECOVERY_DIR}/latest.json`
    }

    // Phase 0: Detect mode
    const isList = /list/i.test(prompt)
    if (isList) {
      yield {
        toolName: 'run_terminal_command',
        input: { command: LIST_RECOVERY_SESSIONS_CMD }
      }
      return
    }

    // Phase 1: Read checkpoint
    const specificSessionMatch = prompt.match(/session-\d{8}-\d{6}/)
    let readCmd = READ_LATEST_CHECKPOINT_CMD
    if (specificSessionMatch) {
      readCmd = `cat ${RECOVERY_DIR}/${specificSessionMatch[0]}.json 2>/dev/null || echo "NO_CHECKPOINT_FOUND"`
    }

    const { toolResult: checkpointRaw } = (yield {
      toolName: 'run_terminal_command',
      input: { command: readCmd }
    }) as { toolResult: string }

    if (checkpointRaw.includes('NO_CHECKPOINT_FOUND')) {
      yield { toolName: 'run_terminal_command', input: { command: 'echo "Error: Checkpoint not found."' } }
      return
    }

    // Phase 2: Analyze
    const { toolResult: planRaw } = (yield {
      toolName: 'think_deeply',
      input: {
        thought: `Analyze this checkpoint:\n${checkpointRaw}\n\n` +
                 `Produce a JSON recovery plan:\n` +
                 `{ "resumePipeline": "metabuff-mega|metabuff", "alreadyCompleted": "...", "resumeFrom": "...", "knownFiles": [...] }`
      }
    }) as { toolResult: string }

    let plan: Record<string, unknown> = { resumePipeline: 'metabuff-mega', alreadyCompleted: 'Unknown', resumeFrom: 'Start', knownFiles: [] }
    try {
      const jsonStr = planRaw.match(/\{[\s\S]*\}/)?.[0] || '{}'
      plan = JSON.parse(jsonStr)
    } catch {}

    const checkpoint = JSON.parse(checkpointRaw) as Record<string, unknown>

    // Phase 3: Spawn correct pipeline
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: (plan.resumePipeline as string) || 'metabuff-mega',
          prompt: `⚠ RECOVERY MODE — This task was interrupted. Do NOT restart completed phases.\n\n` +
                  `Original task: ${checkpoint.task}\n\n` +
                  `Already completed: ${plan.alreadyCompleted}\n\n` +
                  `Resume from: ${plan.resumeFrom}\n\n` +
                  `Known files: ${(plan.knownFiles as string[]).join(', ')}`
        }]
      }
    }

    // Phase 4: Update status
    checkpoint.status = 'in-progress'
    checkpoint.lastCheckpoint = new Date().toISOString()
    ;(checkpoint.log as string[]).push('Resumed via metabuff-resume')

    yield {
      toolName: 'run_terminal_command',
      input: { command: writeCheckpointCmd(checkpoint) }
    }
  }
}

export default definition
