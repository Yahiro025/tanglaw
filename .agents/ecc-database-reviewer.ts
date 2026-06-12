/**
 * ECC Database Reviewer — Integrated into MetaBuff Ecosystem
 *
 * Database and Supabase code reviewer. Checks schema design, migrations,
 * query performance, RLS policies, and indexing strategies.
 *
 * Source: ECC (affaan-m/ECC) agents/database-reviewer.md
 */

import { AgentDefinition } from './types/agent-definition'
import { createHandleSteps } from './handle-steps-template'

const definition: AgentDefinition = {
  id: 'ecc-database-reviewer',
  version: '1.0.0',
  displayName: 'ECC Database Reviewer',

  spawnerPrompt:
    'Database code reviewer specializing in schema design, query performance, migrations, and Supabase. ' +
    'Use for reviewing Prisma schema changes, SQL migrations, query patterns, and RLS policies.',

  model: (() => {
    try {
      return require('./model-config').resolveModel()
    } catch {
      return 'deepseek/deepseek-v4-flash'
    }
  })(),

  reasoningOptions: { enabled: true, exclude: false, effort: 'medium' },

  toolNames: ['read_files', 'code_search', 'str_replace', 'run_terminal_command', 'find_files', 'spawn_agents', 'end_turn', 'think_deeply'],

  spawnableAgents: [],

  systemPrompt:
    'You are an expert database code reviewer specializing in schema design, query performance, and migrations. ' +
    'You check for: efficient queries, proper indexing, safe migrations, RLS policies, N+1 patterns, and Supabase best practices.',

  instructionsPrompt: `## Review Checklist

### Schema Design
- Tables properly normalized (3NF where appropriate)
- Appropriate data types (not text for booleans, etc.)
- Foreign keys defined with proper cascade behavior
- Indexes on frequently queried columns
- Unique constraints where needed

### Migrations
- Reversible migrations (up AND down)
- No data loss in migration steps
- Backfill steps for new required columns
- Migration run in transaction where safe
- Tested on staging before production

### Query Performance
- No SELECT * on large tables
- LIMIT on user-facing queries
- JOINs instead of N+1 patterns
- EXPLAIN ANALYZE reviewed for new queries
- Appropriate indexes for WHERE/JOIN/ORDER BY

### Security (Supabase/PostgreSQL)
- RLS policies enabled on all user-data tables
- Row-level access matches authorization rules
- No raw SQL with string interpolation
- Parameterized queries everywhere
- Service role key never exposed to client

### Common Anti-Patterns
- Missing indexes on foreign key columns
- N+1 queries (fetching in loop instead of JOIN)
- Missing RLS on tables with user data
- Using service_role key in client-side code
- Large transactions holding locks too long`,

  handleSteps: createHandleSteps(),
}

export default definition
