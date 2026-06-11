/**
 * ECC Rules Injector — MetaBuff v1.7.0
 *
 * NOTE: This is a REFERENCE implementation. The actual rules injection
 * logic is inlined inside metabuff.ts handleSteps (withECCContext function).
 * This file documents the full algorithm with all 30+ language patterns.
 * When MetaBuff spawns an agent, it uses getRelevantRules() to detect the
 * language/framework from the prompt and loads matching rule packs.
 *
 * Rule structure:
 *   .agents/rules/ecc/common/    — Always injected (baseline)
 *   .agents/rules/ecc/typescript/ — TypeScript/React/Next.js
 *   .agents/rules/ecc/python/    — Python/Django/Flask
 *   .agents/rules/ecc/web/       — HTML/CSS/Frontend
 *   + 16 more language/framework packs
 *
 * How it works:
 *   1. Detect language/framework from prompt keywords
 *   2. Always load rules/common/ as baseline
 *   3. Load matching language-specific rule packs
 *   4. Return concatenated rule content for injection
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const RULES_DIR = '.agents/rules/ecc'

/** Maximum total rule content injected */
const MAX_RULE_CHARS = 6000

/**
 * Language/framework detection patterns.
 * Maps keywords to rule directory names.
 */
const LANGUAGE_PATTERNS: Record<string, string> = {
  typescript: 'typescript',
  'next\\.?js': 'typescript',
  'nextjs': 'typescript',
  'next js': 'typescript',
  'react': 'typescript',
  'node\\.?js': 'typescript',
  'nodejs': 'typescript',
  'node js': 'typescript',
  'tailwind': 'typescript',
  'prisma': 'typescript',
  'tsx?\\b': 'typescript',
  'python': 'python',
  'django': 'python',
  'flask': 'python',
  'fastapi': 'python',
  'pytest': 'python',
  'scraper': 'python',
  'wiktionary': 'python',
  'golang?': 'golang',
  'go build': 'golang',
  'rust': 'rust',
  'cargo': 'rust',
  'java\\b': 'java',
  'spring': 'java',
  'kotlin': 'kotlin',
  'php': 'php',
  'laravel': 'php',
  'ruby': 'ruby',
  'rails': 'ruby',
  'swift': 'swift',
  'angular': 'angular',
  'cpp': 'cpp',
  'c\\+\\+': 'cpp',
  'csharp': 'csharp',
  'c#': 'csharp',
  'dart': 'dart',
  'flutter': 'dart',
  'fsharp': 'fsharp',
  'f#': 'fsharp',
  'perl': 'perl',
  'html': 'web',
  'css': 'web',
  'frontend': 'web',
}

/**
 * Detect which rule packs are relevant based on prompt keywords.
 */
function detectRulePacks(prompt: string): string[] {
  const lower = prompt.toLowerCase()
  const packs = new Set<string>()

  for (const [pattern, pack] of Object.entries(LANGUAGE_PATTERNS)) {
    try {
      if (new RegExp(`\\b${pattern}\\b`, 'i').test(lower)) {
        packs.add(pack)
      }
    } catch {
      // Skip malformed patterns
    }
  }

  return [...packs]
}

/**
 * Load all .md files from a rule directory, returning concatenated content.
 */
function loadRuleDir(dirName: string): string {
  try {
    const dirPath = path.join(RULES_DIR, dirName)
    if (!fs.existsSync(dirPath)) return ''
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'))
    if (files.length === 0) return ''
    const parts = files.map(f => {
      const content = fs.readFileSync(path.join(dirPath, f), 'utf-8')
      // Take first 800 chars per file to avoid bloat
      return content.length > 800 ? content.slice(0, 800) + '\n...' : content
    })
    return `\n<!-- ECC RULES: ${dirName} -->\n${parts.join('\n\n')}`
  } catch {
    return ''
  }
}

/**
 * Main entry point: given a prompt, return relevant ECC rule content
 * to inject into an agent's context.
 *
 * Always includes rules/common/ as baseline.
 * Returns empty string if rules directory doesn't exist.
 */
export function getRelevantRules(prompt: string): string {
  if (!fs.existsSync(RULES_DIR)) return ''

  // Always load common rules
  const commonRules = loadRuleDir('common')

  // Detect and load language-specific rules
  const packs = detectRulePacks(prompt)
  const langRules = packs.map(p => loadRuleDir(p)).filter(Boolean).join('')

  const combined = commonRules + langRules
  if (!combined.trim()) return ''

  const truncated = combined.length > MAX_RULE_CHARS
    ? combined.slice(0, MAX_RULE_CHARS) + '\n\n<!-- Rules truncated to fit context budget -->'
    : combined

  return `\n<!-- ── ECC RULES INJECTION ── -->\n${truncated}\n<!-- ── END ECC RULES INJECTION ── -->\n`
}
