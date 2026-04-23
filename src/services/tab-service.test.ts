import { describe, expect, it } from "vitest";
import { buildRecentlyClosedTab } from "./tab-service";

describe("buildRecentlyClosedTab", () => {
  it("merges chrome tab info with stored metadata", () => {
    const result = buildRecentlyClosedTab(
      {
        id: 7,
        title: "Docs",
        url: "https://docs.example.com/page",
        favIconUrl: "https://docs.example.com/favicon.ico"
      } as chrome.tabs.Tab,
      {
        categoryId: "study",
        customTitle: "Reading Queue",
        note: "important",
        classificationMode: "manual",
        updatedAt: 1
      }
    );

    expect(result.id).toContain("7-");
    expect(result.domain).toBe("docs.example.com");
    expect(result.customTitle).toBe("Reading Queue");
    expect(result.note).toBe("important");
    expect(result.categoryId).toBe("study");
  });
});
