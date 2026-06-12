/**
 * MetaBuff — Main Orchestrator v3.1.0
 * ─────────────────────────────────────
 * Makes Freebuff (DeepSeek V4 Pro) behave closer to Claude Opus 4.8 / Antigravity 2.0
 * by enforcing chain-of-thought, routing tasks by complexity, and coordinating
 * Codebuff's built-in agents + MetaBuff's own specialist subagents.
 *
 * ✦ ANTHROPIC SKILLS INTEGRATION (v3.1.0) ✦
 * Tailored integration of anthropics/skills standard into MetaBuff:
 *   • [WHY-OVER-MUST] Enhanced prompts explain reasoning behind instructions.
 *   • [ANTI-PATTERNS] Inject ❌ WRONG vs ✅ CORRECT catalog when coding tasks route.
 *   • [VERIFY-ITERATE] Reference verify-iterate loop in CoT v3 STEP 5 (VERIFY).
 *   • [TEMPLATE] Standardized SKILL.md template with YAML frontmatter for new skills.
 *
 * ✦ SUPERSPOWERS INTEGRATION (v3.0.0) ✦
 * Tailored integration of obra/superpowers methodology into MetaBuff:
 *   • [CoT v3] Brainstorming-gate (STEP 0): design doc required before implementation
 *     for complex/mega tasks. Adapts Superpowers' "no code until design approved" gate.
 *   • [METABUFF-TAILORED DIFFERENCE] Brainstorming is auto-triggered via complexity
 *     analysis, not manual user approval. MetaBuff detects ambiguity and gates
 *     automatically. Manual approval only requested for truly novel architecture.
 *   • [REVIEW] Formalized code review: SHA-bounded review, no performative agreement,
 *     verify-before-implement, severity-tagged findings [CRITICAL|HIGH|MEDIUM|LOW].
 *   • [TDD] Iron Law enforcement: when testing domain scores ≥0.6, TDD skill injected
 *     with mandatory red-green-refactor cycle.
 *   • [FINISH] Finishing workflow: structured completion options added to validator.
 *   • [SDD] Two-stage review (spec compliance → code quality) in mega pipeline.
 *   • [PLANS] Writing-plans methodology: no placeholders, checkbox format, executable steps.
 *
 * CHANGES FROM v3.1.0 → v3.1.1 (BUG FIX):
 *   • [FIX] Mega pipeline passed withECCContext(prompt, prompt) to metabuff-mega.
 *     withECCContext() prepends 4–6 KB of XML comment blocks BEFORE the task text,
 *     so metabuff-mega's thinker-with-files-gemini was receiving
 *     "Task: <!-- ── ECC CONTEXT INJECTION ── --> ..." as its task description.
 *     Freebuff's built-in vagueness heuristic flagged this as VAGUE_PROMPT.
 *     Fixed to pass clean prompt directly. metabuff-mega manages ECC context
 *     internally through SDD_SYSTEM_PREFIX and specialist agent system prompts.
 *
 * CHANGES FROM v3.1.0:
 *   • [ANTHROPIC SKILLS] Integrated anthropics/skills methodology into MetaBuff.
 *     Added 7 skill files (master doc, skill-creator, webapp-testing, mcp-builder,
 *     anti-pattern-prevention, verify-iterate, template).
 *   • [WHY-OVER-MUST] Enhanced systemPrompt to explain reasoning behind instructions.
 *   • [ANTI-PATTERNS] Shared getAntiPatternInjection() helper with tightened regex
 *     injected in both pipelines (simple + complex + reasoner path).
 *   • [VERIFY-ITERATE] RUN→INSPECT→FIX→RE-VERIFY loop embedded in CoT v3 STEP 5.
 *   • [TEMPLATE] Standardized YAML frontmatter template for new skill creation.
 *   • [CACHE] build-skill-cache.ts recursively discovers nested SKILL.md files.
 *
 * CHANGES FROM v2.0.4 → v3.0.0:
 *   • [REFACTOR] Eliminated 14 duplicate language regexes in routeReviewer().
 *     Replaced the stale [RegExp, string][] array with direct calls to the
 *     existing detector functions (isGoTask, isRustTask, etc.) which are
 *     already in scope. This fixed 62 missing keywords across the duplicate
 *     regexes (e.g., routeReviewer missed 'cmake' for C++, 'golangci' for Go,
 *     'lifetime' for Rust, 'swiftui' for Swift, etc.). Zero desync risk now.
 *
 * CHANGES FROM v2.0.2 → v2.0.3:
 *   • [FIX] Domain tag matching: isDocTask regex now matches "documentation"
 *     (was `document|docs?`, now `document(?:ation)?|docs?`). isSecurityAuditTask
 *     now matches "security" alone and "secure" (was `security.?audit`, now
 *     `secur(?:ity|e)(?:.?audit)?`). isTDDTask now matches "testing" as a
 *     standalone alternative (added `testing|` prefix). All three enrichment
 *     domain tags now feed back correctly into keyword scoring.
 *
 * CHANGES FROM v2.0.0 → v2.0.2:
 *   • [FIX] Gap 1: Wrapped metabuff-validator, metabuff-regex-guard, AND
 *     metabuff-mega spawns with withECCContext() in all pipelines. Every
 *     single agent MetaBuff spawns now receives skill + rule + instinct injection.
 *     Zero blind spots remaining.
 *   • [FIX] Gap 2: After think_deeply semantic analysis, enrichedPrompt (with
 *     domain hint tags) is now used as input to computeDomainScores(). This lets
 *     keyword detectors match against enrichment markers, feeding the LLM's deep
 *     understanding back into the deterministic routing logic. Semantic weight
 *     receives a +0.1 boost post-deep-analysis to reflect LLM-confirmed intents.
 *
 * CHANGES FROM v1.9.1 → v2.0.0:
 *   • [SEMANTIC] Semantic intent analysis layer — MetaBuff now deeply understands
 *     user prompts (especially vague ones) via synonym expansion, context inference,
 *     and phrase detection, not just regex keyword matching.
 *   • [ROUTING] Score-based agent routing replaces rigid if-else chain. All 30+
 *     detectors now return confidence scores (0-1). Highest combined score wins.
 *     Tie-breaking by agent priority and specificity.
 *   • [VAGUENESS] Automatic vagueness detection (prompt length, technical term density).
 *     Vague prompts trigger `think_deeply` semantic analysis + enriched synonym matching.
 *     Example: "make this faster" → correctly routes to ecc-performance-optimizer.
 *   • [MULTI-DOMAIN] Multi-domain prompt support — when multiple domains score highly
 *     (e.g., "optimize database queries" = database + performance), the primary agent
 *     gets secondary domain context injected into its prompt.
 *   • [REGISTRY] Agent capability registry maps domains → agents with priorities,
 *     making routing extensible and data-driven.
 *   • [QUAL] Detectors now use confidence scores instead of booleans. Exact keyword
 *     matches yield 1.0; semantic/vague matches yield 0.5-0.8 based on specificity.
 *     All existing keyword matches retain full backward compatibility.
 *
 * CHANGES FROM v1.9.0 → v1.9.1:
 *   • [BUG] Split isJavaTask into Java-only + isKotlinTask — fixes Kotlin routing
 *     to Java agents (Kotlin build errors → ecc-kotlin-build-resolver,
 *     Kotlin reviews → ecc-kotlin-reviewer). Previously dead inline Kotlin regex.
 *   • [BUG] ML build errors: combined isMLTask+isBuildErrorTask routes to
 *     ecc-pytorch-build-resolver (before isMLTask catches it for generic ML review)
 *   • [CLEAN] Removed orphaned isPHPTask/isRubyTask detectors (no agents to route to)
 *
 * CHANGES FROM v1.8.0:
 *   • [QUAL] Expanded routing: 20+ new task detectors covering performance,
 *     security audit, Go, Rust, Java, Kotlin, Swift, C#, ML, network, autonomous,
 *     a11y, React, Django, FastAPI, Flutter, C++, Dart, F# — now 30 detectors
 *   • [QUAL] Language-aware build error routing: Go→go-build-resolver,
 *     Rust→rust-build-resolver, React→react-build-resolver, Java→java-build-resolver,
 *     Kotlin→kotlin-build-resolver, etc.
 *   • [QUAL] Language-aware review routing: Go→go-reviewer, Rust→rust-reviewer,
 *     Java→java-reviewer, Swift→swift-reviewer, C#→csharp-reviewer, React→react-reviewer,
 *     Django→django-reviewer, FastAPI→fastapi-reviewer, Flutter→flutter-reviewer
 *   • [QUAL] Domain routing: performance→ecc-performance-optimizer,
 *     security audit→ecc-security-reviewer, ML→ecc-mle-reviewer,
 *     network→ecc-network-architect, autonomous→ecc-loop-operator,
 *     a11y→ecc-a11y-architect
 *   • [MERGE] ecc-architect v2.0.0 — merged with metabuff-arch (ADR templates +
 *     implementation workflow + hallucination prevention + architecture principles)
 *   • [MERGE] ecc-security-reviewer v2.0.0 — merged with metabuff-security (OWASP +
 *     MetaBuff red-flag scanning + security defaults + implementation workflow)
 *   • [QUAL] Default planner replaced: codebuff/planner → ecc-planner (better planning
 *     with sizing/phasing, risk scoring, independent deliverability)
 *   • [QUAL] Default reviewer replaced: codebuff/reviewer → ecc-code-reviewer
 *     (confidence gates, structured severity, pre-report validation)
 *
 * CHANGES FROM v1.7.0:
 *   • [PERF] Skill hot-load cache system — buildSkillCache() indexes all 249 ECC
 *     skills into .skill-cache.json at Phase 0, eliminating fs reads on every
 *     agent spawn. withECCContext() now queries in-memory cache (O(1) per keyword).
 *   • [PERF] hotReloadSkills() allows mid-session cache re-query when new
 *     context arrives (e.g., after file-picker returns new file names)
 *   • [QUAL] Cache auto-rebuilds when stale (>1 hour) or missing
 *
 * CHANGES FROM v1.6.0:
 *   • [ECC INTEGRATION] Full 63-agent ECC ecosystem integrated (was 15 in v1.6.0)
 *   • [ECC INTEGRATION] Skill injection system — getRelevantSkills() auto-injects
 *     matching ECC skills into spawned agent prompts (249 skills)
 *   • [ECC INTEGRATION] Rules injection system — getRelevantRules() auto-injects
 *     matching ECC rule packs into agent context (20 rule packs)
 *   • [ECC INTEGRATION] Instinct bridge — recordObservation() + queryInstincts()
 *     connect ECC self-learning to MetaBuff's known-issues.md
 *   • [QUAL] All ECC agents available for task routing (63 specialists)
 *
 * CHANGES FROM v1.5.0:
 *   • [ECC INTEGRATION] 15 ECC agents integrated into MetaBuff ecosystem
 *     (ecc-code-reviewer, ecc-planner, ecc-typescript-reviewer, ecc-python-reviewer,
 *      ecc-security-reviewer, ecc-build-error-resolver, ecc-tdd-guide,
 *      ecc-refactor-cleaner, ecc-e2e-runner, ecc-doc-updater, ecc-architect,
 *      ecc-database-reviewer, ecc-loop-operator, ecc-harness-optimizer, ecc-docs-lookup)
 *   • [ECC INTEGRATION] 249 ECC skills imported into .agents/skills/ecc/
 *   • [ECC INTEGRATION] 20 ECC rule packs imported into .agents/rules/ecc/
 *   • [QUAL] ECC routing logic in complex pipeline: architecture → ecc-architect,
 *     TDD → ecc-tdd-guide, E2E → ecc-e2e-runner, build errors → ecc-build-error-resolver,
 *     cleanup → ecc-refactor-cleaner, docs → ecc-doc-updater, database → ecc-database-reviewer
 *   • [QUAL] ECC reviewer routing: review tasks → ecc-code-reviewer (confidence-based),
 *     TypeScript → ecc-typescript-reviewer, Python → ecc-python-reviewer
 *   • [QUAL] 10 new task detectors: isReviewTask, isBuildErrorTask, isTDDTask,
 *     isCleanupTask, isDocTask, isE2ETask, isDatabaseTask, isArchitectureTask,
 *     isTypeScriptTask, isPythonTask
 *
 * CHANGES FROM v1.4.0:
 *   • [QUAL] Scope-aware complexity routing — analyzeComplexityWithScope() replaces
 *     analyzeComplexityWithScope(). A pre-flight basher greps the real codebase for
 *     keywords extracted from the prompt and counts matched files. Actual file count
 *     overrides keyword false positives:
 *       - 1 matched file → hard-caps score to simple (fixes 'refactor login button' FP)
 *       - 2–3 files + no complex keyword → simple (not complex)
 *       - 4–7 files → complex
 *       - 8–15 files → complex (high-end); 16+ → mega
 *       - Cross-cutting (files spread across 4+ dirs) adds escalation bonus
 *       - Reliability guard: if grep matches >40% of total project files, keywords
 *         are too generic → falls back to pure keyword scoring (safe for vague prompts)
 *     Adds 1 lightweight basher spawn (timeout: 15s) before every routing decision.
 *
 * CHANGES FROM v1.3.0:
 *   • [QUAL] isAlgorithmTask detector — routes novel-algorithm/complex-logic tasks
 *     to metabuff-reasoner (effort=high, Socratic protocol) instead of codebuff/planner.
 *     Closes single-model reasoning gap vs Claude Code Opus 4.8 (~55 → ~72/100).
 *   • [QUAL] withCoT upgraded to v2: added STEP 2.5 QUESTION (Socratic pre-flight).
 *     Agents must articulate 3 failure modes before writing code, cutting assumption-
 *     based hallucinations.
 *   • [SAFETY] metabuff-regex-guard added to BOTH simple and complex pipelines.
 *     TypeScript's type checker cannot catch runtime-invalid regex — this closes
 *     the entire class of regex SyntaxError bugs from AI-generated code.
 *   • [QUAL] Complex pipeline: reasoning effort escalated to 'high' for algorithm tasks
 *     (was always 'medium' via codebuff/planner).
 *   • [BUG] isRegexTask detector added — simple tasks only run regex-guard when the
 *     prompt involves patterns/parsing (avoids unnecessary spawn on pure refactors).
 *   • [PERF] Regex guard is a single basher-driven spawn — low overhead, no freeze risk.
 *
 * Architecture:
 *   Task → [Memory read + Skill cache build + Complexity analysis] → MetaBuff orchestrator
 *        → Simple:  base(CoT v2 + ECC skills/rules hot-loaded) → typecheck → [regex-guard] → validator      [2–4 spawns]
 *        → Complex: file-picker → planner|reasoner(CoT v2 + ECC) → reviewer(hot-loaded)         [5–6 spawns]
 *                   → typecheck → regex-guard → validator
 *        → Mega:    metabuff-mega (cascade wave parallel spawning) [delegated]
 *
 * SAFETY FEATURES (v1.4.0):
 *   • All v1.3.0 safety features retained (saturation, diminishing returns, etc.)
 *   • Regex guard — catches runtime-invalid patterns TypeScript misses
 *   • Socratic pre-flight — agents articulate failure modes before coding
 *   • Algorithm task routing — harder reasoning uses higher-effort specialist
 *   • Timeout bounds on all basher commands — no infinite hangs
 *   • Targeted typecheck for simple tasks — not full codebase scan
 *   • Inter-session memory — known-issues.md as mandatory first step
 *
 * CRITICAL NOTE:
 *   All helpers (analyzeComplexity, withCoT, withReview, isAlgorithmTask, isRegexTask)
 *   are inlined inside handleSteps. The agent execution framework extracts only the
 *   exported definition object — module-level function references are NOT preserved.
 */

