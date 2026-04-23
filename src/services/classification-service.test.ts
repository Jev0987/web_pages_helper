import { describe, expect, it } from "vitest";
import type { CategoryEntity } from "../types/category";
import type { TabEntity } from "../types/tab";
import { classifyTabs } from "./classification-service";

function makeCategory(categoryId: string, name: string): CategoryEntity {
  const now = Date.now();
  return {
    categoryId,
    name,
    sourceType: "system",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now
  };
}

function makeTab(overrides: Partial<TabEntity>): TabEntity {
  const now = Date.now();
  return {
    tabId: 1,
    windowId: 1,
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    domain: "developer.mozilla.org",
    active: false,
    pinned: false,
    status: "open",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

describe("classifyTabs", () => {
  const categories = [
    makeCategory("todo", "待整理"),
    makeCategory("work", "工作"),
    makeCategory("study", "学习"),
    makeCategory("entertainment", "娱乐"),
    makeCategory("shopping", "购物")
  ];

  it("keeps manual classification unchanged", () => {
    const result = classifyTabs(
      [
        makeTab({
          categoryId: "manual-category",
          classificationMode: "manual",
          title: "YouTube"
        })
      ],
      categories
    );

    expect(result[0]?.categoryId).toBe("manual-category");
    expect(result[0]?.classificationMode).toBe("manual");
  });

  it("classifies study pages by keyword", () => {
    const result = classifyTabs([makeTab({ title: "MDN Learn HTML Course" })], categories);

    expect(result[0]?.categoryId).toBe("study");
    expect(result[0]?.classificationMode).toBe("auto");
  });

  it("falls back to pending when no keyword matches", () => {
    const result = classifyTabs(
      [makeTab({ title: "Random Landing Page", url: "https://example.com" })],
      categories
    );

    expect(result[0]?.categoryId).toBe("todo");
  });
});
