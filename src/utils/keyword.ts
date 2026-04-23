const keywordMap: Record<string, string[]> = {
  work: ["docs", "notion", "jira", "figma", "slack", "drive"],
  study: ["mdn", "wiki", "course", "learn", "tutorial", "reference"],
  entertainment: ["youtube", "bilibili", "netflix", "spotify"],
  shopping: ["amazon", "taobao", "jd", "ebay", "shop"]
};

export function matchCategoryByKeyword(input: string): string | null {
  const normalized = input.toLowerCase();

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category;
    }
  }

  return null;
}
