import { describe, expect, it } from "vitest";
import type { CategoryEntity } from "../types/category";
import type { StoredTabMeta } from "../types/tab";
import { clearCategoryFromTabsMeta, validateCategoryName } from "./category-service";

function makeCategory(categoryId: string, name: string): CategoryEntity {
  const now = Date.now();
  return {
    categoryId,
    name,
    sourceType: "manual",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now
  };
}

describe("validateCategoryName", () => {
  it("trims a valid category name", () => {
    const normalized = validateCategoryName([], makeCategory("cat-1", "  Reading  "));
    expect(normalized).toBe("Reading");
  });

  it("rejects duplicate names case-insensitively", () => {
    expect(() =>
      validateCategoryName(
        [makeCategory("cat-1", "Work")],
        makeCategory("cat-2", " work ")
      )
    ).toThrow("分类名称不能重复");
  });
});

describe("clearCategoryFromTabsMeta", () => {
  it("clears matching category assignments and keeps unrelated tabs intact", () => {
    const meta: Record<string, StoredTabMeta> = {
      "1": {
        categoryId: "manual-work",
        customTitle: "Task Board",
        classificationMode: "manual",
        updatedAt: 1
      },
      "2": {
        categoryId: "manual-study",
        note: "keep this one",
        classificationMode: "manual",
        updatedAt: 2
      }
    };

    const result = clearCategoryFromTabsMeta(meta, "manual-work");

    expect(result["1"]?.categoryId).toBeUndefined();
    expect(result["1"]?.classificationMode).toBe("auto");
    expect(result["1"]?.customTitle).toBe("Task Board");
    expect(result["2"]).toEqual(meta["2"]);
  });
});
