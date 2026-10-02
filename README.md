# TANGLAW

TANGLAW (Tagalog for "light" or "illumination") is an AI-powered scholarship navigation portal designed for Filipino tertiary students. It combines a scholarship directory, readiness assessment, exam reviewer, and an AI chatbot companion into a single, guided dashboard experience.

---

## Problem

Filipino tertiary students face significant barriers when searching for and applying to scholarships. According to recent data, only 30.5% of Grade 3 learners show basic reading proficiency and just 0.47% of Grade 12 learners demonstrate grade-level readiness. Scholarship research is noisy, fragmented, and difficult to navigate. Many students lack access to verified grant sources, eligibility summaries, and application support tools in one place, leaving them overwhelmed and underserved by existing resources.

---

## Solution

TANGLAW addresses these challenges by providing a centralized, AI-powered platform that simplifies scholarship discovery and preparation. The system is a full-stack application with a Next.js frontend, Express backend, PostgreSQL database, LangChain AI integration, and Supabase hosting. Users can register, browse scholarships with advanced filtering, take readiness assessments, review exam materials, and chat with an AI companion named Owel to guide them through the application journey. The portal focuses on making scholarships easier to find, understand, and act on.

---

## Technologies Used

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, lucide-react |
| **Backend** | Express.js, TypeScript (CommonJS), Prisma v7 ORM |
| **Database** | PostgreSQL (Supabase), pgvector for embeddings |
| **AI / LLM** | Google Gemini 3.1 Flash-Lite (primary), OpenRouter free models (fallback cascade), LangChain |
| **Authentication** | NextAuth.js v4 (Credentials, Google, Microsoft Entra), JWT (jsonwebtoken + bcryptjs) |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **Deployment** | Vercel (frontend), Render (backend), Supabase (database) |
| **Package Manager** | npm |

---

## Key Features

- **Scholarship Browser** — Search and filter scholarships by income bracket, sector (public/private), and program category with eligibility recommendations
- **Readiness Assessment** — Timed multi-subject quiz covering Math, Science, English, Filipino, and Logic
- **Exam Reviewer** — Review practice questions with explanations and difficulty levels
- **AI Chatbot Companion** — Owel, an AI-powered assistant using RAG (Retrieval-Augmented Generation) to answer scholarship-related queries
- **Secure Student Dashboard** — Protected routes with NextAuth.js authentication and JWT-based API access
- **Responsive UI** — Animated, accessible interface built with Framer Motion and Tailwind CSS

---

## How to Run the Project

### Prerequisites

- Node.js 20 or later
- npm
- A Supabase account (for PostgreSQL database)

### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

The backend runs on `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

### Optional Checks

```bash
# TypeScript typecheck
cd frontend && npx tsc --noEmit

# Lint
cd frontend && npm run lint

# Unit tests
cd frontend && npx vitest run

