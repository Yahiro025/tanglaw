export const FREE_MODELS = {
  flash: 'deepseek/deepseek-v4-flash',
  deepseek: 'deepseek/deepseek-v4-pro',
  mimo: 'google/gemini-2.5-pro',
  kimi: 'moonshot/moonshot-128k',
}

export const MODEL_CAPS: Record<string, any> = {
  [FREE_MODELS.flash]: {
    vision: false,
    context: 32000,
    hallucination: 'low',
    speed: 'fast',
    longHorizon: false,
    coT: false,
    notes: 'Fast, concise routing default',
  },
  [FREE_MODELS.deepseek]: {
    vision: false,
    context: 128000,
    hallucination: 'high',
    speed: 'medium',
    longHorizon: false,
    coT: false,
    notes: '94% hallucination rate on AA-Omniscience — ground rules are critical',
  },
  [FREE_MODELS.mimo]: {
    vision: true,
    context: 128000,
    hallucination: 'low',
    speed: 'slow',
    longHorizon: false,
    coT: true,
    notes: 'Vision capable, native CoT',
  },
  [FREE_MODELS.kimi]: {
    vision: false,
    context: 262000,
    hallucination: 'medium',
    speed: 'medium',
    longHorizon: true,
    coT: false,
    notes: 'Long-horizon specialist',
  },
}

export function resolveModel(): string {
  try {
    const fs = require('fs')
    const path = require('path')
    const configPath = path.join(__dirname, 'model-config.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      if (config.model) return config.model
    }
  } catch {}
  return FREE_MODELS.flash
}

export function resolveModelCaps(): any {
  const model = resolveModel()
  return MODEL_CAPS[model] || MODEL_CAPS[FREE_MODELS.flash]
}

export function sessionHasVision(): boolean {
  return resolveModelCaps().vision
}

export function sessionIsLongHorizon(): boolean {
  return resolveModelCaps().longHorizon
}