import { AgentDefinition } from './types/agent-definition'

const definition: AgentDefinition = {
  id: 'metabuff',
  version: '3.1.1',
  displayName: 'MetaBuff Orchestrator',

  spawnerPrompt:
    'Spawn MetaBuff as your primary agent for ANY coding task. ' +
    'It automatically classifies complexity and coordinates the optimal agent pipeline, ' +
    'including CoT enforcement, inter-session memory, continuous validation, ' +
    'regex safety checks, and anti-hallucination protocols.',

  model: (() => {
    try {
      return require('./model-config').resolveModel()
    } catch {
      return 'deepseek/deepseek-v4-flash'
    }
  })(),  // v4-pro confirmed available in free tier; v4-flash was 403 in sub-agent spawns

  reasoningOptions: {
    enabled: true,
    exclude: false,
    effort: 'medium',
  },

  toolNames: ['spawn_agents', 'think_deeply', 'end_turn'],

  spawnableAgents: [
    'ecc-code-architect',        // general-purpose implementation (was codebuff/base)
    'codebuff/file-picker@0.0.1', // codebase mapping
    'thinker-with-files-gemini', // task decomposition / planning
    'ecc-code-reviewer',          // review / synthesis (model-agnostic, avoids free-mode restrictions)
    'researcher-web',            // documentation research
    'researcher-docs',           // API docs research
    'metabuff-validator',
    'metabuff-reasoner',     // v1.4.0: algorithm/logic specialist
    'metabuff-regex-guard',  // v1.4.0: runtime regex safety
    'metabuff-mega',
    'metabuff-autonomous',
    // ── ECC Agents (v1.7.0) — 63 full specialists ────────────────────
    'ecc-a11y-architect',
    'ecc-architect',
    'metabuff-resume',
    'ecc-build-error-resolver',
    'ecc-chief-of-staff',
    'ecc-code-explorer',
    'ecc-code-reviewer',
    'ecc-code-simplifier',
    'ecc-comment-analyzer',
    'ecc-conversation-analyzer',
    'ecc-cpp-build-resolver',
    'ecc-cpp-reviewer',
    'ecc-csharp-reviewer',
    'ecc-dart-build-resolver',
    'ecc-database-reviewer',
    'ecc-django-build-resolver',
    'ecc-django-reviewer',
    'ecc-docs-lookup',
    'ecc-doc-updater',
    'ecc-e2e-runner',
    'ecc-fastapi-reviewer',
    'ecc-flutter-reviewer',
    'ecc-fsharp-reviewer',
    'ecc-gan-evaluator',
    'ecc-gan-generator',
    'ecc-gan-planner',
    'ecc-go-build-resolver',
    'ecc-go-reviewer',
    'ecc-harmonyos-app-resolver',
    'ecc-harness-optimizer',
    'ecc-healthcare-reviewer',
    'ecc-homelab-architect',
    'ecc-hypothesis-generator',
    'ecc-vision-analyst',
    'ecc-java-build-resolver',
    'ecc-java-reviewer',
    'ecc-kotlin-build-resolver',
    'ecc-kotlin-reviewer',
    'ecc-loop-operator',
    'ecc-marketing-agent',
    'ecc-mle-reviewer',
    'ecc-network-architect',
    'ecc-network-config-reviewer',
    'ecc-network-troubleshooter',
    'ecc-opensource-forker',
    'ecc-opensource-packager',
    'ecc-opensource-sanitizer',
    'ecc-performance-optimizer',
    'ecc-planner',
    'ecc-pr-test-analyzer',
    'ecc-python-reviewer',
    'ecc-pytorch-build-resolver',
    'ecc-react-build-resolver',
    'ecc-react-reviewer',
    'ecc-refactor-cleaner',
    'ecc-rust-build-resolver',
    'ecc-rust-reviewer',
    'ecc-security-reviewer',
    'ecc-seo-specialist',
    'ecc-silent-failure-hunter',
    'ecc-swift-build-resolver',
    'ecc-swift-reviewer',
    'ecc-tdd-guide',
    'ecc-type-design-analyzer',
    'ecc-typescript-reviewer',
  ],

  systemPrompt:
    'You are MetaBuff, an intelligent orchestration layer that coordinates AI coding agents. ' +
    'Your job is NOT to write code yourself — it is to decompose tasks, select the right agents, ' +
    'and ensure every output is verified before delivery. ' +
    'Always prefer precision over speed. ' +
    'Explain WHY behind your routing decisions, not just WHAT you are routing — agents perform better when they understand the reasoning. ' +
    'This is the Anthropic Skills "why over must" philosophy: understanding beats compliance.',

  handleSteps: function* ({ prompt }) {

    // ─── SESSION F: RECOVERY CHECK ───────────────────────────────────────────
    const { toolResult: recoveryCheck } = (yield {
      toolName: 'run_terminal_command',
      input: {
        command: `if [ -f .agents/.recovery/latest.json ] && grep -q '"status": "in-progress"' .agents/.recovery/latest.json; then echo "RESUMABLE"; else echo "NONE"; fi`
      }
    }) as { toolResult: string }

    if (typeof recoveryCheck === 'string' && recoveryCheck.includes('RESUMABLE')) {
      const isResume = /\\b(resume|continue)\\b/i.test(prompt)
      if (isResume) {
        yield {
          toolName: 'spawn_agents',
          input: { agents: [{ agent_type: 'metabuff-resume', prompt }] }
        }
        return
      } else {
        yield {
          toolName: 'think_deeply',
          input: { thought: 'There is an incomplete task in progress. I should inform the user they can resume it.' }
        }
        yield {
          toolName: 'run_terminal_command',
          input: { command: `echo "⚠ An interrupted task was found in progress. To resume it, run your command again with the word 'resume' or 'continue'."` }
        }
        return
      }
    }

    // ─── SAFETY BOUNDS ────────────────────────────────────────────────────────

    /** Maximum complexity score — prevents runaway mega classification */
    const COMPLEXITY_SATURATION = 8

    /** Timeout for basher commands in seconds */
    const BASHER_TIMEOUT = 60

    /** Minimum score threshold to consider a domain "matched" */
    const MIN_DOMAIN_SCORE = 0.35

    /** Vagueness threshold: above this, semantic enrichment gets higher weight */
    // const VAGUE_PROMPT_THRESHOLD = 0.5  // inlined below due to generator TDZ issue

    // ─── HELPER: Complexity scorer (v1.5.0 — scope-aware) ────────────────────
    /**
     * Combines keyword heuristics (v1.4 behaviour, kept as fallback) with
     * real file-count data written by the pre-flight scope basher in Phase 0.5.
     *
     * scope.reliable is false when:
     *   • No meaningful keywords could be extracted from the prompt (vague task)
     *   • grep matched >40% of project files (keywords too generic, e.g. "file", "code")
     * In those cases the function falls through to pure keyword scoring.
     */
    function analyzeComplexityWithScope(
      p: string,
      scope: { matchedFiles: number; totalFiles: number; dirCount: number; reliable: boolean }
    ): 'simple' | 'complex' | 'mega' {
      const lower = p.toLowerCase()
      let score = 0
      let megaHits = 0
      let complexHits = 0

      // ── Tier 1: mega keywords ─────────────────────────────────────────────
      const megaKw = [
        'from scratch', 'entire codebase', 'full system',
        'complete rewrite', 'new architecture', 'all files', 'every file',
        'migrate entire', 'redesign everything', 'operating system',
      ]
      for (const kw of megaKw) {
        if (lower.includes(kw)) {
          megaHits++
          score += Math.max(1, 4 - (megaHits - 1) * 1.5)
        }
      }

      // ── Tier 2: complex keywords ──────────────────────────────────────────
      const complexKw = [
        'refactor', 'architecture', 'redesign', 'integrate', 'migrate',
        'add auth', 'add authentication', 'database migration',
        'all endpoints', 'all components', 'performance',
        'multiple files', 'across the', 'everywhere',
        'add new', 'create new', 'implement',
        'new api', 'new route', 'new endpoint',
        'new component', 'new page', 'new feature',
        'add tests', 'write tests', 'unit test',
      ]
      for (const kw of complexKw) {
        if (lower.includes(kw)) {
          complexHits++
          score += Math.max(0.5, 2 - (complexHits - 1) * 0.5)
        }
      }

      // ── Tier 3: explicit filenames in prompt text (v1.4 behaviour) ────────
      const fileMatches = p.match(/\b\w+\.(ts|tsx|js|jsx|py|go|rs|java|cpp|cs)\b/g)
      if (fileMatches) {
        const uniqueFiles = new Set(fileMatches)
        if (uniqueFiles.size > 8) score += 2
        else if (uniqueFiles.size > 4) score += 1
        else if (uniqueFiles.size > 2) score += 0.5
      }

      // ── Tier 4: PascalCase component names (v1.4 behaviour) ──────────────
      const componentMatches = p.match(/\b[A-Z][a-z]+[A-Z][a-zA-Z]*\b/g)
      if (componentMatches) {
        const uniqueComps = new Set(componentMatches)
        if (uniqueComps.size > 3) score += 2
        else if (uniqueComps.size > 1) score += 1
      }

      // ── Tier 5: cross-cutting concern counter (v1.4 behaviour) ───────────
      const concerns = [
        'api', 'database', 'db', 'schema', 'migration', 'config',
        'deploy', 'ci', 'component', 'auth', 'middleware', 'query',
      ]
      let concernCount = 0
      for (const c of concerns) {
        if (lower.includes(c)) concernCount++
      }
      if (concernCount > 4) score += 2
      else if (concernCount > 2) score += 1

      if (p.length > 500) score += 1

      // ── NEW v1.5.0: Real file-scope override ──────────────────────────────
      // Applies only when the pre-flight grep was reliable (specific enough keywords,
      // matched < 40% of the project). Actual codebase evidence beats keywords.
      if (scope.reliable && scope.matchedFiles >= 0) {
        const { matchedFiles, dirCount } = scope

        // Cross-cutting bonus: same file count is harder when spread across dirs
        const crossCutting = dirCount >= 4

        if (matchedFiles === 0) {
          // Keywords had no grep hits — vague prompt, keep keyword score unchanged
        } else if (matchedFiles === 1) {
          // Definitively single-file — hard-cap to simple even if 'refactor' is present
          // ("refactor the login button" touching 1 file IS a simple task)
          score = Math.min(score, 1.9)
        } else if (matchedFiles <= 3) {
          // 2–3 files: keep at simple UNLESS keyword score already says complex
          // ("refactor auth.ts and user.ts" with 2 files still warrants complex pipeline)
          const fileScore = score >= 2 ? 2.5 : 1.5
          score = Math.max(score, fileScore)
        } else if (matchedFiles <= 7) {
          // 4–7 files: solidly complex
          score = Math.max(score, 2.5)
        } else if (matchedFiles <= 15) {
          // 8–15 files OR 5+ files cross-cutting: high-end complex (approaching mega)
          const fileScore = crossCutting ? 4.5 : 4
          score = Math.max(score, fileScore)
        } else {
          // 16+ files, or 10+ cross-cutting: mega territory
          score = Math.max(score, 6)
        }
      }

      score = Math.min(score, COMPLEXITY_SATURATION)

      if (score >= 6) return 'mega'
      if (score >= 2) return 'complex'
      return 'simple'
    }

    // ─── HELPER: Anti-pattern injection (Anthropic Skills v3.1.0) ────────────
    /**
     * Returns anti-pattern prevention injection when the prompt involves coding.
     * Tightened regex: only injects for significant code-authoring verbs,
     * not for trivial words like "add" or "change" that appear in most prompts.
     */
    function getAntiPatternInjection(p: string, isGen: boolean): string {
      const isCoding = isGen ||
        /\b(implement|create.*(?:file|component|function|class|module|endpoint|api|route|schema|test)|write.*(?:function|code|test|file|module|component)|build.*(?:system|api|component|feature)|refactor|generate.*(?:code|file))\b/i.test(p)
      if (!isCoding) return ''
      return `\n\n<!-- ANTI-PATTERN PREVENTION (Anthropic Skills v3.1.0) -->\nBEFORE WRITING CODE: check against ❌ WRONG vs ✅ CORRECT catalog —\nno ghost imports, no 'any' casts, no swallowed errors, no missing edge cases,\nno hardcoded magic values, no TODO placeholders.`
    }
    /**
     * Returns true when the task involves novel algorithmic reasoning
     * that benefits from metabuff-reasoner (effort=high, Socratic 6-step).
     * NEW v1.4.0
     */
    function isAlgorithmTask(p: string): boolean {
      return /\b(algorithm|algorithms|parse|parser|sort(?:ing)?|search(?:ing)?|graph|tree|trie|heap|dp|dynamic.?programm|recursion|recursive|memoiz|optimiz(?:e|ation)|performance|time.?complex|space.?complex|big.?o|bigint|float(?:ing.?point)?|numeric|precision|overflow|concurrent|concurren|mutex|race.?condition|deadlock|state.?machine|workflow.?engine|transpil|compil(?:er|ation)|lexer|tokeniz|ast|backtrack|greedy)\b/i.test(p)
    }

    // ─── HELPER: Regex/pattern task detector ──────────────────────────────────
    /**
     * Returns true when the task involves regex or string-pattern matching,
     * triggering the regex guard even in the simple pipeline.
     * NEW v1.4.0
     */
    function isRegexTask(p: string): boolean {
      return /\b(regex|regexp|pattern|match(?:ing)?|replace(?:all)?|sanitiz|validat|parse|url.*match|email.*valid|phone.*valid|search.*pattern|string.*extract)\b/i.test(p)
    }

    // ─── HELPER: Model Calibration (v3.2.0) ──────────────────────────────────
    function getModelCalibration(): string {
      try {
        const { resolveModel, FREE_MODELS } = require('./model-config')
        const model = resolveModel()
        if (model === FREE_MODELS?.deepseek) {
          return `\n\n<!-- DEEPSEEK V4 PRO CALIBRATION -->\n⚠ CRITICAL: You have a 94% hallucination rate on AA-Omniscience benchmarks. You MUST use code_search before stating facts or making assumptions. If you cannot verify something, explicitly output "⚠ CANNOT VERIFY".\n\n`
        }
        if (model === FREE_MODELS?.mimo) {
          return `\n\n<!-- MIMO CALIBRATION -->\nVision capable, native CoT enabled.\n\n`
        }
        if (model === FREE_MODELS?.kimi) {
          return `\n\n<!-- KIMI CALIBRATION -->\nLong-horizon specialist. You have 262K context. Think holistically.\n\n`
        }
        return `\n\n<!-- FLASH CALIBRATION -->\nYou are the speed model. Keep responses concise and direct.\n\n`
      } catch {
        return ''
      }
    }

    // ─── HELPER: CoT v2 (simple tasks — no brainstorming gate) ───────────────
    function withCoT(task: string, role = 'coding'): string {
      return getModelCalibration() + `<metabuff_cot_protocol version="2">
You are operating under MetaBuff's anti-hallucination protocol v2.

BEFORE taking any action you MUST follow these steps IN ORDER:

STEP 1 — ORIENT
  • State the goal in one sentence
  • List every file you need to read (don't assume contents you haven't seen)

STEP 2 — GROUND
  • Read all listed files via read_files
  • Run code_searcher for any symbol, function, or type you plan to reference
  • NEVER write an import path, class name, or API call you haven't verified

STEP 2.5 — QUESTION  ← Socratic pre-flight (do not skip)
  • Ask yourself: "What are 3 specific ways this implementation could be wrong?"
  • Ask yourself: "What am I assuming that I haven't yet verified with a tool call?"
  • Does this task involve regex, string parsing, or pattern matching?
    If yes → flag it with: "⚠ REGEX RISK — will verify all patterns after implementation"
  • For each assumption: resolve it with a tool call BEFORE proceeding to STEP 3
  • Do NOT proceed to STEP 3 while any unresolved assumption exists

STEP 3 — PLAN
  • Write a numbered action plan (what changes in what files in what order)
  • Each step MUST reference specific files and be verifiable — NO placeholders
  • Flag any remaining uncertainty as: "⚠ UNCERTAIN: [thing you are not sure about]"
  • Resolve all uncertainties with tool calls before proceeding

STEP 4 — EXECUTE
  • Carry out each step one at a time
  • Use str_replace for targeted edits; write_file only for new files
  • After each edit, narrate: "✓ DONE: [what changed and why it's correct]"

STEP 5 — VERIFY
  • Re-read changed files to confirm the edit landed correctly
  • Run any available tests or lint commands via basher
  • If anything looks wrong, fix it before calling end_turn
  • If you flagged ⚠ REGEX RISK above: explicitly state that regex-guard will follow

GROUNDING RULES (never violate):
  ✗ Do not reference a file path without having read it this session
  ✗ Do not assume a function or type exists — verify with code_searcher
  ✗ Do not invent package names or import paths
  ✗ Do not leave TODOs or placeholder code in the final output
  ✗ Do not call end_turn if there are unresolved ⚠ UNCERTAIN items
</metabuff_cot_protocol>

<task role="${role}">
${task}
</task>`
    }

    // ─── HELPER: CoT v3 (complex/mega — with SUPERSPOWERS brainstorming gate) ─
    /**
     * v3.0.0: adds STEP 0 BRAINSTORM-GATE — design doc before implementation.
     * Adapted from obra/superpowers: "NO CODE until design is authored, committed, approved."
     * METABUFF-TAILORED: auto-triggered by complexity analysis, not manual approval.
     */
    function withCoTv3(task: string, role = 'coding'): string {
      return getModelCalibration() + `<metabuff_cot_protocol version="3">
You are operating under MetaBuff's Superpowers-enhanced anti-hallucination protocol v3.

PROTOCOL UPGRADE v3 (SUPERSPOWERS INTEGRATION):
  This task reached the complex threshold. A design gate is enforced before implementation.

BEFORE taking any action you MUST follow these steps IN ORDER:

STEP 0 — BRAINSTORM-GATE  ← SUPERSPOWERS: design before code (do not skip)
  This is a HARD GATE. NO code shall be written until this step completes.
  
  0.1 — SCOPE the task:
    • What exactly needs to change? List ALL files that will be touched.
    • What is the desired end state? Describe the user-visible or system-visible outcome.
    • What is OUT of scope? Guard against scope creep.
  
  0.2 — DESIGN the approach:
    • Architecture: what new files, types, interfaces, or schemas are needed?
    • Data flow: how does data move through the system after this change?
    • Integration: how does this connect to existing code? List specific imports/exports.
    • Edge cases: empty input, error paths, boundary conditions — enumerate ALL.
  
  0.3 — VALIDATE assumptions:
    • What am I assuming that I haven't yet verified?
    • For each assumption: resolve with a tool call (read_files, code_searcher) NOW
    • Do NOT proceed until ALL assumptions are verified OR explicitly flagged ⚠ UNCERTAIN
  
  0.4 — STATE the design:
    • Write a concise design summary: "I will [approach] by [method]."
    • Signal readiness: "DESIGN COMPLETE → ready for implementation."

STEP 1 — ORIENT
  • State the goal in one sentence
  • Confirm: design is complete. List every file you need to read.

STEP 2 — GROUND
  • Read all listed files via read_files
  • Run code_searcher for any symbol, function, or type you plan to reference
  • NEVER write an import path, class name, or API call you haven't verified

STEP 2.5 — QUESTION  ← Socratic pre-flight
  • Ask yourself: "What are 3 specific ways this implementation could be wrong?"
  • Ask yourself: "What am I assuming that I haven't yet verified?"
  • Does this task involve regex, string parsing, or pattern matching?
    If yes → flag with: "⚠ REGEX RISK"
  • For each assumption: resolve it with a tool call BEFORE proceeding to STEP 3

STEP 3 — PLAN (SUPERSPOWERS writing-plans methodology)
  • Write a checkbox-formatted action plan. Each step MUST:
    - Reference specific files to create/modify
    - Include a verification method (test, typecheck, or manual check)
    - Be completable in 2–5 minutes
  • FORMAT: "- [ ] N. [action] → File: [path] → Verify: [method]"
  • NO PLACEHOLDERS — no "TBD", no "will figure out later"
  • Flag uncertainties: "⚠ UNCERTAIN: [question]" and resolve with tool calls

STEP 4 — EXECUTE
  • Carry out each plan step one at a time
  • Use str_replace for targeted edits; write_file only for new files
  • After each edit, narrate: "✓ DONE: [what changed and why it's correct]"
  • If TDD Iron Law applies: write the FAILING TEST FIRST, then the implementation

STEP 5 — VERIFY (Anthropic Skills: verify-iterate loop)
  • Re-read changed files to confirm the edit landed correctly
  • Run tests via basher: each plan step's verification must pass
  • Run typecheck: (bun run typecheck 2>/dev/null || npx tsc --noEmit)
  • Apply the VERIFY-ITERATE loop:
    RUN tests → INSPECT results → FIX issues → RE-VERIFY (max 3 iterations)
  • If issues persist after 3 loops, flag ⚠ NEEDS REVIEW
  • If anything looks wrong, fix it before calling end_turn
  • If you flagged ⚠ REGEX RISK: explicitly state that regex-guard will follow

GROUNDING RULES (never violate):
  ✗ Do not reference a file path without having read it this session
  ✗ Do not assume a function or type exists — verify with code_searcher
  ✗ Do not invent package names or import paths
  ✗ Do not leave TODOs or placeholder code in the final output
  ✗ Do not call end_turn if there are unresolved ⚠ UNCERTAIN items
  ✗ Do not write ANY code until STEP 0 is complete (design gate)
</metabuff_cot_protocol>

<task role="${role}">
${task}
</task>`
    }

    // ─── HELPER: Formalized review wrapper (SUPERSPOWERS) ───────────────────────
    /**
     * v3.0.0: enhanced with Superpowers formalized code review principles:
     * SHA-bounded, no performative agreement, verify-before-implement,
     * severity-tagged findings, technical argumentation over compromise.
     */
    function withReview(task: string): string {
      return `<metabuff_review_protocol version="2">
You are a reviewer in MetaBuff's Superpowers-enhanced review pipeline.

CORE PRINCIPLE: Review is technically scoped. Examine what CHANGED, not what you
wish the codebase looked like. Review is READ-ONLY — do NOT re-implement.

FORMALIZED REVIEW PROTOCOL:

1. SCOPE the review
   • Get SHA-bounded diff: use basher to run: git diff HEAD
   • List every changed file with line counts
   • This review is scoped to THOSE changes only — no scope creep

2. READ every changed file in full (use read_files)

3. VERIFY-FIRST (do not assert without evidence):
   • Check each import → code_searcher to verify the imported symbol exists
   • Check each function call → code_searcher to verify the function exists
   • Check each type reference → code_searcher to verify the type is defined
   • Do NOT claim an issue exists without reproducing it or providing a trace

4. FIND issues — tag with SEVERITY:
   [CRITICAL] — runtime error, data loss, security breach → BLOCK merge
   [HIGH]     — incorrect behavior, broken test → should fix
   [MEDIUM]   — code quality, missing test, convention violation → note for follow-up
   [LOW]      — style preference, naming suggestion → optional

5. REVIEW LANGUAGE (SUPERSPOWERS: no performative agreement):
   PROHIBITED: "Great point!", "Nice work!", "LGTM!", "Looks good to me"
   REQUIRED: "Verified: [claim]", "Found: [issue] at [file:line] → [analysis]",
             "Checked: [file] — no issues found"

6. FIX issues (surgical str_replace only):
   • Fix CRITICAL + HIGH issues NOW
   • Note MEDIUM issues for follow-up
   • Skip LOW issues (do not block)

7. REPORT: one of:
   ✅ REVIEW PASSED — [N] files checked, [M] issues fixed
   ❌ REVIEW BLOCKED — [CRITICAL/HIGH issues that must be addressed]

RULES:
  ✗ Do not re-write large sections unless there is a concrete [CRITICAL] bug
  ✗ Do not call end_turn while [CRITICAL] or [HIGH] issues are unfixed
  ✗ Do not invent problems that aren't there
  ✗ Do not use performative praise — technical language only
  ✗ Verify every claim before asserting it
</metabuff_review_protocol>

<review_task>
${task}
</review_task>`
    }

    // ─── PHASE 0: INTER-SESSION MEMORY ────────────────────────────────────────
    yield {
      toolName: 'run_terminal_command',
      input: {
        command:
          'if [ -f .agents/known-issues.md ]; then ' +
          '  echo "=== INTER-SESSION MEMORY ===" && ' +
          '  cat .agents/known-issues.md; ' +
          'else ' +
          '  echo "No known-issues.md found — first session."; ' +
          'fi',
      },
    }

    // ─── PHASE 0.5: FILE SCOPE PRE-FLIGHT ────────────────────────────────────
    // Grep the real codebase for keywords extracted from the prompt.
    // Writes { matchedFiles, totalFiles, dirCount, reliable } to .agents/.scope-tmp.json
    // which analyzeComplexityWithScope() reads synchronously after this yield.
    const safePromptForBash = prompt
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "'\\''")
      .replace(/\n/g, ' ')
      .slice(0, 400)

    yield {
      toolName: 'run_terminal_command',
      input: {
        command: [
              // Extract meaningful keywords: >3 chars, lowercase, minus stop words
              `KEYWORDS=$(echo '${safePromptForBash}' \\`,
              `  | tr '[:upper:]' '[:lower:]' \\`,
              `  | grep -oE '[a-zA-Z]{4,}' \\`,
              `  | grep -vxE 'this|that|with|from|have|will|your|into|when|them|they|what|file|code|make|want|need|just|like|some|more|then|also|than|even|only|over|back|here|there|their|been|were|does|dont|should|would|could|change|update|every|other|same|such|very|much|many|well|still|down|first|last|next|always|often|across|without|within|along|through|around|between|during|against|inside|outside|toward|under|until|upon|while|since|each|both|about|above|below|where|after|before|already|again|never|using|please|really|just|simply|whether|something|anything|nothing|everything' \\`,
              `  | sort -u | head -8 | tr '\\n' '|' | sed 's/|$//')`,
              ``,
              // Count total source files (excluding noise dirs)
              `TOTAL=$(find . -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' -o -name '*.go' -o -name '*.rs' -o -name '*.java' \\) \\`,
              `  | grep -v node_modules | grep -v '\\.git' | grep -v dist | grep -v '\\.next' | grep -v coverage | grep -v __pycache__ \\`,
              `  | wc -l | tr -d ' ')`,
              ``,
              // Grep codebase for matched files
              `if [ -n "$KEYWORDS" ]; then`,
              `  MATCHED=$(grep -rli --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.py' --include='*.go' --include='*.rs' \\`,
              `    -E "$KEYWORDS" . 2>/dev/null \\`,
              `    | grep -v node_modules | grep -v '\\.git' | grep -v dist | grep -v '\\.next' | wc -l | tr -d ' ')`,
              `  # Count distinct directories of matched files (cross-cutting signal)`,
              `  DIRS=$(grep -rli --include='*.ts' --include='*.tsx' --include='*.js' --include='*.py' \\`,
              `    -E "$KEYWORDS" . 2>/dev/null \\`,
              `    | grep -v node_modules | grep -v '\\.git' | grep -v dist \\`,
              `    | sed 's|/[^/]*$||' | sort -u | wc -l | tr -d ' ')`,
              `  # Reliability check: if matched > 40% of total, keywords are too generic`,
              `  THRESH=$(( TOTAL * 2 / 5 + 1 ))`,
              `  if [ "$TOTAL" -gt 0 ] && [ "$MATCHED" -le "$THRESH" ]; then RELIABLE=true; else RELIABLE=false; fi`,
              `else`,
              `  MATCHED=0; DIRS=0; RELIABLE=false`,
              `fi`,
              ``,
              // Write JSON result
              `printf '{"matchedFiles":%s,"totalFiles":%s,"dirCount":%s,"reliable":%s}\\n' \\`,
              `  "$MATCHED" "$TOTAL" "$DIRS" "$RELIABLE" > .agents/.scope-tmp.json`,
              `echo "scope: ${safePromptForBash}" `,
              `echo "scope-result: matched=$MATCHED total=$TOTAL dirs=$DIRS reliable=$RELIABLE keys=$KEYWORDS"`,
            ].join('\n'),
      },
    }

    // Read scope data synchronously before routing.
    // handleSteps is a synchronous generator — code between yields runs in the
    // main Node.js thread, so readFileSync is safe here.
    let scopeData: { matchedFiles: number; totalFiles: number; dirCount: number; reliable: boolean } = {
      matchedFiles: -1, totalFiles: 0, dirCount: 0, reliable: false,
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const fs = require('fs')
      const raw: string = fs.readFileSync('.agents/.scope-tmp.json', 'utf8')
      scopeData = JSON.parse(raw)
      try { fs.unlinkSync('.agents/.scope-tmp.json') } catch { /* cleanup best-effort */ }
    } catch {
      // Scope file unavailable (first run, timeout, or unsupported env)
      // analyzeComplexityWithScope falls back to keyword-only scoring when reliable=false
    }

    // ─── PHASE 0.6: SKILL CACHE BUILD & HOT-LOAD v1.8.0 ────────────────────
    // Build a JSON cache index of all 249 ECC skills once per session.
    // Subsequent lookups are O(1) memory reads — no more fs.readdirSync/readFileSync per agent spawn.
    // Cache auto-rebuilds when missing or stale (>1 hour).
    yield {
      toolName: 'run_terminal_command',
      input: {
        command: 'CACHE_FILE=.agents/.skill-cache.json; ' +
              'if [ ! -f "$CACHE_FILE" ] || [ $(find "$CACHE_FILE" -mmin +60 2>/dev/null | wc -l) -gt 0 ]; then ' +
              '  echo "=== BUILDING SKILL CACHE ===" && ' +
              '  (bun run scripts/ts/build-skill-cache.ts 2>/dev/null || npx tsx scripts/ts/build-skill-cache.ts 2>/dev/null || echo "Cache build skipped") && ' +
              '  echo "Cache built at $(date -Iseconds)"; ' +
              'else ' +
              '  echo "Skill cache is fresh ($(stat -c %y $CACHE_FILE 2>/dev/null || date -Iseconds))"; ' +
              'fi',
      },
    }

    // ─── HELPER: Hot-load skill cache into memory (v1.8.0) ─────────────────
    /** In-memory cache. Loaded once per session. */
    let skillCache: { index: Record<string, string[]>; skills: Record<string, string>; skillCount: number } | null = null

    function loadSkillCache(): { index: Record<string, string[]>; skills: Record<string, string>; skillCount: number } {
      if (skillCache) return skillCache
      try {
        const fs = require('fs')
        const cacheFile = '.agents/.skill-cache.json'
        if (fs.existsSync(cacheFile)) {
          const raw = fs.readFileSync(cacheFile, 'utf-8')
          skillCache = JSON.parse(raw)
          return skillCache!
        }
      } catch { /* cache unavailable — fall back gracefully */ }
      return { index: {}, skills: {}, skillCount: 0 }
    }

    /**
     * Query skill cache by keywords. Uses the inverted index for O(1) lookups
     * instead of iterating all 249 skills. Falls back to name-matching if index is empty.
     * Returns concatenated skill content up to maxChars total.
     */
    function querySkillCache(keywords: string[], maxSkills = 4, maxChars = 6000): string {
      const cache = loadSkillCache()
      if (cache.skillCount === 0 || keywords.length === 0) return ''

      // Use inverted index for O(1) keyword → skill lookups
      const matchedSkills = new Map<string, number>() // skillName → score

      if (Object.keys(cache.index).length > 0) {
        // O(K) where K = number of keywords (typically 5-15)
        for (const kw of keywords) {
          const matches = cache.index[kw]
          if (matches) {
            for (const skillName of matches) {
              matchedSkills.set(skillName, (matchedSkills.get(skillName) || 0) + 1)
            }
          }
        }
      } else {
        // Fallback: name-based matching if index wasn't built
        for (const skillName of Object.keys(cache.skills)) {
          const parts = skillName.split('-')
          const score = keywords.filter(kw => parts.some(p => p.includes(kw) || kw.includes(p))).length
          if (score > 0) matchedSkills.set(skillName, score)
        }
      }

      const scored = [...matchedSkills.entries()]
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSkills)

      if (scored.length === 0) return ''

      const blocks: string[] = []
      let total = 0
      for (const s of scored) {
        const content = cache.skills[s.name]
        if (!content) continue
        if (total + content.length > maxChars) {
          blocks.push(`\n<!-- ECC SKILL: ${s.name} (score: ${s.score}) -->\n${content.slice(0, maxChars - total)}`)
          break
        }
        blocks.push(`\n<!-- ECC SKILL: ${s.name} (score: ${s.score}) -->\n${content}`)
        total += content.length
      }

      return blocks.length > 0
        ? `\n<!-- ECC SKILLS (${scored.length} matched from ${cache.skillCount} cached, O(1) index lookup) -->${blocks.join('\n')}`
        : ''
    }

    /**
     * Hot-reload: re-query the skill cache with NEW keywords mid-pipeline.
     * Used when new context arrives (e.g., after file-picker results or error messages).
     * Does NOT rebuild the cache — just runs a fresh keyword match against the existing index.
     */
    function hotReloadSkills(newContext: string, maxSkills = 3, maxChars = 4000): string {
      const kw = (newContext.toLowerCase().match(/[a-z]{4,}/g) || [])
        .filter((w: string) => !['this', 'that', 'with', 'from', 'have', 'will', 'your', 'into', 'when', 'them', 'they', 'what'].includes(w))
      return querySkillCache(kw, maxSkills, maxChars)
    }

    // ─── PHASE 1: COMPLEXITY ANALYSIS ─────────────────────────────────────────
    const complexity = analyzeComplexityWithScope(prompt, scopeData)

    const longHorizon = isLongHorizonTask(prompt) && (() => {
      try {
        return require('./model-config').sessionIsLongHorizon()
      } catch {
        return false
      }
    })();
    if (longHorizon) {
      yield {
        toolName: 'spawn_agents',
        input: { agents: [{ agent_type: 'metabuff-autonomous', prompt }] }
      }
      return
    }

    const isGenerationTask = /\b(create new file|write new file|generate.*\.(ts|tsx|js|jsx|py)|new component|new page|from scratch|build.*system)\b/i.test(prompt)
    const algoTask = isAlgorithmTask(prompt)
    const regexTask = isRegexTask(prompt)

    // ─── PHASE 1.5: VAGUENESS DETECTION & SEMANTIC ENRICHMENT (v2.0.0) ────
    // Detects whether the prompt is vague and enriches it with semantic context.
    // Vague prompts (short, few technical terms, conversational language) get
    // synonym expansion + context inference before routing decisions.

    const vagueness = detectVagueness(prompt)
    const { enriched: enrichedPrompt, domainHints } = semanticEnrich(prompt)

    // ─── PHASE 1.6: DEEP SEMANTIC ANALYSIS (v2.0.0) ──────────────────────
    // For vague prompts (vagueness >= 0.5) or when no domain scored above
    // MIN_DOMAIN_SCORE, use think_deeply to deeply analyze the user's intent.
    const needsDeepAnalysis = vagueness >= 0.5 ||
      (domainHints.size === 0 && !algoTask && complexity !== 'simple')

    if (needsDeepAnalysis) {
      yield {
        toolName: 'think_deeply',
        input: {
          thought:
            `Deeply analyze this user coding request. It may be vague or require interpretation.\n\n` +
            `USER REQUEST: "${prompt.slice(0, 500)}"\n\n` +
            `Your task:\n` +
            `1. What is the user ACTUALLY trying to accomplish? Infer the real intent.\n` +
            `2. What technical domain(s) does this task belong to?\n` +
            `3. What specialist agents should handle this?\n` +
            `4. What subtasks are implied?\n` +
            `5. What would the user be surprised I DIDN'T understand about their request?\n\n` +
            `Then use this understanding to: (a) pick the right specialist agent for routing, ` +
            `and (b) craft a more specific, well-scoped prompt for that agent.`,
        },
      }
    }

    // ─── PHASE 1.7: COMBINED DOMAIN SCORING (v2.0.1) ────────────────────
    // Compute final domain scores combining keyword detectors + semantic hints.
    // Vague prompts get more weight from semantic enrichment.
    // v2.0.1: After think_deeply, use enrichedPrompt so keyword detectors can
    // match against domain hint tags, feeding LLM understanding back into routing.
    // Also boosts semantic weight +0.1 post-deep-analysis for LLM-confirmed intents.
    const scoringInput = needsDeepAnalysis ? enrichedPrompt : prompt
    const effectiveVagueness = needsDeepAnalysis ? Math.min(1.0, vagueness + 0.1) : vagueness
    const domainScores = computeDomainScores(scoringInput, domainHints, effectiveVagueness)

    // ─── ECC agent routing detectors (v1.6.0) ─────────────────────────────
    /** True when task is explicitly a review — use ECC's richer code reviewer */
    function isReviewTask(p: string): boolean {
      return /\b(review|audit|inspect|check.*(?:code|quality|security|patterns?))\b/i.test(p)
    }
    /** True when task involves build/type errors */
    function isBuildErrorTask(p: string): boolean {
      return /\b(build|compil(?:e|ation)|type.?error|tsc|typescript.?error|fix.*(?:error|build|type))\b/i.test(p)
    }
    /** True when task involves test-driven development */
    function isTDDTask(p: string): boolean {
      return /\b(testing|tdd|test.?driven|write.?tests?.*first|red.?green.?refactor|test.?coverage|add.?tests?)\b/i.test(p)
    }
    /** True when task involves dead code or cleanup */
    function isCleanupTask(p: string): boolean {
      return /\b(dead.?code|cleanup|remove.?unused|unused.*(?:import|export|code|file|dep)|deprecat|consolidat|duplicat)\b/i.test(p)
    }
    /** True when task involves documentation */
    function isDocTask(p: string): boolean {
      return /\b(document(?:ation)?|docs?|readme|codemap|jsdoc|tsdoc|update.*(?:doc|readme|guide))\b/i.test(p)
    }
    /** True when task involves E2E testing */
    function isE2ETask(p: string): boolean {
      return /\b(e2e|end.?to.?end|playwright|browser.?test|ui.?test|journey.?test)\b/i.test(p)
    }
    /** True when task involves database/schema work */
    function isDatabaseTask(p: string): boolean {
      return /\b(database|schema|migration|prisma|postgres|sql|supabase|query.*(?:perform|optimiz|plan)|n\+1)\b/i.test(p)
    }
    /** True when task involves architecture/design */
    function isArchitectureTask(p: string): boolean {
      return /\b(architect(?:ure|ural)?|design.*(?:system|pattern|decision)|adr|component.*(?:structur|boundar|design))\b/i.test(p)
    }
    /** True when task is language-specific and benefits from dedicated reviewer */
    function isTypeScriptTask(p: string): boolean {
      return /\b(typescript|tsx?|react|next\.?js|node\.?js|express|prisma|tailwind)\b/i.test(p)
    }
    function isPythonTask(p: string): boolean {
      return /\b(python|django|flask|fastapi|pytest|pip|scraper|wiktionary)\b/i.test(p)
    }

    // ─── NEW DETECTORS (v1.9.0) — Expanded routing coverage ──────────

    /** Performance optimization tasks */
    function isPerformanceTask(p: string): boolean {
      return /\b(performance|optimiz|slow|bottleneck|latency|throughput|bundle.?size|re.?render|lazy.?load|memory.?leak|profiling?)\b/i.test(p)
    }
    /** Security audit / vulnerability tasks */
    function isSecurityAuditTask(p: string): boolean {
      return /\b(secur(?:ity|e)(?:.?audit)?|vulnerab|owasp|cve|penetration|injection|hardcoded.?secret|unsafe.?crypto|rate.?limit)\b/i.test(p)
    }
    /** Go/Golang tasks */
    function isGoTask(p: string): boolean {
      return /\b(go(lang)?|goroutine|channel|gofmt|golangci|go.?mod|go.?build)\b/i.test(p)
    }
    /** Rust tasks */
    function isRustTask(p: string): boolean {
      return /\b(rust|cargo|life.?time|borrow.?check|trait|macro|crate|tokio|serde|actix|axum)\b/i.test(p)
    }
    /** Java tasks (NOT Kotlin — see isKotlinTask) */
    function isJavaTask(p: string): boolean {
      return /\b(java\b|spring|maven|gradle|jvm)\b/i.test(p)
    }
    /** Kotlin/Android tasks */
    function isKotlinTask(p: string): boolean {
      return /\b(kotlin|ktor|coroutine|android)\b/i.test(p)
    }
    /** Swift/Apple tasks */
    function isSwiftTask(p: string): boolean {
      return /\b(swift|xcode|ios|macos|uikit|swiftui|app.?store|core.?data|combine)\b/i.test(p)
    }
    /** C# tasks */
    function isCSharpTask(p: string): boolean {
      return /\b(c#|csharp|dotnet|asp\.?net|blazor|xamarin|unity|entity.?framework)\b/i.test(p)
    }
    /** C++ tasks */
    function isCppTask(p: string): boolean {
      return /\b(c\+\+|cpp|cmake|opengl|vulkan|unreal|qt|boost|clang|gcc)\b/i.test(p)
    }
    /** Dart/Flutter tasks */
    function isDartFlutterTask(p: string): boolean {
      return /\b(dart|flutter|widget|pubspec)\b/i.test(p)
    }
    /** Machine Learning tasks */
    function isMLTask(p: string): boolean {
      return /\b(machine.?learn|\bml\b|training|model|neural|inference|pytorch|tensor(?:flow)?|cuda|gpu|dataset|fine.?tun|embedding|transformer|llm)\b/i.test(p)
    }
    /** Network infrastructure tasks */
    function isNetworkTask(p: string): boolean {
      return /\b(network|bgp|vlan|dns|cisco|firewall|rout(?:e|ing)|ssh|subnet|switch|load.?balanc|vpn|wireguard|dhcp)\b/i.test(p)
    }
    /** Autonomous/loop tasks */
    function isAutonomousTask(p: string): boolean {
      return /\b(autonomous|loop|continuous|background|daemon|cron|worker|polling|watch|agent.*loop|forever)\b/i.test(p)
    }
    /** Accessibility tasks */
    function isA11yTask(p: string): boolean {
      return /\b(a11y|accessibility|wcag|screen.?reader|aria|keyboard.?nav|focus.?manag|semantic.?html|alt.?text)\b/i.test(p)
    }
    /** React-specific (when not caught by TS detector) */
    function isReactSpecificTask(p: string): boolean {
      return /\b(react|jsx|hooks?|useEffect|useState|redux|zustand|context.?api)\b/i.test(p) && !/\b(typescript|tsx?)\b/i.test(p)
    }
    /** Django-specific */
    function isDjangoTask(p: string): boolean {
      return /\b(django|orm|migrations?|admin|queryset|modelform|class.?based.?view)\b/i.test(p)
    }
    /** FastAPI-specific */
    function isFastAPITask(p: string): boolean {
      return /\b(fastapi|pydantic|starlette|openapi|dependency.?injection|uvicorn)\b/i.test(p)
    }
    /** F# tasks */
    function isFSharpTask(p: string): boolean {
      return /\b(f#|fsharp|dotnet|functional)\b/i.test(p)
    }
    /** Vision tasks */
    function isVisionTask(p: string): boolean {
      return /\b(screenshot|image|diagram|png|jpg)\b/i.test(p)
    }
    /** Scientific tasks */
    function isScientificTask(p: string): boolean {
      return /\b(hypothesis|mechanism|phenomenon)\b/i.test(p)
    }
    /** Long-horizon tasks */
    function isLongHorizonTask(p: string): boolean {
      return /\b(overnight|full.?feature|from.?scratch)\b/i.test(p)
    }

    // --- Vision & Scientific Routing ---
    const caps = (() => {
      try {
        return require('./model-config').resolveModelCaps()
      } catch {
        return { vision: false }
      }
    })();
    
    if (isVisionTask(prompt) && caps.vision) {
      yield {
        toolName: 'spawn_agents',
        input: { agents: [{ agent_type: 'ecc-vision-analyst', prompt }] }
      }
      return
    }

    if (isScientificTask(prompt)) {
      yield {
        toolName: 'spawn_agents',
        input: { agents: [{ agent_type: 'ecc-hypothesis-generator', prompt }] }
      }
      return
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ─── SEMANTIC ENRICHMENT LAYER (v2.0.0) ─────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════
    // Replaces keyword-only boolean detectors with score-based semantic routing.
    // Vague prompts (short, few technical terms) get synonym expansion +
    // context inference so they still route to the right specialist agents.

    /**
     * Detects how vague a prompt is (0 = very specific, 1 = completely vague).
     * Factors: prompt length, technical term density, specificity signals.
     */
    function detectVagueness(p: string): number {
      const lower = p.toLowerCase()
      const wordCount = p.split(/\s+/).filter(w => w.length > 0).length
      let vagueness = 0

      // Short prompts are more likely vague
      if (wordCount < 8) vagueness += 0.35
      else if (wordCount < 15) vagueness += 0.2
      else if (wordCount < 25) vagueness += 0.1

      // Check for technical term density
      const techTerms = [
        'function', 'class', 'component', 'module', 'api', 'endpoint',
        'database', 'schema', 'query', 'migration', 'prisma', 'sql',
        'typescript', 'javascript', 'python', 'rust', 'go', 'java',
        'react', 'component', 'hook', 'state', 'props', 'render',
        'test', 'type', 'interface', 'import', 'export', 'middleware',
        'regex', 'algorithm', 'async', 'await', 'promise', 'callback',
        'css', 'style', 'tailwind', 'layout', 'responsive',
        'docker', 'ci', 'deploy', 'build', 'compile',
        'file', 'folder', 'directory', 'path', 'config',
      ]
      const techCount = techTerms.filter(t => lower.includes(t)).length
      if (techCount === 0) vagueness += 0.3
      else if (techCount <= 1) vagueness += 0.2
      else if (techCount <= 3) vagueness += 0.1

      // Imperative/help-seeking phrases suggest vagueness
      if (/\b(need to|want to|help|how.*(?:do|can|should)|what.*(?:is|are|should)|can you|could you|please)\b/i.test(p)) {
        if (techCount <= 2) vagueness += 0.15
      }

      // File paths, class names, specific error messages → specific prompt
      if (/\b\w+\.(ts|tsx|js|py|go|rs|java|cpp|cs|json|yaml|yml|md)\b/i.test(p)) vagueness -= 0.2
      const pascalMatches = p.match(/\b[A-Z][a-z]+[A-Z][a-zA-Z]*\b/g)
      if (pascalMatches && pascalMatches.length >= 2) vagueness -= 0.15
      if (/error[:\s]+/i.test(p) && /\b(line\s+\d+|stack\s+trace|traceback)\b/i.test(p)) vagueness = 0

      return Math.max(0, Math.min(1, vagueness))
    }

    /**
     * Semantic synonym/context expansion for vague prompts.
     * Maps conversational language → technical domains with confidence scores.
     * Returns an enriched version of the prompt with technical keywords injected.
     */
    function semanticEnrich(p: string): { enriched: string; domainHints: Map<string, number> } {
      const lower = p.toLowerCase()
      const domainHints = new Map<string, number>()

      // ── Synonym clusters: [vague term] → { domain, confidence } ────────
      const synonymMap: { pattern: RegExp; domain: string; confidence: number }[] = [
        // Performance
        { pattern: /\b(fast(?:er)?|slow(?:er|ly|ness)?|lag(?:gy|ging)?|sluggish|hangs?|snappy|speeds?.*(?:up|boost)|accelerate|responsive|loading.*(?:time|speed)|page.*(?:load|weight)|heavy|bloated|lean|nimble|quick(?:er|ly)?)\b/i, domain: 'performance', confidence: 0.7 },
        // Cleanup / Refactoring
        { pattern: /\b(clean(?:\s*up)?|mess(?:y)?|spaghetti|organiz(?:e|ation)|tidy|ugly|polish|simplif(?:y|ication)|streamline|consolidat(?:e|ion)|dedup(?:e|licate)?|dry(?:\s*out)?|wet.*code|duplicat(?:e|ion)|redundant|bloat(?:ed|ware)?|dead.*(?:code|weight)|rot|stale)\b/i, domain: 'cleanup', confidence: 0.7 },
        // Security
        { pattern: /\b(safe(?:r|ty|guard)?|hack(?:ed|er|ing|able)?|protect(?:ed|ion)?|leak(?:ed|ing|y)?|lock(?:\s*down)?|vulnerab(?:le|ility)?|expos(?:ed|ure)|secure|encrypt(?:ed|ion)?|auth(?:enticate)?|login.*(?:safe|secure)|breach|exploit|attack|trust)\b/i, domain: 'security', confidence: 0.7 },
        // Testing
        { pattern: /\b(test(?:s|ing|ed)?|cover(?:age)?|verify|validate?|check(?:s|ing)?|assure?|prove|confirm|spec(?:s|ification)?|requirement(?:s)?|correct(?:ness)?|bug(?:s)?.*(?:free|proof)|regression)\b/i, domain: 'testing', confidence: 0.6 },
        // Documentation
        { pattern: /\b(doc(?:s|ument(?:s|ation|ing)?)?|readme|explain(?:ed|ing)?|describ(?:e|ing|ption)|guide|tutorial|how.?to|manual|reference|overview)\b/i, domain: 'documentation', confidence: 0.6 },
        // Architecture / Design
        { pattern: /\b(design(?:ed|ing)?|architect(?:ure|ural)?|structur(?:e|al|ing)?|pattern(?:s)?|layout|blueprint|plan(?:ning)?|organiz(?:e|ation)|modular|scal(?:e|able|ing)|extensib(?:le|ility)|decoupl(?:e|ing)|separat(?:e|ion)|concern(?:s)?)\b/i, domain: 'architecture', confidence: 0.65 },
        // Database
        { pattern: /\b(data(?:base)?|schema|table(?:s)?|column(?:s)?|row(?:s)?|index(?:es|ing)?|query|migrat(?:e|ion|ing)|seed(?:s|ing)?|prisma|postgres|mysql|sqlite|mongo|orm|n\+1|join(?:s)?|relation(?:s|ship)?)\b/i, domain: 'database', confidence: 0.75 },
        // UI / Frontend
        { pattern: /\b(ui|ux|interface|frontend|front.?end|page(?:s)?|screen(?:s)?|component(?:s)?|widget(?:s)?|button(?:s)?|form(?:s)?|modal(?:s)?|dialog(?:s)?|popup|tooltip|navbar|sidebar|header|footer|layout|style(?:s|ing)?|css|tailwind|visual|look(?:s|ing)?|appear(?:ance|s)?|pretty|ugly|beautiful|polish)\b/i, domain: 'ui', confidence: 0.65 },
        // Mobile
        { pattern: /\b(mobile|phone|tablet|android|ios|responsive|touch|swipe|tap|capacitor|react.?native|flutter|pwa|appstore|playstore|install(?:able)?|offline|native)\b/i, domain: 'mobile', confidence: 0.7 },
        // Build / Compile
        { pattern: /\b(build|compil(?:e|ation|ing)?|transpil(?:e|ation)?|bundl(?:e|ing|er)?|webpack|vite|esbuild|tsc|typecheck|type.?check|broken|fail(?:s|ed|ing|ure)?|error(?:s)?|won't.*(?:build|compile|start|run)|doesn't.*(?:build|compile|start|run)|crash(?:es|ing|ed)?)\b/i, domain: 'build', confidence: 0.6 },
        // Accessibility
        { pattern: /\b(a11y|accessib(?:le|ility)|screen.?reader|keyboard|color.?blind|contrast|focus|tab(?:\s*order)?|aria|wcag|disabled|handicap|impair(?:ed|ment)|assistive|alt.?text)\b/i, domain: 'a11y', confidence: 0.75 },
        // Review / Audit
        { pattern: /\b(review|audit|inspect|check(?:\s*over)?|scan|assess|examin(?:e|ation)|overview|walk.?through|code.?review|peer.?review)\b/i, domain: 'review', confidence: 0.65 },
        // Refactoring (broader than cleanup)
        { pattern: /\b(refactor(?:ing)?|rewrit(?:e|ing)|rework(?:ing)?|redesign(?:ing)?|rearchitect(?:ing|ure)?|overhaul|moderniz(?:e|ation)|upgrade)\b/i, domain: 'refactoring', confidence: 0.7 },
      ]

      // Apply synonym matching
      for (const { pattern, domain, confidence } of synonymMap) {
        if (pattern.test(lower)) {
          const existing = domainHints.get(domain) || 0
          domainHints.set(domain, Math.max(existing, confidence))
        }
      }

      // ── Context inference: compound phrases ────────────────────────────
      // "database queries are slow" → database + performance
      if (/\b(data(?:base)?|query|table|schema)\b.*\b(slow|fast|speed|perform|optimiz|bottleneck)\b/i.test(lower) ||
          /\b(slow|fast|speed|perform|optimiz|bottleneck)\b.*\b(data(?:base)?|query|table|schema)\b/i.test(lower)) {
        domainHints.set('database', Math.max(domainHints.get('database') || 0, 0.6))
        domainHints.set('performance', Math.max(domainHints.get('performance') || 0, 0.6))
      }

      // "secure the API" → security + api
      if (/\b(secur|protect|safe|lock)\b.*\b(api|endpoint|route|request)\b/i.test(lower) ||
          /\b(api|endpoint|route|request)\b.*\b(secur|protect|safe|lock)\b/i.test(lower)) {
        domainHints.set('security', Math.max(domainHints.get('security') || 0, 0.7))
      }

      // "make the UI faster" → ui + performance
      if (/\b(ui|interface|page|component|render)\b.*\b(fast|slow|speed|perform|optimiz)\b/i.test(lower) ||
          /\b(fast|slow|speed|perform|optimiz)\b.*\b(ui|interface|page|component|render)\b/i.test(lower)) {
        domainHints.set('ui', Math.max(domainHints.get('ui') || 0, 0.5))
        domainHints.set('performance', Math.max(domainHints.get('performance') || 0, 0.6))
      }

      // "add tests for" → testing
      if (/\b(add|write|create|need|missing|lack(?:ing)?|no)\b.*\b(tests?|specs?|coverage)\b/i.test(lower) ||
          /\b(tests?|specs?|coverage)\b.*\b(add|write|create|need|missing|lack(?:ing)?)\b/i.test(lower)) {
        domainHints.set('testing', Math.max(domainHints.get('testing') || 0, 0.8))
      }

      // Build the enriched prompt with technical keywords appended
      const technicalTerms: string[] = []
      for (const [domain, confidence] of domainHints) {
        if (confidence >= 0.6) {
          technicalTerms.push(`[domain:${domain} confidence:${confidence.toFixed(1)}]`)
        }
      }

      const enriched = technicalTerms.length > 0
        ? `${p}\n\n<!-- SEMANTIC ENRICHMENT: ${technicalTerms.join(', ')} -->`
        : p

      return { enriched, domainHints }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ─── AGENT CAPABILITY REGISTRY (v2.0.0) ──────────────────────────────
    // ═══════════════════════════════════════════════════════════════════════
    // Maps domains → primary agent + alternatives with priority scores.
    // Used by score-based routing to select the best agent for each task.

    interface AgentCapability {
      domain: string
      primaryAgent: string
      alternatives: string[]
      priority: number  // Higher = preferred when multiple domains match
      requiresCoT: boolean  // Whether this agent needs withCoT wrapping
      secondaryDomains: string[]  // Domains this agent can also handle
    }

    const CAPABILITY_REGISTRY: AgentCapability[] = [
      { domain: 'algorithm', primaryAgent: 'metabuff-reasoner', alternatives: [], priority: 100, requiresCoT: false, secondaryDomains: [] },
      { domain: 'performance', primaryAgent: 'ecc-performance-optimizer', alternatives: [], priority: 85, requiresCoT: false, secondaryDomains: ['database', 'ui'] },
      { domain: 'security', primaryAgent: 'ecc-security-reviewer', alternatives: [], priority: 95, requiresCoT: false, secondaryDomains: ['api', 'database'] },
      { domain: 'architecture', primaryAgent: 'ecc-architect', alternatives: ['metabuff-arch'], priority: 80, requiresCoT: true, secondaryDomains: ['database', 'api'] },
      { domain: 'testing', primaryAgent: 'ecc-tdd-guide', alternatives: ['ecc-e2e-runner', 'metabuff-testgen'], priority: 75, requiresCoT: true, secondaryDomains: [] },
      { domain: 'e2e', primaryAgent: 'ecc-e2e-runner', alternatives: [], priority: 70, requiresCoT: true, secondaryDomains: [] },
      { domain: 'build', primaryAgent: 'ecc-build-error-resolver', alternatives: [], priority: 90, requiresCoT: false, secondaryDomains: [] },
      { domain: 'cleanup', primaryAgent: 'ecc-refactor-cleaner', alternatives: ['ecc-code-simplifier'], priority: 65, requiresCoT: true, secondaryDomains: [] },
      { domain: 'refactoring', primaryAgent: 'ecc-refactor-cleaner', alternatives: ['ecc-code-simplifier'], priority: 72, requiresCoT: true, secondaryDomains: ['cleanup'] },
      { domain: 'documentation', primaryAgent: 'ecc-doc-updater', alternatives: ['ecc-docs-lookup'], priority: 55, requiresCoT: false, secondaryDomains: [] },
      { domain: 'database', primaryAgent: 'ecc-database-reviewer', alternatives: ['ecc-django-build-resolver'], priority: 78, requiresCoT: true, secondaryDomains: ['performance'] },
      { domain: 'review', primaryAgent: 'ecc-code-reviewer', alternatives: ['ecc-typescript-reviewer', 'ecc-python-reviewer'], priority: 60, requiresCoT: false, secondaryDomains: [] },
      { domain: 'ui', primaryAgent: 'ecc-react-reviewer', alternatives: ['ecc-react-build-resolver'], priority: 68, requiresCoT: false, secondaryDomains: ['performance', 'a11y'] },
      { domain: 'mobile', primaryAgent: 'ecc-flutter-reviewer', alternatives: ['ecc-react-build-resolver'], priority: 68, requiresCoT: false, secondaryDomains: ['ui'] },
      { domain: 'a11y', primaryAgent: 'ecc-a11y-architect', alternatives: [], priority: 72, requiresCoT: false, secondaryDomains: ['ui'] },
      { domain: 'ml', primaryAgent: 'ecc-mle-reviewer', alternatives: [], priority: 75, requiresCoT: false, secondaryDomains: ['performance', 'build'] },
      { domain: 'network', primaryAgent: 'ecc-network-architect', alternatives: ['ecc-network-troubleshooter'], priority: 70, requiresCoT: false, secondaryDomains: ['security'] },
      { domain: 'autonomous', primaryAgent: 'ecc-loop-operator', alternatives: [], priority: 65, requiresCoT: false, secondaryDomains: [] },
      { domain: 'scientific', primaryAgent: 'ecc-hypothesis-generator', alternatives: [], priority: 88, requiresCoT: false, secondaryDomains: [] },
      { domain: 'planning', primaryAgent: 'ecc-planner', alternatives: [], priority: 50, requiresCoT: true, secondaryDomains: [] },
    ]

    /**
     * Language-specific reviewer overrides. When a language is detected,
     * the language reviewer replaces the generic reviewer.
     */
    const LANGUAGE_REVIEWER_MAP: Record<string, string> = {
      go: 'ecc-go-reviewer',
      rust: 'ecc-rust-reviewer',
      java: 'ecc-java-reviewer',
      kotlin: 'ecc-kotlin-reviewer',
      swift: 'ecc-swift-reviewer',
      csharp: 'ecc-csharp-reviewer',
      cpp: 'ecc-cpp-reviewer',
      dart: 'ecc-flutter-reviewer',
      fsharp: 'ecc-fsharp-reviewer',
      react: 'ecc-react-reviewer',
      django: 'ecc-django-reviewer',
      fastapi: 'ecc-fastapi-reviewer',
      typescript: 'ecc-typescript-reviewer',
      python: 'ecc-python-reviewer',
    }

    /**
     * Language-specific build resolver overrides.
     */
    const LANGUAGE_BUILD_MAP: Record<string, string> = {
      go: 'ecc-go-build-resolver',
      rust: 'ecc-rust-build-resolver',
      java: 'ecc-java-build-resolver',
      kotlin: 'ecc-kotlin-build-resolver',
      cpp: 'ecc-cpp-build-resolver',
      dart: 'ecc-dart-build-resolver',
      django: 'ecc-django-build-resolver',
      swift: 'ecc-swift-build-resolver',
      ml: 'ecc-pytorch-build-resolver',
      react: 'ecc-react-build-resolver',
    }

    /**
     * Computes a combined domain score from both keyword detectors and
     * semantic enrichment. Returns a map of domain → score (0-1).
     */
    function computeDomainScores(p: string, semanticHints: Map<string, number>, vagueness: number): Map<string, number> {
      const scores = new Map<string, number>()

      // ── Keyword detector scores (exact matches = 1.0) ──────────────────
      if (isAlgorithmTask(p)) scores.set('algorithm', 1.0)
      if (isPerformanceTask(p)) scores.set('performance', Math.max(scores.get('performance') || 0, 1.0))
      if (isSecurityAuditTask(p)) scores.set('security', Math.max(scores.get('security') || 0, 1.0))
      if (isArchitectureTask(p)) scores.set('architecture', Math.max(scores.get('architecture') || 0, 1.0))
      if (isTDDTask(p)) scores.set('testing', Math.max(scores.get('testing') || 0, 1.0))
      if (isE2ETask(p)) scores.set('e2e', Math.max(scores.get('e2e') || 0, 1.0))
      if (isBuildErrorTask(p)) scores.set('build', Math.max(scores.get('build') || 0, 1.0))
      if (isCleanupTask(p)) scores.set('cleanup', Math.max(scores.get('cleanup') || 0, 0.9))
      if (isDocTask(p)) scores.set('documentation', Math.max(scores.get('documentation') || 0, 1.0))
      if (isDatabaseTask(p)) scores.set('database', Math.max(scores.get('database') || 0, 1.0))
      if (isReviewTask(p)) scores.set('review', Math.max(scores.get('review') || 0, 0.85))
      if (isA11yTask(p)) scores.set('a11y', Math.max(scores.get('a11y') || 0, 1.0))
      if (isMLTask(p)) scores.set('ml', Math.max(scores.get('ml') || 0, 1.0))
      if (isNetworkTask(p)) scores.set('network', Math.max(scores.get('network') || 0, 1.0))
      if (isAutonomousTask(p)) scores.set('autonomous', Math.max(scores.get('autonomous') || 0, 1.0))

      // ── Language-specific detector scores (v2.0.0) ────────────────────
      // Sets language keys in the scores map so build error + reviewer routing
      // can do language-aware overrides (was broken in v2.0.0 initial release).
      const langDetectors: [() => boolean, string][] = [
        [() => isGoTask(p), 'go'],
        [() => isRustTask(p), 'rust'],
        [() => isJavaTask(p), 'java'],
        [() => isKotlinTask(p), 'kotlin'],
        [() => isSwiftTask(p), 'swift'],
        [() => isCSharpTask(p), 'csharp'],
        [() => isCppTask(p), 'cpp'],
        [() => isDartFlutterTask(p), 'dart'],
        [() => isFSharpTask(p), 'fsharp'],
        [() => isReactSpecificTask(p), 'react'],
        [() => isDjangoTask(p), 'django'],
        [() => isFastAPITask(p), 'fastapi'],
        [() => isTypeScriptTask(p), 'typescript'],
        [() => isPythonTask(p), 'python'],
      ]
      let detectedLang: string | null = null
      for (const [detector, lang] of langDetectors) {
        if (detector()) {
          scores.set(lang, 1.0)
          if (!detectedLang) {
            detectedLang = lang
            scores.set('review', Math.max(scores.get('review') || 0, 0.4))
          }
        }
      }


      // ── Semantic enrichment scores ──────────────────────────────────────
      // Weight: vague prompts get more semantic weight; specific prompts rely on keywords
      const semanticWeight = 0.3 + (vagueness * 0.5)  // 0.3-0.8 range
      const keywordWeight = 1 - semanticWeight

      for (const [domain, hintScore] of semanticHints) {
        const keywordScore = scores.get(domain) || 0
        // Only add semantic score if keywords didn't already match strongly
        if (keywordScore < 0.5) {
          const combined = keywordScore * keywordWeight + hintScore * semanticWeight
          scores.set(domain, Math.max(scores.get(domain) || 0, combined))
        }
      }

      return scores
    }

    /**
     * Routes a task to the best agent based on combined domain scores.
     * Returns { agentType, prompt, secondaryContext } where secondaryContext
     * is injected when multiple high-scoring domains exist.
     */
    function routeTask(
      scores: Map<string, number>,
      p: string,
      isBuildError: boolean
    ): { agentType: string; prompt: string; secondaryContext: string } {

      // Sort domains by score descending, then by registry priority
      const sorted = [...scores.entries()]
        .filter(([, score]) => score >= MIN_DOMAIN_SCORE)
        .sort(([domA, scoreA], [domB, scoreB]) => {
          if (Math.abs(scoreB - scoreA) > 0.15) return scoreB - scoreA
          // Tie-break by registry priority
          const priA = CAPABILITY_REGISTRY.find(c => c.domain === domA)?.priority || 0
          const priB = CAPABILITY_REGISTRY.find(c => c.domain === domB)?.priority || 0
          return priB - priA
        })

      if (sorted.length === 0) {
        // No domain matched → default to planner
        const cap = CAPABILITY_REGISTRY.find(c => c.domain === 'planning')!
        return {
          agentType: cap.primaryAgent,
          prompt: `Analyze the full scope, then implement all changes for:\n${p}\n\nBefore writing a single line, identify ALL files that need to change and produce a dependency-ordered change list. Apply sizing/phasing: MVP → Core → Edge cases → Optimization. Flag every assumption.`,
          secondaryContext: '',
        }
      }

      const [primaryDomain, primaryScore] = sorted[0]!
      const cap = CAPABILITY_REGISTRY.find(c => c.domain === primaryDomain)
      if (!cap) {
        return {
          agentType: 'ecc-planner',
          prompt: `Analyze and implement:\n${p}`,
          secondaryContext: '',
        }
      }

      // Language-aware build error override
      let agentType = cap.primaryAgent
      if (isBuildError) {
        for (const [lang, buildAgent] of Object.entries(LANGUAGE_BUILD_MAP)) {
          if (scores.get(lang) && scores.get(lang)! >= 0.3) {
            agentType = buildAgent
            break
          }
        }
      }

      // Secondary domain context for multi-domain prompts
      let secondaryContext = ''
      if (sorted.length > 1) {
        const secondary = sorted.slice(1, 3)
        const secondaryDomains = secondary.map(([d, s]) => `${d}(${(s*100).toFixed(0)}%)`).join(', ')
        const secondaryCaps = secondary
          .map(([d]) => CAPABILITY_REGISTRY.find(c => c.domain === d))
          .filter(Boolean)
        const secondaryNotes = secondaryCaps
          .map(c => c!.domain === 'performance' ? 'Apply performance optimization principles throughout.' :
                    c!.domain === 'security' ? 'Audit for security vulnerabilities as you go.' :
                    c!.domain === 'testing' ? 'Write tests for all new/changed functionality.' :
                    c!.domain === 'database' ? 'Review all database interactions for N+1 patterns and missing indexes.' :
                    c!.domain === 'a11y' ? 'Ensure all UI changes meet WCAG accessibility standards.' :
                    c!.domain === 'cleanup' ? 'Remove dead code and unused imports as you encounter them.' :
                    c!.domain === 'documentation' ? 'Update relevant docs and README for any changed APIs.' :
                    null)
          .filter(Boolean)
        if (secondaryNotes.length > 0) {
          secondaryContext = `\n\n<!-- MULTI-DOMAIN CONTEXT: ${secondaryDomains} -->\nSECONDARY CONCERNS:\n${secondaryNotes.map(n => `  • ${n}`).join('\n')}\n`
        }
      }

      // Build domain-specific prompt
      let promptBody: string
      switch (primaryDomain) {
        case 'algorithm':
          promptBody = `Task requires algorithmic reasoning — apply the full 6-step Socratic protocol.\n\nTask: ${p}\n\nCONTEXT: Focus on correctness proofs and complexity analysis. Run tests at STEP 6 before calling end_turn.`
          break
        case 'performance':
          promptBody = `Performance optimization task detected:\n${p}\n\nProfile before optimizing. Identify bottleneck, propose solution, measure impact, iterate.`
          break
        case 'security':
          promptBody = `Security audit task detected:\n${p}\n\nRun MetaBuff red-flag scans first. Apply OWASP Top 10 checklist. Fix all CRITICAL findings. Verify no regressions.`
          break
        case 'architecture':
          promptBody = `Architecture/design task detected. Analyze the system design and produce ADRs for:\n${p}\n\nApply the Architecture Review Process: understand requirements, analyze constraints, evaluate alternatives, make decision, document as ADR (Enhanced v2.0).`
          break
        case 'testing':
          promptBody = `TDD task detected — enforce red-green-refactor cycle for:\n${p}\n\nWrite tests FIRST, verify they FAIL, then write minimal implementation. Target 80%+ coverage across unit, integration, and E2E tests.`
          break
        case 'e2e':
          promptBody = `E2E testing task detected:\n${p}\n\nCreate Playwright tests for critical user journeys. Use Page Object Model, semantic locators (data-testid), and proper waits. Handle flaky tests.`
          break
        case 'build':
          promptBody = `Build/type error resolution task:\n${p}\n\nFix errors with MINIMAL diffs. No refactoring, no architecture changes. Collect all errors first, then apply the smallest possible fix for each. Verify with typecheck after each fix.`
          break
        case 'cleanup':
        case 'refactoring':
          promptBody = `Code cleanup task detected:\n${p}\n\nIdentify dead code, duplicates, and unused exports. Remove SAFE items first. Test after each batch. Be conservative — when in doubt, don't remove.`
          break
        case 'documentation':
          promptBody = `Documentation task detected:\n${p}\n\nUpdate docs/codemaps from actual code structure. Verify all file paths exist and code examples compile. Add freshness timestamps.`
          break
        case 'database':
          promptBody = `Database task detected:\n${p}\n\nReview schema design, query performance, migrations, and RLS policies. Check for N+1 patterns, missing indexes, and parameterized queries.`
          break
        case 'review':
          promptBody = `Review ALL changes made for: ${p}\n\nApply confidence-based filtering (>80% confidence only). Use structured severity levels.`
          break
        case 'ui':
          promptBody = `UI/Frontend task detected:\n${p}\n\nCheck component patterns, hooks usage, state management, re-render optimization, and best practices.`
          break
        case 'mobile':
          promptBody = `Mobile task detected:\n${p}\n\nCheck responsive design, touch interactions, offline capability, and mobile best practices.`
          break
        case 'a11y':
          promptBody = `Accessibility task detected:\n${p}\n\nApply WCAG guidelines. Check keyboard navigation, screen reader support, semantic HTML, ARIA, color contrast, and focus management.`
          break
        case 'ml':
          promptBody = `ML/MLOps task detected:\n${p}\n\nReview model pipeline, data handling, training config, eval metrics, serving infrastructure, and monitoring.`
          break
        case 'network':
          promptBody = `Network infrastructure task detected:\n${p}\n\nDesign network topology, validate configurations, troubleshoot connectivity, ensure security.`
          break
        case 'autonomous':
          promptBody = `Autonomous/loop task detected:\n${p}\n\nDefine loop invariants and termination conditions. Set iteration cap, progress check, and timeout. Prevent runaway execution.`
          break
        default:
          promptBody = `Analyze the full scope, then implement all changes for:\n${p}\n\nBefore writing a single line, identify ALL files that need to change and produce a dependency-ordered change list.`
      }

      const promptWithContext = promptBody + secondaryContext
      return {
        agentType,
        prompt: promptWithContext,  // CoT wrapping handled by pipeline (v2 for simple, v3 for complex)
        secondaryContext,
      }
    }

    /**
     * Routes reviewer selection based on domain scores + language detection.
     */
    function routeReviewer(scores: Map<string, number>, p: string): { agentType: string; prompt: string } {
      // Language-specific reviewer override — calls the same detector functions
      // used by computeDomainScores. No duplicate regexes = no desync risk.
      const langChecks: [() => boolean, string][] = [
        [() => isGoTask(p), 'go'],
        [() => isRustTask(p), 'rust'],
        [() => isJavaTask(p), 'java'],
        [() => isKotlinTask(p), 'kotlin'],
        [() => isSwiftTask(p), 'swift'],
        [() => isCSharpTask(p), 'csharp'],
        [() => isCppTask(p), 'cpp'],
        [() => isDartFlutterTask(p), 'dart'],
        [() => isFSharpTask(p), 'fsharp'],
        [() => isReactSpecificTask(p), 'react'],
        [() => isDjangoTask(p), 'django'],
        [() => isFastAPITask(p), 'fastapi'],
        [() => isTypeScriptTask(p), 'typescript'],
        [() => isPythonTask(p), 'python'],
      ]
      for (const [detector, lang] of langChecks) {
        if (detector() && LANGUAGE_REVIEWER_MAP[lang]) {
          return {
            agentType: LANGUAGE_REVIEWER_MAP[lang]!,
            prompt: withReview(`Review ${lang} changes for: ${p}`),
          }
        }
      }

      // Domain-aware reviewer selection
      if ((scores.get('security') || 0) >= 0.6) {
        return {
          agentType: 'ecc-security-reviewer',
          prompt: withECCContext(withReview(`Security audit review for: ${p}\n\nRun MetaBuff red-flag scans + OWASP Top 10 checklist. Fix all CRITICAL findings.`), p),
        }
      }
      if ((scores.get('review') || 0) >= 0.5 || (scores.get('performance') || 0) >= 0.6) {
        return {
          agentType: 'ecc-code-reviewer',
          prompt: withECCContext(withReview(`Review ALL changes made for: ${p}\n\nApply confidence-based filtering. Check: syntax errors, missing imports, broken references, TODOs/placeholders, type safety, error handling, and performance. Fix anything you find.`), p),
        }
      }

      // Default: ecc-code-reviewer
      return {
        agentType: 'ecc-code-reviewer',
        prompt: withECCContext(withReview(`Review ALL changes made for: ${p}\n\nApply confidence-based filtering. Check: syntax errors, missing imports, broken references, TODOs/placeholders, type safety, error handling, and performance. Fix anything you find.`), p),
      }
    }

    // ─── HELPER: ECC Skill + Rules + Instinct Injection (v1.8.0 hot-load) ───
    /**
     * Wraps a task prompt with relevant ECC skill content, coding rules,
     * and past instincts. Skills use the hot-load cache (O(1) lookups).
     * Rules and instincts still read from disk (small files, infrequent changes).
     */
    function withECCContext(task: string, origPrompt: string): string {
      const parts: string[] = []

      // Skills injection — hot-load from cache (no fs reads!)
      const keywords = (origPrompt.toLowerCase().match(/[a-z]{4,}/g) || [])
        .filter((w: string) => !['this','that','with','from','have','will','your','into','when','them','they','what','file','code','make','want','need','just','like','some'].includes(w))
      const skillsBlock = querySkillCache(keywords, 4, 6000)
      if (skillsBlock) parts.push(skillsBlock)

      // Rules injection — always include common, + language-specific
      try {
        const fs = require('fs')
        const path = require('path')
        const rulesDir = '.agents/rules/ecc'
        if (fs.existsSync(rulesDir)) {
          const rulePacks: string[] = ['common']
          const patterns: Record<string, string> = { typescript: 'typescript', tsx: 'typescript', react: 'typescript', 'next.js': 'typescript', python: 'python', django: 'python', flask: 'python', go: 'golang', rust: 'rust', java: 'java', kotlin: 'kotlin', php: 'php', web: 'web' }
          for (const [pat, pack] of Object.entries(patterns)) {
            if (origPrompt.toLowerCase().includes(pat) && !rulePacks.includes(pack)) rulePacks.push(pack)
          }
          const ruleBlocks: string[] = []
          for (const rp of rulePacks.slice(0, 3)) {
            const rd = path.join(rulesDir, rp)
            if (fs.existsSync(rd)) {
              const files = fs.readdirSync(rd).filter((f: string) => f.endsWith('.md'))
              const content = files.map((f: string) => fs.readFileSync(path.join(rd, f), 'utf-8').slice(0, 600)).join('\n')
              if (content) ruleBlocks.push(`\n<!-- ECC RULES: ${rp} -->\n${content}`)
            }
          }
          if (ruleBlocks.length > 0) parts.push(`\n<!-- ECC RULES -->${ruleBlocks.join('\n')}`)
        }
      } catch { /* best-effort */ }

      // Instinct query — search known-issues.md for relevant past learnings
      try {
        const fs = require('fs')
        const kip = '.agents/known-issues.md'
        if (fs.existsSync(kip)) {
          const content = fs.readFileSync(kip, 'utf-8')
          const lines = content.split('\n').filter((l: string) => l.trim().startsWith('- `['))
          if (lines.length > 0) {
            const ikws = origPrompt.toLowerCase().match(/[a-z]{4,}/g) || []
            const relevant = lines
              .map((line: string) => ({ line, score: ikws.filter((k: string) => line.toLowerCase().includes(k)).length }))
              .filter((s: { score: number }) => s.score > 0)
              .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
              .slice(0, 3)
            if (relevant.length > 0) {
              parts.push(`\n<!-- PAST INSTINCTS (${relevant.length}) -->\n${relevant.map((r: { line: string }) => r.line).join('\n')}`)
            }
          }
        }
      } catch { /* best-effort */ }

      if (parts.length === 0) return task
      return `<!-- ── ECC CONTEXT INJECTION ── -->\n${parts.join('\n')}\n<!-- ── END ECC CONTEXT ── -->\n\n${task}`
    }

    /**
     * Record a new instinct/observation after pipeline execution.
     * Appends to known-issues.md for cross-session persistence.
     */
    function recordInstinct(domain: string, description: string, resolution: string, confidence: number): void {
      try {
        const fs = require('fs')
        const date = new Date().toISOString().split('T')[0]
        const entry = `\n- \`[${date}] INSTINCT: [${domain}] ${description} → ${resolution} (confidence: ${confidence.toFixed(1)})\``
        const kip = '.agents/known-issues.md'
        if (fs.existsSync(kip)) {
          let content = fs.readFileSync(kip, 'utf-8').trimEnd() + entry + '\n'
          const entries = content.split('\n').filter((l: string) => l.trim().startsWith('- `['))
          if (entries.length > 50) {
            let pruneCount = 0
            const target = entries.length - 50
            content = content.split('\n').filter((line: string) => {
              if (line.trim().startsWith('- `[') && pruneCount < target) { pruneCount++; return false }
              return true
            }).join('\n')
          }
          fs.writeFileSync(kip, content)
        } else {
          fs.writeFileSync(kip, '# MetaBuff Known Issues & Learned Instincts\n\n## Instincts (Self-Learning)\n' + entry + '\n')
        }
      } catch { /* best-effort */ }
    }      // ── SIMPLE ────────────────────────────────────────────────────────────────
    if (complexity === 'simple') {

      // Anthropic Skills: anti-pattern prevention (shared helper, tightened regex)
      const antiPatternInjection = getAntiPatternInjection(prompt, isGenerationTask)

      // TDD Iron Law enforcement (Superpowers) for simple pipeline
      const tddScoreSimple = domainScores.get('testing') || 0
      const tddInjectionSimple = tddScoreSimple >= 0.6
        ? `\n\n<!-- TDD IRON LAW (Superpowers integration v3.0.0) -->\n⚠ TDD IRON LAW ENFORCED: Testing domain score = ${(tddScoreSimple*100).toFixed(0)}%.\nWrite the FAILING test FIRST before any implementation. No production code without\na prior, failing test that demonstrates the desired behavior.`
        : ''

      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'ecc-code-architect',
            prompt: withECCContext(withCoT(prompt) + tddInjectionSimple + antiPatternInjection, prompt),
          }],
        },
      }

      // Targeted typecheck — only changed + new files
      yield {
        toolName: 'run_terminal_command',
        input: {
          command: 'TS_CHANGED=$(git diff HEAD --name-only 2>/dev/null | grep -E "\\.(ts|tsx)$") && ' +
                'TS_NEW=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E "\\.(ts|tsx)$") && ' +
                'if [ -n "${TS_CHANGED}${TS_NEW}" ]; then ' +
                '  echo "=== TYPECHECK (changed + new files) ===" && ' +
                '  (bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -30; ' +
                'else ' +
                '  echo "No .ts/.tsx files changed or created — skipping typecheck."; ' +
                'fi',
        },
      }

      // v2.0.1: Regex guard now gets skills + rules injected (was blind)
      if (regexTask || isGenerationTask) {
        yield {
          toolName: 'spawn_agents',
          input: {
            agents: [{
              agent_type: 'metabuff-regex-guard',
              prompt: withECCContext(`Run regex guard for changes in: ${prompt}`, prompt),
            }],
          },
        }
      }

      if (isGenerationTask) {
        yield {
          toolName: 'run_terminal_command',
          input: {
            command: 'echo "=== NEW FILES ===" && ' +
                  'git diff HEAD --name-only --diff-filter=A 2>/dev/null | head -10 || ' +
                  'echo "No new files detected"',
          },
        }
      }

      // v2.0.1: Validator now gets skills + rules injected (was blind)
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'metabuff-validator',
            prompt: withECCContext(`Validate changes made for: ${prompt}`, prompt),
          }],
        },
      }



    // ── COMPLEX ───────────────────────────────────────────────────────────────
    } else if (complexity === 'complex') {

      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'codebuff/file-picker@0.0.1',
            prompt: `Find all files relevant to: ${prompt}`,
          }],
        },
      }

      // ─── PHASE 2: SCORE-BASED AGENT ROUTING (v2.0.0, enhanced v3.0.0) ──
      // v3.0.0: complex tasks get CoT v3 (with brainstorming gate) + TDD iron law
      // injection when testing domain scores ≥0.6.

      const isBuildErr = isBuildErrorTask(prompt)
      const { agentType, prompt: routedPrompt } = routeTask(domainScores, prompt, isBuildErr)

      // Anthropic Skills: anti-pattern prevention (shared helper, tightened regex)
      const antiPatternInjection = getAntiPatternInjection(prompt, isGenerationTask)

      // TDD Iron Law enforcement (Superpowers)
      const tddScore = domainScores.get('testing') || 0
      const tddInjection = tddScore >= 0.6
        ? `\n\n<!-- TDD IRON LAW (Superpowers integration v3.0.0) -->\n⚠ TDD IRON LAW ENFORCED: Testing domain score = ${(tddScore*100).toFixed(0)}%.\nWrite the FAILING test FIRST before any implementation. No production code without\na prior, failing test that demonstrates the desired behavior.`
        : ''

      // CoT version selection: reasoner gets its own 6-step Socratic protocol.
      // Wrapping it in CoT v3's STEP 0 would conflict. Instead, inject the
      // brainstorming gate as a pre-flight note that complements the reasoner's
      // existing UNDERSTAND step.
      const isReasoner = agentType === 'metabuff-reasoner'
      let finalPrompt: string
      if (isReasoner) {
        finalPrompt = withECCContext(
          routedPrompt +
          `\n\n<!-- BRAINSTORMING PRE-FLIGHT (Superpowers) — complements reasoner's UNDERSTAND step -->\n` +
          `Before STEP 1 (UNDERSTAND), do a quick design scoping: list all files that will change,\n` +
          `enumerate edge cases, and flag assumptions. This complements (does not replace) your\n` +
          `6-step Socratic protocol.` +
          tddInjection +
          antiPatternInjection,
          prompt
        )
      } else {
        finalPrompt = withECCContext(
          withCoTv3(routedPrompt) + tddInjection + antiPatternInjection,
          prompt
        )
      }

      yield {
        toolName: 'spawn_agents', input: { agents: [{
          agent_type: agentType,
          prompt: finalPrompt,
        }]},
      }

      // v2.0.0: Score-based reviewer routing — language-aware + domain-aware
      const reviewer = routeReviewer(domainScores, prompt)
      yield {
        toolName: 'spawn_agents', input: { agents: [{
          agent_type: reviewer.agentType,
          prompt: reviewer.prompt,
        }]},
      }

      yield {
        toolName: 'run_terminal_command',
        input: {
          command: 'echo "=== TYPE CHECK ===" && ' +
                '(bun run typecheck 2>/dev/null || npx tsc --noEmit 2>&1) | head -40 && ' +
                'echo "=== TESTS ===" && ' +
                '(bun test 2>&1 || npx vitest run 2>&1 || npx jest 2>&1) | tail -30',
        },
      }

      // v2.0.1: Regex guard now gets skills + rules injected (was blind)
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'metabuff-regex-guard',
            prompt: withECCContext(`Run regex guard for all changes in: ${prompt}`, prompt),
          }],
        },
      }

      if (isGenerationTask) {
        yield {
          toolName: 'run_terminal_command',
          input: {
            command: 'echo "=== SANDBOX ===" && ' +
                  'git diff HEAD --name-only --diff-filter=A 2>/dev/null | head -20 || ' +
                  'echo "No new files detected"',
          },
        }
      }

      // v2.0.1: Validator now gets skills + rules injected (was blind)
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'metabuff-validator',
            prompt: withECCContext(`Validate all changes for: ${prompt}`, prompt),
          }],
        },
      }



    // ── MEGA ──────────────────────────────────────────────────────────────────
    } else {

      // [FIX v3.1.1] Pass clean prompt to metabuff-mega — do NOT wrap with withECCContext here.
      // withECCContext prepends 4–6 KB of XML comment blocks BEFORE the task text.
      // metabuff-mega passes `prompt` verbatim into the thinker-with-files-gemini prompt as
      // `Task: ${prompt}`, so the thinker sees the XML dump as the task description
      // instead of the actual user request → triggers VAGUE_PROMPT validation error.
      // metabuff-mega injects ECC context into each subtask prompt internally via SDD_SYSTEM_PREFIX
      // and the specialist agents (metabuff-arch, metabuff-security, ecc-code-architect) carry
      // their own rich system prompts. No skill injection gap.
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'metabuff-mega',
            prompt: prompt,
          }],
        },
      }

      // Post-mega conflict resolution
      yield {
        toolName: 'spawn_agents',
        input: {
          agents: [{
            agent_type: 'ecc-code-reviewer',
            prompt: withECCContext(withReview(
              `Post-mega conflict check for: ${prompt}\n\n` +
              `Multiple specialist agents ran in parallel. Check specifically for:\n` +
              `  1. Conflicting changes between agents (same file modified inconsistently)\n` +
              `  2. Missing integration glue between subsystems\n` +
              `  3. Any TODOs or placeholder comments left by agents\n` +
              `Fix ALL issues found.`
            ), prompt),
          }],
        },
      }


    }
  },
}

export default definition
