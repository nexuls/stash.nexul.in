# Contributing

Read [AGENTS.md](../../AGENTS.md), [Project state](../PROJECT_STATE.md), and relevant architecture documents before changing the repository.

1. Inspect `git status` and preserve unrelated work.
2. Make the smallest coherent change for the selected task.
3. Run every available relevant check. Do not claim planned checks ran.
4. Review `git diff` and `git status` for generated output, secrets, `.env` files, and unrelated files.
5. Update architecture documentation, ADRs, or project state only when a meaningful decision or architecture change occurred.
6. Commit directly to `main` with a focused conventional commit.

Do not introduce a database, CMS, authentication, admin interface, broad client state, or unnecessary packages without a concrete requirement and an architectural decision record.
