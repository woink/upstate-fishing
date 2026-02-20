# Commit Rules

## Subject Line

- **Format**: `type(scope): description`
- **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `style`
- **Scope**: match the area of change (e.g., `supabase`, `ci`, `usgs`, `map`, `e2e`, `cache`,
  `predictions`, `weather`, `streams`, `hatches`, `routes`, `islands`) — see [glossary](glossary.md)
  for domain terms
- Max 72 characters, imperative mood, lowercase, no trailing period

## Atomic Commits

- One logical change per commit — don't mix refactors with features or bug fixes
- If a task touches multiple concerns, split into separate commits
- Prefer 3 small commits over 1 large one
- Each commit should pass CI independently (no broken intermediate states)

## Body

- Blank line between subject and body
- Wrap at 72 characters
- First paragraph: explain _why_ — the problem or motivation
- Subsequent paragraphs (if needed): explain _how_ and note non-obvious decisions
- Use `-` bullet points for multi-part changes
- Reference issues where applicable (`Fixes #123`, `Part of #456`)

## Avoid

- Vague subjects: "update code", "fix bug", "misc changes"
- Describing the diff — the diff is right there
- Filler phrases: "This commit...", "This patch...", "Changes include..."
- Log-style entries: "Added X, then Y, then Z"
- Bundling unrelated changes to "save a commit"
