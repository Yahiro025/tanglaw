import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'
import { READ_LATEST_CHECKPOINT_CMD, LIST_RECOVERY_SESSIONS_CMD, writeCheckpointCmd } from './session-recovery-utils'

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
      readCmd = `cat .agents/.recovery/${specificSessionMatch[0]}.json 2>/dev/null || echo "NO_CHECKPOINT_FOUND"`
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

    let plan: any = { resumePipeline: 'metabuff-mega', alreadyCompleted: 'Unknown', resumeFrom: 'Start', knownFiles: [] }
    try {
      const jsonStr = planRaw.match(/\{[\s\S]*\}/)?.[0] || '{}'
      plan = JSON.parse(jsonStr)
    } catch {}

    const checkpoint = JSON.parse(checkpointRaw)

    // Phase 3: Spawn correct pipeline
    yield {
      toolName: 'spawn_agents',
      input: {
        agents: [{
          agent_type: plan.resumePipeline || 'metabuff-mega',
          prompt: `⚠ RECOVERY MODE — This task was interrupted. Do NOT restart completed phases.\n\n` +
                  `Original task: ${checkpoint.task}\n\n` +
                  `Already completed: ${plan.alreadyCompleted}\n\n` +
                  `Resume from: ${plan.resumeFrom}\n\n` +
                  `Known files: ${plan.knownFiles.join(', ')}`
        }]
      }
    }

    // Phase 4: Update status
    checkpoint.status = 'in-progress'
    checkpoint.lastCheckpoint = new Date().toISOString()
    checkpoint.log.push('Resumed via metabuff-resume')

    yield {
      toolName: 'run_terminal_command',
      input: { command: writeCheckpointCmd(checkpoint) }
    }
  }
}

export default definition
