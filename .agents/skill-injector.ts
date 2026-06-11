/**
 * ECC Skill Injector — MetaBuff v1.7.0
 *
 * NOTE: This is a REFERENCE implementation. The actual skill injection
 * logic is inlined inside metabuff.ts handleSteps (withECCContext function)
 * because handleSteps cannot use ESM module imports.
 *
 * This file documents the injection algorithm and provides standalone
 * utilities that can be used in non-handleSteps contexts.
 */
/**
 * When MetaBuff spawns an agent, it uses getRelevantSkills() to find and
 * prepend matching skill knowledge from .agents/skills/ecc/.
 *
 * How it works:
 *   1. Extract keywords from the prompt
 *   2. Match against 249 ECC skill directory names
 *   3. Load matching SKILL.md files (truncated to prevent context bloat)
 *   4. Return concatenated skill content for injection
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const SKILLS_DIR = '.agents/skills/ecc'

/** Maximum characters per skill to prevent context bloat */
const MAX_SKILL_CHARS = 2000

/** Maximum total skill context injected */
const MAX_TOTAL_CHARS = 8000

/**
 * Extract meaningful keywords from a prompt string.
 * Returns lowercase, deduplicated keywords of 4+ characters.
 */
export function extractKeywords(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  const words = lower.match(/[a-z]{4,}/g) || []
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'have', 'will', 'your', 'into', 'when',
    'them', 'they', 'what', 'file', 'code', 'make', 'want', 'need', 'just',
    'like', 'some', 'more', 'then', 'also', 'than', 'even', 'only', 'over',
    'back', 'here', 'there', 'their', 'been', 'were', 'does', 'dont', 'change',
    'update', 'every', 'other', 'same', 'such', 'very', 'much', 'many', 'well',
    'still', 'down', 'first', 'last', 'next', 'about', 'above', 'below', 'where',
    'after', 'before', 'using', 'please', 'really', 'simply', 'whether', 'should',
    'would', 'could', 'something', 'anything', 'nothing', 'everything',
  ])
  return [...new Set(words.filter(w => !stopWords.has(w)))]
}

/**
 * Match extracted keywords against ECC skill directory names.
 * Each skill dir name is scored by how many keywords match.
 */
function matchSkills(keywords: string[], skillNames: string[]): { name: string; score: number }[] {
  return skillNames
    .map(name => {
      const parts = name.split('-')
      const score = keywords.filter(kw => parts.some(p => p.includes(kw) || kw.includes(p))).length
      return { name, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Load a SKILL.md file, returning truncated content.
 * Returns empty string if file doesn't exist or can't be read.
 */
function loadSkillContent(skillDir: string): string {
  try {
    const skillFile = path.join(SKILLS_DIR, skillDir, 'SKILL.md')
    if (!fs.existsSync(skillFile)) return ''
    const content = fs.readFileSync(skillFile, 'utf-8')
    // Strip YAML frontmatter if present
    const body = content.replace(/^---[\s\S]*?---\n?/, '').trim()
    if (body.length <= MAX_SKILL_CHARS) return body
    return body.slice(0, MAX_SKILL_CHARS) + '\n\n[truncated...]'
  } catch {
    return ''
  }
}

/**
 * Get all available ECC skill directory names.
 */
function getSkillNames(): string[] {
  try {
    return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  } catch {
    return []
  }
}

/**
 * Main entry point: given a prompt, return relevant ECC skill content
 * to inject into an agent's instructions.
 *
 * Returns empty string if no relevant skills found.
 */
export function getRelevantSkills(prompt: string): string {
  const keywords = extractKeywords(prompt)
  if (keywords.length === 0) return ''

  const skillNames = getSkillNames()
  if (skillNames.length === 0) return ''

  const matches = matchSkills(keywords, skillNames)
  if (matches.length === 0) return ''

  const parts: string[] = []
  let totalChars = 0

  for (const match of matches.slice(0, 6)) {
    const content = loadSkillContent(match.name)
    if (!content) continue
    if (totalChars + content.length > MAX_TOTAL_CHARS) break
    parts.push(`\n<!-- ECC SKILL: ${match.name} (score: ${match.score}) -->\n${content}`)
    totalChars += content.length
  }

  if (parts.length === 0) return ''

  return `\n<!-- ── ECC SKILL INJECTION (${parts.length} skills matched) ── -->\n${parts.join('\n')}\n<!-- ── END ECC SKILL INJECTION ── -->\n`
}
