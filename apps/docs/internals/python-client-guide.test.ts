import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const GUIDES_DIR = "content/guides/getting-started/python-client";

const PAGES = [
  "start",
  "clients",
  "async-lifecycle",
  "database-queries",
  "authentication",
  "storage-functions",
  "realtime-testing",
] as const;

function getPath(slug: string): string {
  return join(GUIDES_DIR, `${slug}.mdx`);
}

function readPage(slug: string): string {
  const path = getPath(slug);
  if (!existsSync(path)) throw new Error(`Missing: ${path}`);
  return readFileSync(path, "utf-8");
}

describe("Python Client Guide - files exist", () => {
  for (const slug of PAGES) {
    it(`${slug}.mdx exists`, () => {
      expect(existsSync(getPath(slug))).toBe(true);
    });
  }
});

describe("Python Client Guide - frontmatter", () => {
  for (const slug of PAGES) {
    it(`${slug}.mdx has title`, () => {
      const content = readPage(slug);
      expect(content).toContain("title:");
    });

    it(`${slug}.mdx has breadcrumb`, () => {
      const content = readPage(slug);
      expect(content).toContain("Python Client Guide");
    });
  }
});

describe("Python Client Guide - content quality", () => {
  it("all pages contain code blocks", () => {
    for (const slug of PAGES) {
      const content = readPage(slug);
      expect(content).toContain("```");
    }
  });

  it("all pages have headings", () => {
    for (const slug of PAGES) {
      const content = readPage(slug);
      expect(content).toContain("##");
    }
  });
});

describe("Python Client Guide - navigation", () => {
  it("navigation file references all 7 pages", () => {
    const navPath =
      "components/Navigation/NavigationMenu/NavigationMenu.constants.ts";
    const navContent = readFileSync(navPath, "utf-8");
    for (const slug of PAGES) {
      const url = `/guides/getting-started/python-client/${slug}`;
      expect(navContent.includes(url)).toBe(true);
    }
  });
});
