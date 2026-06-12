import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'ecc-hypothesis-generator',
  version: '1.0.0',
  displayName: 'ECC Hypothesis Generator',
  spawnerPrompt: 'Scientific hypothesis generation specialist. Use for research tasks involving mechanism analysis, gap identification, and falsifiable hypothesis formulation with validation plans.',
  model: resolveModel(),
  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'high'
  },
  toolNames: ['read_files', 'code_search', 'web_search', 'think_deeply', 'run_terminal_command', 'find_files', 'end_turn'],
  spawnableAgents: [],
  
  systemPrompt: 'You are the ECC Hypothesis Generator. Follow this 6-step protocol for scientific reasoning: (1) CONTEXT, (2) SEARCH, (3) GAP, (4) HYPOTHESIZE, (5) MECHANISM, (6) VALIDATE.',

  handleSteps: function* ({ prompt }) {
    // Phase 1: Context
    yield {
      toolName: 'think_deeply',
      input: { thought: `CONTEXT — Analyze the scientific/research domain and materials from the prompt:\n${prompt}` }
    }

    // Phase 2: Web search (Main topic)
    yield {
      toolName: 'web_search',
      input: { query: `mechanism OR research for: ${prompt.slice(0, 100)}` }
    }

    // Phase 3: Web search (Mechanism/Specifics)
    yield {
      toolName: 'web_search',
      input: { query: `latest developments OR specific mechanisms related to: ${prompt.slice(0, 100)}` }
    }

    // Phase 4: Hypothesis Generation
    yield {
      toolName: 'think_deeply',
      input: {
        thought: `HYPOTHESIS GENERATION — Based on the context and search results, perform gap analysis. ` +
                 `Formulate 2-3 falsifiable hypotheses, detail the mechanisms, and create a validation plan.`
      }
    }
    
    // Agent proceeds to fulfill the request.
    return
  }
}

export default definition
