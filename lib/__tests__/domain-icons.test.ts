/**
 * A domain's mark is either a Material Icon Theme glyph or a Lucide icon, and
 * which one it is decides whether the markup has to be resolved on the server.
 * These cases pin the two halves of that split and the loose matching that
 * makes an order prefix or a longer directory name still resolve.
 */

import { describe, expect, it } from "bun:test";
import { resolveDomainIcons } from "@/lib/icons/domain-icon-svg";
import { domainMaterialIconId, getDomainIcon } from "@/lib/icons/domain-icons";

describe("domainMaterialIconId", () => {
  it("gives React, TypeScript and authoring their own theme glyphs", () => {
    expect(domainMaterialIconId("react")).toBe("react");
    expect(domainMaterialIconId("typescript")).toBe("typescript");
    expect(domainMaterialIconId("authoring")).toBe("mdx");
  });

  it("matches loosely and ignores case", () => {
    expect(domainMaterialIconId("React")).toBe("react");
    expect(domainMaterialIconId("react-native")).toBe("react");
    expect(domainMaterialIconId("advanced typescript")).toBe("typescript");
  });

  it("leaves every other domain to its Lucide icon", () => {
    expect(domainMaterialIconId("linux")).toBeUndefined();
    expect(domainMaterialIconId("databases")).toBeUndefined();
    expect(domainMaterialIconId("")).toBeUndefined();
  });
});

describe("resolveDomainIcons", () => {
  it("reads markup only for the domains that have a glyph", () => {
    const icons = resolveDomainIcons([
      "react",
      "typescript",
      "authoring",
      "go",
    ]);

    expect(Object.keys(icons).sort()).toEqual([
      "authoring",
      "react",
      "typescript",
    ]);
    expect(icons.react?.viewBox).toBe("0 0 32 32");
    expect(icons.react?.body).toContain("<path");
    expect(icons.react?.body).not.toContain("<svg");
    expect(icons.typescript?.body).toContain("<path");
  });

  it("keys the markup by slug, not by icon id", () => {
    const icons = resolveDomainIcons(["01 - react"]);
    expect(icons["01 - react"]).toBeDefined();
  });

  it("returns nothing when no domain has a glyph", () => {
    expect(resolveDomainIcons(["linux", "databases"])).toEqual({});
  });
});

describe("getDomainIcon", () => {
  it("still resolves a Lucide icon for every domain", () => {
    expect(getDomainIcon("authoring").displayName ?? "").not.toBe("");
    expect(getDomainIcon("whatever")).toBe(getDomainIcon("unknown-domain"));
  });
});
