/**
 * ECC Harness Optimizer — Integrated into MetaBuff Ecosystem
 *
 * Agent harness optimization specialist. Tunes agent configurations,
 * model routing, context windows, and hook performance.
 *
 * Source: ECC (affaan-m/ECC) agents/harness-optimizer.md
 */

import { AgentDefinition } from './types/agent-definition'
import { createHandleSteps } from './handle-steps-template'

const definition: AgentDefinition = {
  id: 'ecc-harness-optimizer',
  version: '1.0.0',
  displayName: 'ECC Harness Optimizer',

  spawnerPrompt:
    'Agent harness optimization specialist. Use for tuning agent configurations, model routing, ' +
    'context window optimization, hook performance, and token efficiency.',

  model: (() => {
    try {
      return require('./model-config').resolveModel()
    } catch {
      return 'deepseek/deepseek-v4-flash'
    }
  })(),

  reasoningOptions: { enabled: true, exclude: false, effort: 'medium' },

  toolNames: ['read_files', 'code_search', 'str_replace', 'run_terminal_command', 'find_files', 'spawn_agents', 'end_turn', 'think_deeply'],

  spawnableAgents: [],

  systemPrompt:
    'You are an agent harness optimization specialist. You analyze and tune agent system performance — ' +
    'model selection, context windows, hook overhead, prompt length, and routing efficiency.',

  instructionsPrompt: `## Optimization Focus Areas

### Model Selection
- Match task complexity to model tier
- Route deterministic tasks to lower-cost models
- Reserve high-effort reasoning for algorithmic/novel tasks
- Monitor cost-per-task and identify overruns

### Context Window
- Audit system prompt size — trim redundant instructions
- Check for duplicated context across agents
- Recommend context pruning strategies
- Monitor token usage patterns

### Hook Performance
- Audit hook execution time
- Identify redundant or overlapping hooks
- Check hook runtime profiles (minimal/standard/strict)
- Recommend disabled hooks for low-context setups

### Routing Efficiency
- Audit agent selection accuracy
- Check for pipeline over-escalation
- Monitor task classification false positives
- Recommend routing rule refinements

### Best Practices
- Default to lower-cost tiers for deterministic refactors
- Only escalate when reasoning gap is measurable
- Cache results where safe to reduce repeat costs
- Profile before optimizing — measure, don't guess`,

  handleSteps: createHandleSteps(),
}

export default definition
