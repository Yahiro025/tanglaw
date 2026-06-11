/**
 * Model Auto-Detection — Shared Resolver
 * ─────────────────────────────────────
 * Resolves the active model for all MetaBuff agents at definition time.
 *
 * Resolution order:
 *   1. METABUFF_MODEL env var (set before launching Freebuff)
 *   2. .agents/model-config.json user-editable config
 *   3. Default: deepseek/deepseek-v4-pro
 *
 * Supports: DeepSeek V4 Pro, MiMo 2.5 Pro, Kimi K2.6
 */

export const FREE_MODELS = {
  deepseek: 'deepseek/deepseek-v4-pro',
  mimo: 'moonshot/mimo-2.5-pro',
  kimi: 'moonshot/kimi-k2.6',
} as const

export function resolveModel(): string {
  try {
    if (process.env.METABUFF_MODEL && Object.values(FREE_MODELS).includes(process.env.METABUFF_MODEL as any)) {
      return process.env.METABUFF_MODEL
    }
  } catch {}
  try {
    const fs = require('fs')
    const config = JSON.parse(fs.readFileSync('.agents/model-config.json', 'utf-8'))
    if (config.model && Object.values(FREE_MODELS).includes(config.model)) return config.model
  } catch {}
  return FREE_MODELS.deepseek
}
