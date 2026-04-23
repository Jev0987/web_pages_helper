import type { CategoryEntity } from "../types/category";
import type { TabEntity } from "../types/tab";
import { matchCategoryByKeyword } from "../utils/keyword";

function findCategoryByName(categories: CategoryEntity[], name: string): CategoryEntity | undefined {
  return categories.find((category) => category.name === name);
}

function inferCategoryFromDomain(tab: TabEntity): string | null {
  const domain = tab.domain.toLowerCase();

  if (["docs.google.com", "notion.so", "www.notion.so", "jira", "figma.com", "slack.com"].some((keyword) => domain.includes(keyword))) {
    return "工作";
  }

  if (["mdn", "wikipedia.org", "coursera.org", "udemy.com", "edx.org"].some((keyword) => domain.includes(keyword))) {
    return "学习";
  }

  if (["youtube.com", "bilibili.com", "netflix.com", "spotify.com"].some((keyword) => domain.includes(keyword))) {
    return "娱乐";
  }

  if (["amazon.", "taobao.com", "jd.com", "ebay.com"].some((keyword) => domain.includes(keyword))) {
    return "购物";
  }

  return null;
}

function inferCategoryName(tab: TabEntity): string {
  const domainMatch = inferCategoryFromDomain(tab);

  if (domainMatch) {
    return domainMatch;
  }

  const source = `${tab.title} ${tab.url} ${tab.domain}`.toLowerCase();
  const keywordMatch = matchCategoryByKeyword(source);

  if (keywordMatch === "work") {
    return "工作";
  }

  if (keywordMatch === "study") {
    return "学习";
  }

  if (keywordMatch === "entertainment") {
    return "娱乐";
  }

  if (keywordMatch === "shopping") {
    return "购物";
  }

  return "待整理";
}

export function classifyTabs(tabs: TabEntity[], categories: CategoryEntity[]): TabEntity[] {
  return tabs.map((tab) => {
    if (tab.classificationMode === "manual" && tab.categoryId) {
      return tab;
    }

    const targetName = inferCategoryName(tab);
    const matchedCategory = findCategoryByName(categories, targetName);

    return {
      ...tab,
      categoryId: matchedCategory?.categoryId ?? tab.categoryId,
      classificationMode: "auto"
    };
  });
}
