# Claude Code Configuration

## Token Optimization Strategy

### 1. Plan Mode First
- Use plan mode for ANY task with 3+ steps or architectural decisions
- Stop and re-plan immediately if blocked—don't push forward blindly
- Never skip planning for "simple" tasks that have hidden complexity

### 2. Aggressive Subagent Delegation (Token Saver)
- **Offload ALL exploration & research to subagents** (Explorer, general-purpose)
- Never perform repetitive searches in main context
- Send subagents for: codebase exploration, multi-file analysis, parallel research
- Keep main context focused on implementation only

### 3. Conciseness Everywhere
- One sentence max for status updates
- Lead with answer, skip preamble
- Read only what you need (use offset/limit in Read tool)
- Break dependencies: if parallel tool calls exist, use them
- **No tool call preamble** ("Let me read..." → just read it)

### 4. Verification Before Completion
- Always diff behavior: run tests or check logs before marking done
- Ask yourself: "Would a staff engineer approve this?"
- Never mark task complete without proof it works

### 5. No Over-Engineering
- Change only what was requested
- Don't add comments, docstrings, or error handling unless explicitly needed
- Three similar lines > premature abstraction
- Skip backward-compatibility hacks for unused code—just delete it

### 6. Autonomous Bug Fixing
- When given bug reports: fix immediately, no hand-holding needed
- Point to logs/errors, resolve without context-switching user

### 7. Task Management
- Use TodoWrite for any multi-step work
- Mark ONE task in_progress at a time
- Complete tasks immediately after finishing (don't batch)
- Remove irrelevant tasks from the list

## Implementation Rules

**DO:**
- Use specialized agents (Explore for codebase, Plan for architecture)
- Glob/Grep for single-file searches (faster than agents)
- Run tests/verification before claiming success
- Parallelize independent tool calls
- Be direct and skip filler

**DON'T:**
- Repeat searches in main context (delegate to subagents)
- Create files unless absolutely necessary
- Add features beyond the request
- Propose changes without reading code first
- Estimate time—focus on what needs doing
- Use Bash for find/grep/cat (use dedicated tools)

## Context Preservation
- Write down important info from tool results (they get cleared)
- Reference code via `file:line_number` format
- Avoid recreating context already in current turn

---

**Goal:** Maximize signal, minimize noise. Every token should move toward solving the problem.
