# Deployment

## Status

No deployment provider or release configuration is present in the repository as of 2026-09-30.

Before deployment work begins, confirm the hosting provider and its required configuration. The pipeline should use Bun and, once the corresponding work is implemented, run type checking, Biome, content validation, focused tests, and a production build.

Deployment must fail when content validation or the production build fails. Record provider-specific commands, environment variables, preview behavior, and rollback steps here after the hosting decision is made.
