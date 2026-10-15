/**
 * Covers the branch that made heading permalinks silently fail: a context with
 * no Clipboard API must still copy, and a context where nothing works must
 * report failure rather than claim success.
 */

import { afterEach, describe, expect, it } from "bun:test";
import { copyText } from "@/lib/clipboard";

type Stub = { navigator?: unknown; document?: unknown };

const original: Stub = {
  navigator: Reflect.get(globalThis, "navigator"),
  document: Reflect.get(globalThis, "document"),
};

function stub(values: Stub) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  }
}

/** Minimal DOM surface for the selection-based path. */
function fakeDocument(execCommandResult: boolean | (() => never)) {
  const appended: unknown[] = [];
  return {
    appended,
    document: {
      createElement: () => ({
        style: {},
        setAttribute() {},
        select() {},
        value: "",
      }),
      body: {
        appendChild: (node: unknown) => appended.push(node),
        removeChild: () => {},
      },
      execCommand: () => {
        if (typeof execCommandResult === "function") return execCommandResult();
        return execCommandResult;
      },
    },
  };
}

afterEach(() => stub(original));

describe("copyText", () => {
  it("uses the Clipboard API when it is available", async () => {
    const written: string[] = [];
    stub({
      navigator: {
        clipboard: {
          writeText: async (text: string) => {
            written.push(text);
          },
        },
      },
    });

    expect(await copyText("https://example.test/page#heading")).toBe(true);
    expect(written).toEqual(["https://example.test/page#heading"]);
  });

  it("falls back to a selection when there is no Clipboard API", async () => {
    // What an http:// LAN origin looks like: no `clipboard` on navigator at all.
    const { document, appended } = fakeDocument(true);
    stub({ navigator: {}, document });

    expect(await copyText("https://example.test/page#heading")).toBe(true);
    expect(appended).toHaveLength(1);
  });

  it("falls back when the Clipboard API is denied", async () => {
    const { document } = fakeDocument(true);
    stub({
      navigator: {
        clipboard: {
          writeText: async () => {
            throw new Error("denied by permissions policy");
          },
        },
      },
      document,
    });

    expect(await copyText("https://example.test/page#heading")).toBe(true);
  });

  it("reports failure when neither path works", async () => {
    const { document } = fakeDocument(false);
    stub({ navigator: {}, document });

    expect(await copyText("https://example.test/page#heading")).toBe(false);
  });

  it("reports failure when the fallback throws", async () => {
    const { document } = fakeDocument(() => {
      throw new Error("execCommand unsupported");
    });
    stub({ navigator: {}, document });

    expect(await copyText("https://example.test/page#heading")).toBe(false);
  });

  it("does not try to copy nothing", async () => {
    stub({
      navigator: {
        clipboard: {
          writeText: async () => {
            throw new Error("should not be called");
          },
        },
      },
    });

    expect(await copyText("")).toBe(false);
  });
});
