import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory, RunnablePassthrough } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { searchScholarshipsAsContext, getAllScholarshipsAsContext } from "./scholarshipSearchService";

// ─── Session store: persists conversation history per session_id ─────────────
const sessionStore = new Map<string, InMemoryChatMessageHistory>();

function getSessionHistory(sessionId: string): InMemoryChatMessageHistory {
  if (!sessionStore.has(sessionId)) {
    sessionStore.set(sessionId, new InMemoryChatMessageHistory());
  }
  return sessionStore.get(sessionId)!;
}

export async function generateChatResponse(question: string, sessionId: string) {
  // ── 1. Initialize LLM (OpenRouter – free models) ─────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("No OPENROUTER_API_KEY or OPENAI_API_KEY found in environment variables.");
  }

  // ── 2. Query Condensation Prompt ─────────────────────────────────────────
  const condensePrompt = ChatPromptTemplate.fromMessages([
    new MessagesPlaceholder("chat_history"),
    [
      "human",
      `Given the conversation above, rephrase the following follow-up question into a single, standalone search query for finding scholarships. 
Output ONLY the search query — do NOT answer the question or add any explanation.
If the question is already standalone (no prior context needed), return it unchanged.

Follow-up question: {question}`,
    ],
  ]);

  // ── 3. Main System Prompt ─────────────────────────────────────────────────
  const answerPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are **Owel** 🦉, the intelligent scholarship navigation assistant for TANGLAW — a platform helping Filipino tertiary students find scholarships at Polytechnic University of the Philippines (PUP Manila).

You MUST follow ALL directives below without exception:

---

## DIRECTIVE 1: ANTI-HALLUCINATION (Highest Priority)
- Your answers must be grounded **exclusively** in the Scholarship Context provided below.
- If the answer is not in the context, respond: "Hoot! I don't have that specific information in my scholarship database yet. Please check with the PUP Office of Student Financial Assistance (OSFA) or the scholarship's official page for the most up-to-date details."
- NEVER invent GWA thresholds, income limits, deadlines, or requirements that are not explicitly stated in the context.
- If a field (e.g., deadline) is not mentioned, say "Not specified in the database."

---

## DIRECTIVE 2: SCHOLARSHIP MATCHMAKING (Profile-Based)
When the student provides profile information (year level, program/course, GWA/grades, or family income), perform a structured match:

**Step-by-step reasoning:**
1. Parse the student's profile: Year Level, Program, GWA (on 5.0 scale where 1.0 is highest, or percentage), Family Income.
2. Review each scholarship's eligibility: minimum GWA, priority programs, income cap, year level requirement, public/private university status.
3. For each scholarship in the context, decide: QUALIFY ✅ or DOES NOT QUALIFY ❌ — explain briefly why.
4. Present ONLY the qualifying scholarships in a clean, organized list.
5. For each match, cite the specific eligibility rule that was satisfied (e.g., "Your GWA of 1.75 meets the minimum of 2.00").

**Note on GWA:** PUP uses a 5.0 scale (1.0 = best). Some scholarships use percentages (85% = GWA 2.00 approximately). Clarify when needed.

---

## DIRECTIVE 3: DETAILED SCHOLARSHIP Q&A
For questions about specific scholarships (requirements, benefits, deadlines, etc.):
- Use **bold** headings and organized bullet points.
- Structure answers with clear sections: **Overview**, **Coverage/Benefits**, **Eligibility**, **Requirements**, **Exam/Process**, **Deadline**, **More Info**.
- When return-of-service (ROS) applies, highlight it prominently with a note about its importance.
- Include the application URL if present in the context.

---

## DIRECTIVE 4: TONE & PERSONALITY
- Be warm, encouraging, and professional — like a knowledgeable kuya/ate helping a classmate.
- Use friendly Filipino-student-appropriate language (occasional "Hoot!", encouragement).
- Keep responses concise but complete. Avoid unnecessary filler.
- Use markdown formatting (bold, bullets, headers) for readability in the chat UI.

---

## Scholarship Context (Retrieved from Database):
{context}`,
    ],
    new MessagesPlaceholder("chat_history"),
    ["human", "{question}"],
  ]);

  // ── 4. Run with Multiple Fallback Models ──────────────────────────────────
  const MODELS = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-120b:free",
    "openrouter/owl-alpha",
    "meta-llama/llama-3-8b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-2-9b-it:free",
  ];

  let lastError: unknown = null;

  for (const modelName of MODELS) {
    try {
      console.log(`[Owel RAG] Attempting generation with model: ${modelName}`);

      const model = new ChatOpenAI({
        modelName,
        apiKey,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
        temperature: 0.2,
      });

      const condenseChain = condensePrompt
        .pipe(model)
        .pipe(new StringOutputParser());

      const ragChain = RunnablePassthrough.assign({
        context: async (input: {
          question: string;
          chat_history?: any[];
        }) => {
          let searchQuery = input.question;

          if (input.chat_history && input.chat_history.length > 0) {
            try {
              const condensed = await condenseChain.invoke({
                question: input.question,
                chat_history: input.chat_history,
              });
              if (condensed?.trim()) {
                searchQuery = condensed.trim();
                console.log(`[Owel DB RAG] Original: "${input.question}" → Condensed: "${searchQuery}"`);
              }
            } catch (err) {
              console.warn(`[Owel DB RAG] [${modelName}] Condensation failed, using raw question:`, err);
            }
          }

          // ── Search the database instead of the old vector store ────────────
          const context = await searchScholarshipsAsContext(searchQuery, 8);
          console.log(`[Owel DB RAG] Retrieved context for query: "${searchQuery}"`);
          return context;
        },
      })
        .pipe(answerPrompt)
        .pipe(model)
        .pipe(new StringOutputParser());

      const chainWithHistory = new RunnableWithMessageHistory({
        runnable: ragChain,
        getMessageHistory: getSessionHistory,
        inputMessagesKey: "question",
        historyMessagesKey: "chat_history",
      });

      const answer = await chainWithHistory.invoke(
        { question },
        { configurable: { sessionId } }
      );

      if (answer) {
        console.log(`[Owel DB RAG] Successfully generated response using model: ${modelName}`);
        return answer;
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Owel DB RAG] Model ${modelName} failed: ${errMsg}`);
      lastError = err;
    }
  }

  throw lastError || new Error("All fallback models failed to generate a response.");
}
