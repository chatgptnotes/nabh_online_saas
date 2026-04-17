# CLAUDE.md - NABH Evidence Creator

## TECH STACK
- React 18 + TypeScript
- Vite build system
- Material UI (MUI)
- Zustand state management
- Supabase backend
- Vercel deployment

## CURRENT STATUS
- Multi-Hospital Architecture implemented (Hope & Ayushman Hospitals)
- Dynamic logo and branding based on selected hospital
- Header dropdown allows switching between hospitals
- Evidence generation uses REAL Hope Hospital patient database
- Real patient data fetched from Supabase nabh_patients table
- Real staff data fetched from Supabase nabh_team_members table
- Realistic SVG signatures for Jagruti, Gaurav, and Dr. Shiraz Sheikh
- Evidence documents now show filled formats with actual patient names and Visit IDs
- Successfully deployed to production

## MISSION
Monitor production deployment and ensure evidence generation uses real database data correctly.

## COMPLETED FEATURES
1. Multi-Hospital Config [COMPLETED]
2. Hospital Switcher UI [COMPLETED]
3. Dynamic Evidence Generation [COMPLETED]
4. Real Patient Database Integration [COMPLETED]
5. Realistic Signatures [COMPLETED]
6. Build & Test [COMPLETED]
7. Production Deployment [COMPLETED]

## PRODUCTION URLS
- Primary: https://nabhonline.vercel.app
- Latest: https://nabhonline-30f0vyiz5-chatgptnotes-6366s-projects.vercel.app

## QUALITY BARS
- Zero TypeScript errors
- Seamless hospital switching without page reload
- Evidence documents use REAL patient data from database
- Filled formats with actual patient names, Visit IDs, dates
- Professional signatures embedded in all documents

## VERSION TRACKING
- Version: 1.4
- Date: 2026-01-29
- Repository: nabh-evidence-creator
- Footer shows version, date, repo name

## Karpathy Coding Guidelines

> Source: https://github.com/forrestchang/andrej-karpathy-skills
> Derived from Andrej Karpathy's observations on LLM coding pitfalls.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that was not requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical Changes
- Do not improve adjacent code, comments, or formatting.
- Do not refactor things that are not broken.
- Match existing style, even if you would do it differently.
- Only remove imports/variables/functions that YOUR changes made unused.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals before starting.
- For multi-step tasks, state a brief plan with a verify step for each.
- Define success criteria concretely — weak criteria require constant clarification.

