/**
 * ECC Instinct Bridge — MetaBuff v1.7.0
 *
 * NOTE: This is a REFERENCE implementation. The actual instinct recording
 * and querying logic is inlined inside metabuff.ts handleSteps
 * (recordInstinct function + withECCContext includes instinct querying).
 * known-issues.md inter-session memory.
 *
 * ECC instincts are atomic learned behaviors (trigger → action) with
 * confidence scoring (0.3–0.9), domain tags, and evidence tracking.
 *
 * This bridge:
 *   1. Records observations after each pipeline execution
 *   2. Queries past instincts for relevance to current tasks
 *   3. Integrates with known-issues.md for cross-session persistence
 *
 * Instinct format (stored in known-issues.md):
 *   `[DATE] INSTINCT: [domain] [trigger] → [action] (confidence: 0.X)`
 */

import * as fs from 'node:fs'

const KNOWN_ISSUES_PATH = '.agents/known-issues.md'
const MAX_INSTINCTS = 50 // Keep file manageable

interface Observation {
  category: string
  description: string
  resolution: string
  confidence: number
  domain: string
}

/**
 * Record a new observation/instinct into known-issues.md.
 * Appends to the file and prunes oldest entries if over MAX_INSTINCTS.
 */
export function recordObservation(obs: Observation): void {
  const date = new Date().toISOString().split('T')[0]!
  const entry = `\n- \`[${date}] INSTINCT: [${obs.domain}] ${obs.description} → ${obs.resolution} (confidence: ${obs.confidence.toFixed(1)})\``

  try {
    if (fs.existsSync(KNOWN_ISSUES_PATH)) {
      let content = fs.readFileSync(KNOWN_ISSUES_PATH, 'utf-8')
      // Append before the closing newline
      content = content.trimEnd() + entry + '\n'
      // Prune if too many entries
      const entries = content.split('\n').filter(l => l.trim().startsWith('-'))
      if (entries.length > MAX_INSTINCTS) {
        const lines = content.split('\n')
        let pruneCount = 0
        const pruned = lines.filter(line => {
          if (line.trim().startsWith('- `[') && pruneCount < (entries.length - MAX_INSTINCTS)) {
            pruneCount++
            return false
          }
          return true
        })
        content = pruned.join('\n')
      }
      fs.writeFileSync(KNOWN_ISSUES_PATH, content)
    } else {
      fs.writeFileSync(KNOWN_ISSUES_PATH,
        '# MetaBuff Known Issues & Learned Instincts\n\n' +
        '## Instincts (Self-Learning)\n' + entry + '\n'
      )
    }
  } catch {
    // Best-effort: if file write fails, don't block the pipeline
  }
}

/**
 * Query past instincts for relevance to the current prompt.
 * Searches known-issues.md for instincts with matching domain keywords.
 *
 * Returns a string of relevant past learnings, or empty string if none found.
 */
export function queryInstincts(prompt: string): string {
  try {
    if (!fs.existsSync(KNOWN_ISSUES_PATH)) return ''

    const content = fs.readFileSync(KNOWN_ISSUES_PATH, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim().startsWith('- `['))

    if (lines.length === 0) return ''

    const lower = prompt.toLowerCase()
    const keywords = lower.match(/[a-z]{4,}/g) || []

    // Score each instinct by keyword overlap
    const scored = lines.map(line => {
      const lineLower = line.toLowerCase()
      const score = keywords.filter(kw => lineLower.includes(kw)).length
      return { line: line.trim(), score }
    })

    const relevant = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    if (relevant.length === 0) return ''

    return `\n<!-- ── RELEVANT PAST INSTINCTS (${relevant.length}) ── -->\n` +
      relevant.map(r => r.line).join('\n') +
      '\n<!-- ── END PAST INSTINCTS ── -->\n'
  } catch {
    return ''
  }
}

/**
 * Auto-detect which instinct domains are relevant to a prompt.
 * Used to decide whether to query instincts at all.
 */
export function shouldQueryInstincts(prompt: string): boolean {
  const triggerDomains = [
    'error', 'bug', 'fix', 'crash', 'fail', 'type.*error', 'build.*fail',
    'regression', 'break', 'wrong', 'incorrect', 'broken', 'issue',
  ]
  return triggerDomains.some(d => {
    try { return new RegExp(`\\b${d}\\b`, 'i').test(prompt) } catch { return false }
  })
}
