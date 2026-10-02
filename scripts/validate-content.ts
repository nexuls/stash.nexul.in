/**
 * Command-line script for content validation.
 *
 * Runs the content filesystem validator and prints formatted, actionable feedback
 * for broken links, missing assets, malformed frontmatter, or path naming errors.
 *
 * Notable: Invoked via `bun run validate:content` and part of `bun run check`; exits non-zero on error.
 */

import { validateContent } from "../lib/content";

async function main() {
  console.log("🔍 Validating Stash content filesystem...\n");

  const result = await validateContent();

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  console.log(
    `📦 Discovered ${result.entryCount} entries, ${result.assetCount} adjacent assets.`,
  );

  if (result.issues.length === 0) {
    console.log(
      "\n✅ All content entries, paths, frontmatter, assets, and internal links are valid.\n",
    );
    process.exit(0);
  }

  console.log(
    `\nFound ${errors.length} error(s) and ${warnings.length} warning(s):\n`,
  );

  for (const issue of result.issues) {
    const isError = issue.severity === "error";
    const prefix = isError ? "✖ ERROR" : "⚠ WARNING";
    const loc = issue.line
      ? `:${issue.line}${issue.column ? `:${issue.column}` : ""}`
      : "";

    console.error(`  ${prefix} [${issue.rule}] in ${issue.file}${loc}`);
    console.error(`    ${issue.message}`);
    if (issue.suggestion) {
      console.error(`    ↳ Suggestion: ${issue.suggestion}`);
    }
    console.error("");
  }

  if (errors.length > 0) {
    console.error(
      `❌ Content validation failed with ${errors.length} error(s).\n`,
    );
    process.exit(1);
  } else {
    console.log("⚠️ Content validation completed with warnings.\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Unexpected error during content validation:", err);
  process.exit(1);
});
