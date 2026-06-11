# MetaBuff Known Issues & Lessons Learned

This file persists across sessions to provide inter-session memory.
Auto-populated by MetaBuff pipelines. Do not manually edit unless reviewing accuracy.

## Format
- `[DATE] CATEGORY: Issue description → Resolution/Fix`
- Categories: `HALLUCINATION | TYPE_ERROR | TEST_FAILURE | RUNTIME_ERROR | DESIGN_ISSUE | PERFORMANCE`

## Entries
<!-- New entries are appended below this line. Max 50 entries; oldest entries are pruned first. -->

- `[2026-05-30] HALLUCINATION: Module-level functions in handleSteps are not preserved at runtime because the agent execution framework extracts only the exported definition object. Inlining all helpers inside handleSteps fixed this.`
- `[2026-05-30] DESIGN_ISSUE: Complexity analysis had no upper bound — mentioning "refactor" 5 times scored 10+, causing false mega classification. Added COMPLEXITY_SATURATION = 8 and diminishing returns on keyword scoring.`
- `[2026-05-30] DESIGN_ISSUE: Parallel agent execution could produce conflicting edits in the same file. Added post-mega continuous validation checkpoint to detect and fix merge conflicts.`
- `[2026-05-30] DESIGN_ISSUE: No inter-session memory — each session started fresh, repeating past mistakes. Added known-issues.md with CoT prompt instructions for all agents to read it before starting work.`
- `[2026-05-30] RUNTIME_ERROR: Basher commands had no timeout — long-running commands could hang indefinitely. Added BASHER_TIMEOUT = 60s and explicit timeout_seconds on all basher spawns.`
- `[2026-05-30] TYPE_ERROR: Prisma client types (@prisma/client) fail to generate when schema has migration issues. Pre-existing project issue — run npx prisma generate to regenerate types after schema changes.`
- `[2026-05-30] PERFORMANCE: Full typecheck on every pipeline run (60+ files) was slow for simple 1-2 file changes. Simple pipeline typechecks only edited files via head -40.`
- `[2026-05-30] HALLUCINATION: Agents would write new files but never verify they compile. Added sandbox compile check (git diff --diff-filter=A) after generation tasks.`
- `[2026-05-30] DESIGN_ISSUE: Debugging pipeline failures was hard without intermediate checkpoints. Added continuous validation checkpoints after each major pipeline phase.`
- `[2026-05-31] PERFORMANCE: Simple tier ran 4-5 sequential spawns causing Freebuff freeze on trivial tasks. Reduced to base + targeted typecheck + conditional regex-guard + conditional sandbox + validator.`
- `[2026-05-31] PERFORMANCE: Typecheck in simple tier ran full bun run typecheck (60+ file scan). Fixed to targeted check on git diff --name-only changed .ts/.tsx files only.`
- `[2026-05-31] BUG: MAX_PIPELINE_RUNS=3, MAX_MEMORY_ENTRIES=5, MAX_MEMORY_FILE_LINES=60 were declared inside handleSteps but never referenced. Removed to prevent confusion.`
- `[2026-05-31] BUG: metabuff-mega.ts used const { toolResult } = yield {...} to capture thinker output — framework does not return values from yield. Fixed by using think_deeply to extract JSON from message history after thinker runs.`
- `[2026-05-31] BUG: SECURITY_RED_FLAGS had 14 patterns but instructionsPrompt used .slice(0,6), silently skipping 8 patterns. Fixed to use all patterns.`
- `[2026-05-31] BUG: withCoT was applied to reviewer and validator agents. The EXECUTE step confused them into re-implementing rather than reviewing. Added lighter withReview() variant for read-only agents.`
- `[2026-05-31] BUG: isGenerationTask regex matched "write a comment" and "create a variable". Tightened to explicit new-file patterns only.`
- `[2026-05-31] DESIGN_ISSUE: Inter-session memory was a footnote in withCoT — agents ignored it. Promoted to a mandatory first spawn (basher cat) before complexity analysis.`
- `[2026-05-31] QUAL: typecheck command had no fallback — if project lacks typecheck script in package.json, it silently failed. Added fallback: npx tsc --noEmit.`
- `[2026-05-31] BUG: Targeted typecheck in simple tier used git diff HEAD --name-only which only shows tracked changes. Brand-new untracked files created by the agent were silently skipped. Fixed to also check git ls-files --others --exclude-standard.`
- `[2026-05-31] QUAL: v1.4.0 — isAlgorithmTask routes algorithm/DP/parser tasks to metabuff-reasoner (effort=high, Socratic 6-step). Improves single-model reasoning score from ~55 to ~72/100.`
- `[2026-05-31] QUAL: v1.4.0 — CoT v2 adds STEP 2.5 QUESTION: agents must articulate 3 failure modes before coding. Reduces assumption-based hallucinations.`
- `[2026-05-31] SAFETY: v1.4.0 — metabuff-regex-guard added to all pipelines. TypeScript type checker silently accepts runtime-invalid regex. Guard catches: syntax errors, ReDoS nested quantifiers, double-escape mistakes, empty alternation.`
- `[2026-05-31] QUAL: v1.4.0 / v1.2.0 — metabuff-mega cascade wave pattern: MAX_DECOMP_TASKS raised to 12, split into waves of ≤6 (MAX_WAVE_SIZE). Achieves 12 effective specialists without exceeding Freebuff crash limit. Inter-wave reviews maintain coherence between waves.`
- `[2026-05-31] QUAL: v1.4.0 / v1.2.0 — metabuff-mega custom specialist type: thinker can now emit specialist: 'custom' with customRole and customSystemAddition fields, enabling dynamic agent creation without framework changes.`
- `[2026-06-01] QUAL: Added Google Gemini 3.1 Flash-Lite as primary model for Owel chatbot (both frontend LangChain agent and backend RAG pipeline). Frontend uses ChatGoogleGenerativeAI directly via GOOGLE_API_KEY with Groq Llama 3 fallback. Backend uses google/gemini-3.1-flash-lite via OpenRouter as first model in the 7-model fallback chain. Requires GOOGLE_API_KEY on Vercel (frontend); backend falls back gracefully if Gemini via OpenRouter is unavailable.`
- `[2026-06-04] BUG: metabuff-mega.ts was missing end_turn in toolNames. Without it Freebuff kept the agent alive indefinitely, hitting concurrency limits and downgrading spawned subagents to limited mode. Fixed: added end_turn.`
- `[2026-06-04] BUG: metabuff-mega.ts resolveAgent() maps base/custom/fallback to ecc-code-architect, but that agent was NOT in spawnableAgents. Freebuff downgraded all base/custom subtasks to limited mode. Fixed: added ecc-code-architect to spawnableAgents.`
- `[2026-06-04] BUG: metabuff-mega.ts think_deeply yield capture was wrong. Used const raw: unknown = yield {...} instead of const { toolResult: raw } = yield {...}. Freebuff resumes generators with {toolResult, toolError} — so raw was always a truthy object, never a string. parseDecomposition always fell back to single-subtask. No real decomposition ever happened. Fixed.`
- `[2026-06-04] BUG: metabuff.ts mega pipeline passed withECCContext(prompt, prompt) as the mega agent prompt. withECCContext prepends 4-6KB XML before the task text. Thinker saw Task: <!-- ECC CONTEXT --> as the task description, triggering VAGUE_PROMPT. Fixed: pass clean prompt to metabuff-mega.`
- `[2026-06-04] BUG: thinker-with-files-gemini returned VAGUE_PROMPT string instead of JSON when task was short/high-level. parseDecomposition couldn't find JSON array and fell through to fallback. Fixed: added explicit instruction to always produce valid JSON array, never return error strings.`
- `[2026-06-04] BUG: metabuff-validator.ts had suggest_followups in toolNames — not a valid Freebuff tool, caused agent-load validation error. Also missing end_turn. Fixed: removed suggest_followups, added end_turn and think_deeply.`
- `[2026-06-04] BUG: metabuff-reasoner.ts had glob in toolNames (not a valid Freebuff tool) and file_picker (should be find_files per Freebuff docs). Fixed: removed glob, renamed file_picker to find_files.`

