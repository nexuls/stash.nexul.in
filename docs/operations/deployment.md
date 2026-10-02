# Deployment

## Status

Confirmed deployment provider: **Vercel** (Next.js App Router with Bun). Production domain: `stash.nexul.in`.

## Platform configuration

- **Provider**: Vercel
- **Framework**: Next.js (`framework: "nextjs"` in `vercel.json`)
- **Package manager**: Bun (detected automatically via `bun.lock` and `packageManager: "bun@1.3.14"` in `package.json`)
- **Build command**: `bun run build` (or Next.js default `next build`)
- **Install command**: `bun install`
- **Output directory**: Default Next.js build output (`.next`)
- **Node.js / Bun runtime**: Modern LTS / Bun runtime

## Pre-deployment checks

Deployments should enforce the following sequence:
1. `bun run lint` (Biome linter and code formatting)
2. `bun x tsc --noEmit` (TypeScript type checking)
3. `bun run validate:content` (Content validation once implemented in Stage 1)
4. `bun run test` (Focused tests once implemented in Stage 7)
5. `bun run build` (Next.js static optimization and production build)

Deployment must fail when any pre-deployment check or the production build fails.

## Environments and previews

- **Production**: Main branch deploys to `stash.nexul.in`.
- **Preview deployments**: Pull requests and topic branches generate isolated preview URLs with identical build configuration.
- **Rollbacks**: Instant rollbacks to previous successful deployments are managed through the Vercel dashboard.
