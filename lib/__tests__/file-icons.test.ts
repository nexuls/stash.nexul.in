/**
 * The icon lookup is a pile of table reads, and the tables come from a
 * dependency. These cases pin the translation Stash owns: Shiki's language ids
 * are not VS Code's, compound extensions have to beat the last dot segment, and
 * anything unrecognised has to degrade to the generic file rather than throw.
 */

import { describe, expect, it } from "bun:test";
import {
  codeIconId,
  fileIconId,
  folderIconId,
  languageIconId,
  readIconSvg,
} from "@/lib/icons/file-icons";

describe("fileIconId", () => {
  it("matches a known filename before an extension", () => {
    expect(fileIconId("Dockerfile")).toBe("docker");
    expect(fileIconId("package.json")).toBe("nodejs");
    expect(fileIconId("go.mod")).toBe("go-mod");
  });

  it("prefers the longest compound extension", () => {
    expect(fileIconId("button.test.ts")).toBe("test-ts");
    expect(fileIconId("button.ts")).toBe("typescript");
  });

  it("reads through a path and ignores case", () => {
    expect(fileIconId("src/components/Counter.TSX")).toBe("react_ts");
  });

  it("falls back to the generic file icon", () => {
    expect(fileIconId("notes.zzz")).toBe("file");
    expect(fileIconId("noextension")).toBe("file");
    expect(fileIconId("")).toBe("file");
  });
});

describe("languageIconId", () => {
  it("translates Shiki ids the manifest does not use", () => {
    // VS Code calls these typescriptreact / javascriptreact / shellscript.
    expect(languageIconId("tsx")).toBe("react_ts");
    expect(languageIconId("jsx")).toBe("react");
    expect(languageIconId("sh")).toBe("console");
    expect(languageIconId("bash")).toBe("console");
  });

  it("resolves ids the manifest knows directly", () => {
    expect(languageIconId("python")).toBe("python");
    expect(languageIconId("rust")).toBe("rust");
    expect(languageIconId("json")).toBe("json");
  });

  it("falls back to an extension lookup", () => {
    // Not a VS Code language id, but a known extension.
    expect(languageIconId("zig")).toBe("zig");
  });

  it("gives plain text and unknown languages the generic icon", () => {
    expect(languageIconId("plaintext")).toBe("file");
    expect(languageIconId("text")).toBe("file");
    expect(languageIconId("nonsense")).toBe("file");
    expect(languageIconId("")).toBe("file");
  });
});

describe("codeIconId", () => {
  it("prefers a title that names a real file", () => {
    expect(codeIconId("components/counter.tsx", "tsx")).toBe("react_ts");
    expect(codeIconId("package.json", "json")).toBe("nodejs");
    // The filename is more specific than the fence language.
    expect(codeIconId("button.test.ts", "typescript")).toBe("test-ts");
  });

  it("falls back to the language when the title is just a label", () => {
    // The showcase heads a shell block with title="Terminal".
    expect(codeIconId("Terminal", "bash")).toBe("console");
    expect(codeIconId("Example", "python")).toBe("python");
    expect(codeIconId("Before / after", "diff")).toBe("diff");
  });

  it("uses the language when there is no title", () => {
    expect(codeIconId(undefined, "rust")).toBe("rust");
  });

  it("falls back to the generic icon when neither matches", () => {
    expect(codeIconId("Terminal", "plaintext")).toBe("file");
    expect(codeIconId("Notes", "nonsense")).toBe("file");
    expect(codeIconId()).toBe("file");
  });
});

describe("folderIconId", () => {
  it("uses the named folder icon and its open variant", () => {
    expect(folderIconId("src")).toBe("folder-src");
    expect(folderIconId("src", true)).toBe("folder-src-open");
  });

  it("falls back to a plain folder", () => {
    expect(folderIconId("whatever")).toBe("folder");
    expect(folderIconId("whatever", true)).toBe("folder-open");
    expect(folderIconId("")).toBe("folder");
  });
});

describe("readIconSvg", () => {
  it("returns the viewBox and inner markup without the outer element", () => {
    const svg = readIconSvg("typescript");
    expect(svg).not.toBeNull();
    expect(svg?.viewBox).toBe("0 0 16 16");
    expect(svg?.body).toContain("<path");
    expect(svg?.body).not.toContain("<svg");
    expect(svg?.body).not.toContain("</svg>");
  });

  it("returns null for an icon that is not shipped", () => {
    expect(readIconSvg("definitely-not-an-icon")).toBeNull();
  });
});
