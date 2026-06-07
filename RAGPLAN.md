# RAGPLAN — Owel Chatbot Optimization Roadmap

## Overview

Owel's current RAG pipeline (`backend/src/services/chatService.ts`) uses Google Gemini 3.1 Flash-Lite (free) → 6 OpenRouter free model fallbacks. This plan covers three tracks: **cost reduction**, **hallucination prevention**, and **reasoning quality**, prioritized by effort-to-impact.

---

## Track 1: Cost Reduction

### Immediate (no code)

| Tactic | Savings | Details |
|---|---|---|
| Keep preloaded prompts | 100% for those 4 queries | `owel-chatbot.tsx:289` — static Q&A bypasses AI entirely |
| Keep Gemini Flash-Lite as primary | ~$0 | Already working, no code change needed |

### Quick wins (< 30 min)

| Tactic | Savings | Where |
|---|---|---|
| Reduce `topK` from 8 → 5 | ~40% of input tokens | `scholarshipSearchService.ts:29` — only 8 scholarships exist; 5 is enough |
| Skip condensation when history is empty | ~30% of LLM calls | `chatService.ts:142` — no need to condense on first turn |
| Set `temperature: 0` | Negligible but deterministic | `chatService.ts:232` |

### Model swap (1 config change)

| Option | Input $/M | Output $/M | vs Pro |
|---|---|---|---|
| **DeepSeek V4 Flash** (recommended) | $0.14 / $0.0028 cached | $0.28 | 3× cheaper |
| DeepSeek V4 Pro | $0.435 / $0.003625 cached | $0.87 | baseline |

**Recommendation**: Use DS V4 Flash as primary. For a RAG chatbot answering questions about 8 scholarships, Flash is more than capable. Swap DeepSeek V4 Pro in only if you need thinking-mode reasoning for complex matchmaking.

### Medium effort (2-4 hours)

| Tactic | Savings | Details |
|---|---|---|
| Chat history summarization | ~30-50% uncached input | Replace raw `chat_history` array with a 1-paragraph summary per session |
| Smart model routing | ~50-70% | Flash for simple Q&A, Pro only for profile-matching / GWA calculations |
| pgvector semantic search | ~20-30% + better quality | Fewer, more relevant results → smaller context. Schema already has `contentVector` column but it's never populated. |

---

## Track 2: Anti-Hallucination

### Current problems

1. **ILIKE search is fragile** — querying "computer science" won't match "BSCS" or "STEM". The RAG often returns wrong or zero matches.
2. **Fallback-to-all-scholarships is counterproductive** (`scholarshipSearchService.ts:46-54`) — when ILIKE returns nothing, it dumps all 8 records. The model then has irrelevant context and may hallucinate connections.
3. **No structured output** — free-form markdown with no schema enforcement makes it easy to invent fields.

### Additions (ordered by ROI)

| Addition | Effort | Impact | Where |
|---|---|---|---|
| **Remove fallback-to-all** | 10 min | High | `scholarshipSearchService.ts:46-54` — let the prompt's Directive 1 handle "I don't know" |
| **Query expansion** | 30 min | High | Before retrieval, map user terms to related keywords (BSCS → CS, STEM, IT, Technology) |
| **Citation enforcement in prompt** | 30 min | High | Append to system prompt: "For each claim, cite the source field (e.g., [from DOST-SEI: requirements])" |
| **pgvector semantic search** | 3 hours | Highest | Replace ILIKE with embeddings. Use `text-embedding-3-small` or `gte-small`. The `contentVector` column already exists. |
| **Structured output (Zod schema)** | 2 hours | Medium | `{ answer, citations[], confidence }` via LangChain `.withStructuredOutput()` |
| **Self-consistency check** | 2 hours | Medium | Generate twice at low temperature; if answers diverge → low confidence → fallback |

---

## Track 3: Better Thinking & Reasoning

### What already works
- Step-by-step matchmaking instructions (Directive 2)
- Philippine GWA conversion table in prompt
- `temperature: 0.2` is appropriate

### Additions

| Addition | Effort | Impact | Details |
|---|---|---|---|
| **Few-shot examples in system prompt** | 1 hour | **Highest** | Add 2-3 worked Q&A examples showing ideal response structure, especially for GWA matchmaking |
| **Use DS V4 Flash thinking mode** | Config only | High | Flash also supports thinking mode (default on all V4 models). Generates chain-of-thought before answering. |
| **Query expansion** | 30 min | High | Also improves retrieval quality (anti-hallucination benefit too) |
| **ReAct agent pattern** | 4 hours | High | Replace passive RAG chain with LangChain `AgentExecutor`. Model can search → read → search again → answer iteratively. |
| **Multi-turn profile extraction** | 1 hour | Medium | If user gives partial info ("I'm a BSCS student"), ask clarifying questions before matching |
| **Response format enforcement** | 30 min | Medium | Directives 3-4 already request structured formatting; enforce more strictly with examples |

---

## Recommended Implementation Order

### Phase 1 (~2 hours, highest ROI)
1. Remove fallback-to-all-scholarships behavior
2. Add query expansion before retrieval
3. Add 3 few-shot examples to system prompt
4. Reduce `topK` from 8 to 5
5. Skip condensation call when history is empty
6. Switch to DS V4 Flash as primary (or keep free Gemini, your call)

### Phase 2 (~4 hours, medium ROI)
7. Replace ILIKE with pgvector semantic search (column already exists)
8. Add citation enforcement to system prompt
9. Switch to ReAct agent pattern
10. Add chat history summarization

### Phase 3 (optional)
11. Structured output with Zod
12. Smart model routing (Flash ↔ Pro)
13. Self-consistency checks
14. Multi-turn profile extraction