# E2E tests (requires running dev server)
npx playwright test
```

---

## Project Structure

```
tanglaw/
├── frontend/                  — Next.js 16 App Router (deployed on Vercel)
│   ├── src/app/               — Pages and API routes
│   │   ├── (auth)/            — Login and signup pages
│   │   ├── dashboard/         — Authenticated dashboard (scholarships, readiness, reviewer)
│   │   ├── api/               — Chat API and NextAuth handler
│   │   └── page.tsx           — Landing page
│   ├── src/components/        — UI components (scholarship browser, chatbot, quiz)
│   └── src/lib/               — API client, auth config, AI model tools
│
├── backend/                   — Express API (deployed on Render)
│   ├── src/
│   │   ├── controllers/       — Auth, scholarship, and chat controllers
│   │   ├── middleware/        — JWT authentication middleware
│   │   ├── routes/            — API route definitions
│   │   └── services/          — Prisma client, chat service, scholarship search
│   ├── prisma/                — Database schema (source of truth) and seed data
│   └── start.sh               — Render deploy script
│
├── CLAUDE.md                  — Project context for AI assistants
├── DESIGN.md                  — Design system specification
├── PRODUCT.md                 — Product vision and brand personality
├── DEPLOY.md                  — Full deployment guide (Vercel + Render + Supabase)
└── render.yaml                — Render Blueprint configuration
```

---

## License

This project is intended for academic and project submission use.

---

## Documentation & Development Team

### Documentation Team

| Portrait | Member & role | Contribution | Profile | GitHub |
|----------|---------------|--------------|---------|--------|
| <img src="frontend/public/team/salvaloza2.0.webp" alt="Godsent John C. Salvaloza" width="72"> | **Godsent John C. Salvaloza**<br>Documentation Head | Oversees all paper sections, references indexation, and final compiled academic paper validation. | — | — |
| <img src="frontend/public/team/bonador2.0.jpg" alt="Rhaine Venice B. Bonador" width="72"> | **Rhaine Venice B. Bonador**<br>Introduction Writer | Handles Chapter 1 problem contexts, general socioeconomic gaps, and solution frameworks. | — | [GitHub](https://github.com/rhainebonador) |
| <img src="frontend/public/team/madera2.0.webp" alt="Kyle Ashley B. Madera" width="72"> | **Kyle Ashley B. Madera**<br>Statement of the Problem Writer | Transforms operational goals into measurable research questions, metrics, and study definitions. | — | [GitHub](https://github.com/mkyleashley) |
| <img src="frontend/public/team/alberto2.0.jpg" alt="Hannah Mae V. Alberto" width="72"> | **Hannah Mae V. Alberto**<br>RRL Lead Writer | Manages literature review synthesis, source curation, and academic narrative alignment. | — | [GitHub](https://github.com/hannahmaeva) |
| <img src="frontend/public/team/partible2.0.jpg" alt="Hannah Nicole B. Partible" width="72"> | **Hannah Nicole B. Partible**<br>RRL Assistant & Citation Checker | Maintains reference accuracy, citation formatting, and academic consistency. | — | [GitHub](https://github.com/nicole-partible) |
| <img src="frontend/public/team/perez2.0.webp" alt="Emerald T. Perez" width="72"> | **Emerald T. Perez**<br>Methodology Writer | Structures the research design, evaluation method, and analytical process. | — | [GitHub](https://github.com/emzxcsss) |
| <img src="frontend/public/team/araullo2.0.webp" alt="Julliane Mae G. Araullo" width="72"> | **Julliane Mae G. Araullo**<br>Results Writer | Compiles findings, performance metrics, and usability impact narratives. | [LinkedIn](https://www.linkedin.com/in/julliane-mae-araullo-0a7167386/) | [GitHub](https://github.com/jullianeqt) |
| <img src="frontend/public/team/pajares2.0.jpg" alt="Daniel F. Pajares" width="72"> | **Daniel F. Pajares**<br>Discussion Writer | Explains implications, limitations, and future recommendations of the project. | — | [GitHub](https://github.com/dane20pajares-hub) |

### Development Team

| Portrait | Member & role | Contribution | Profile | GitHub |
|----------|---------------|--------------|---------|--------|
| <img src="frontend/public/team/payoyo2.0.jpg" alt="Bennett P. Payoyo" width="72"> | **Bennett P. Payoyo**<br>Project Manager | Directs operational scope, research alignment, task delegation, and final deployment quality gates. | [LinkedIn](https://www.linkedin.com/in/bennett-payoyo/) | [GitHub](https://github.com/Yahiro025) |
| <img src="frontend/public/team/albano2.0.jpg" alt="An-joe Mikael T. Albano" width="72"> | **An-joe Mikael T. Albano**<br>Frontend Developer | Leads interface delivery, motion polish, and responsive behavior. | [LinkedIn](https://www.linkedin.com/in/an-joe-mikael-albano-2aa598365/) | [GitHub](https://github.com/Mikael1206) |
| <img src="frontend/public/team/delosreyes2.0.jpg" alt="Levrone Viel S. Delos Reyes" width="72"> | **Levrone Viel S. Delos Reyes**<br>Frontend & QA | Supports UI quality checks, interaction validation, and accessibility review. | — | [GitHub](https://github.com/solevyiel) |
| <img src="frontend/public/team/faustino2.0.webp" alt="Charles Joseph V. Faustino" width="72"> | **Charles Joseph V. Faustino**<br>Backend Developer & Database Manager | Builds server interactions, data flow structure, and simulated persistence pathways. | [LinkedIn](https://www.linkedin.com/in/charles286/) | [GitHub](https://github.com/Glyneria) |
| <img src="frontend/public/team/cruz2.0.png" alt="Justin Angelo G. Cruz" width="72"> | **Justin Angelo G. Cruz**<br>QA Tester / Technical Documentation | Manages test matrices, documentation clarity, and final feature verification. | — | [GitHub](https://github.com/cruzjustin118-art) |

**Institution:** Polytechnic University of the Philippines (PUP Manila) — BSCS 1-2, Science, Technology, and Society (STS)