- `[2026-06-04] BUG: 'glob' was an invalid Freebuff tool in ALL 58+ ecc-*.ts agents and metabuff-arch/security/testgen/regex-guard.ts — caused HTTP 403 free_mode_invalid_agent_model on every spawn. Fixed: replaced 'glob' with 'find_files' across all affected files (sed bulk replace).`
- `[2026-06-04] BUG: 'file_picker' still present in metabuff-arch.ts, metabuff-security.ts, metabuff-testgen.ts after reasoner fix was not propagated. Fixed: replaced with 'find_files' in all three.`
- `[2026-06-04] BUG: ecc-code-architect.ts missing end_turn, str_replace, write_file in toolNames and spawnableAgents was empty despite having spawn_agents. This agent is the primary fallback for ALL base/custom/unknown mega subtasks. Fixed: added end_turn/str_replace/write_file to toolNames, set spawnableAgents to ['thinker-with-files-gemini'].`
- `[2026-06-04] BUG: All 58+ ecc-*.ts agents missing end_turn — agents lingered past task completion consuming concurrency slots. Fixed: end_turn added to all.`
- `[2026-06-04] BUG: metabuff-mega Phase 0 file-picker output was discarded (yield with no capture). Thinker always received filePaths: [] — operated blind. Fixed: capture file-picker toolResult, extract paths, pass to thinker.`
- `[2026-06-04] BUG: metabuff-mega SDD review ran Stage 1 + Stage 2 in the same spawn_agents call (parallel). Stage 2 ran even when Stage 1 found [CRITICAL] violations. Fixed: split into two sequential yield calls — Stage 1 then Stage 2.`
- `[2026-06-04] BUG: hooks.json PreImplementation hook fired on before_spawn:codebuff/base which no longer exists — brainstorming gate never enforced. Fixed: added before_spawn:ecc-code-architect to the events list.`
- `[2026-06-04] BUG: metabuff-validator.ts spawnableAgents contained 'metabuff' for fix passes — spawning the full orchestrator created validator→metabuff→mega→validator loop risk. Fixed: replaced with 'ecc-code-architect'.`
- `[2026-06-04] BUG: metabuff-validator.ts instructions did not specify filePaths param when spawning thinker-with-files-gemini. Fixed: added explicit filePaths guidance to instructions.`
- `[2026-06-04] BUG: metabuff.ts had duplicate 'ecc-code-architect' in spawnableAgents (line 238 + line 254 — once as base replacement, once in ECC block). Fixed: removed the duplicate in the ECC block.`
- `[2026-06-04] BUG: parseDecomposition regex /\[[\s\S]*?\]/s was non-greedy — matched the first inner array in nested structures, causing JSON.parse to fail and falling back to single-subtask every time JSON contained arrays. Fixed: use outermost [ ... ] span via indexOf/lastIndexOf.`
- `[2026-06-04] BUG: metabuff-mega.ts spawnableAgents included 'metabuff' — created re-entrancy path mega→metabuff→mega. Fixed: replaced with 'ecc-code-architect'.`
- `[2026-06-04] DESIGN_ISSUE: ecc-code-architect.ts had spawn_agents in toolNames but spawnableAgents: [] — tool was always a no-op, potentially confusing the LLM. Fixed: added thinker-with-files-gemini to spawnableAgents.`

