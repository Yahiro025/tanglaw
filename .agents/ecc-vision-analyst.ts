import { AgentDefinition } from './types/agent-definition'
import { resolveModel } from './model-config'

const definition: AgentDefinition = {
  id: 'ecc-vision-analyst',
  version: '1.0.0',
  displayName: 'ECC Vision Analyst',
  spawnerPrompt: 'Visual analysis specialist for screenshots, diagrams, and images. Maps visual observations to precise code changes. Use when tasks involve image analysis or visual asset review.',
  model: resolveModel(),
  spawnableAgents: [],
  toolNames: ['read_files', 'code_search', 'str_replace', 'write_file', 'run_terminal_command', 'think_deeply', 'end_turn'],
  
  systemPrompt: 'You are the ECC Vision Analyst. You focus on visual tasks. Always produce (1) structured description and (2) actionable code changes. Map your visual observations to precise file/line changes.',

  handleSteps: function* ({ prompt }) {
    // Phase 1: Extract image path
    const match = prompt.match(/([a-zA-Z0-9_.\-/\\\\]+\.(png|jpg|jpeg|gif|webp|svg))/i)
    let imagePath = match ? match[1] : null

    // Phase 2: Read image
    let imageContent = ''
    if (imagePath) {
      const { toolResult } = (yield {
        toolName: 'read_files',
        input: { files: [imagePath] }
      }) as { toolResult: string }
      imageContent = toolResult
    }

    // Phase 3: Think deeply about the asset
    yield {
      toolName: 'think_deeply',
      input: {
        thought: `Analyze the visual asset: describe layout, components, colors, text, issues. ` +
                 `Then map each observation to specific code changes: which file, which line, what change.\n\n` +
                 `Task Prompt: ${prompt}\nImage Path: ${imagePath || 'None found'}\nImage Context: ${imageContent.slice(0, 1000)}...`
      }
    }

    // Agent will proceed to use str_replace etc. to perform the work.
    return
  }
}

export default definition