- `[2026-06-04] BUG: THREE invalid tool names remained in ALL 70+ agent files after previous glob/file_picker fix: 'basher' (should be 'run_terminal_command'), 'code_searcher' (should be 'code_search'), 'websearch' (should be 'web_search'), and 'webfetch' (no valid equivalent, removed). Per official codebuff.com/docs/agents/agent-reference valid tools list. Fixed: bulk sed replacement across all .ts files. Additionally, 'basher' was used as agent_type in spawn_agents calls — these were converted to direct run_terminal_command tool yields.`

- `[2026-06-10] DESIGN_ISSUE: All 68+ custom agents without handleSteps failed with free_mode_invalid_agent_model. Freebuff free tier requires handleSteps for custom agents — prompt-only agents are rejected. Fixed: added handleSteps wrappers to all agents (Pattern A shim for 63 ECC agents via shared createHandleSteps template, Pattern B generators for metabuff-reasoner and metabuff-validator).`
- `[2026-06-10] HALLUCINATION: Duplicate 'find_files' found in toolNames of metabuff-arch, metabuff-security, metabuff-testgen. Fixed: removed duplicates.`
- `[2026-06-10] HALLUCINATION: Duplicate 'ecc-code-architect' in metabuff-mega spawnableAgents. Fixed: removed duplicate.`
- `[2026-06-10] QUAL: Added MiMo 2.5 Pro and Kimi K2.6 model support via model-config.ts with env var → config file → default resolution order. All agents now use resolveModel() for model selection.`
- `[2026-06-10] CLEANUP: Removed researcher-web.ts and researcher-docs.ts — both used unsupported Gemini model and were not referenced in active pipelines. References removed from metabuff.ts and metabuff-mega.ts spawnableAgents.`
