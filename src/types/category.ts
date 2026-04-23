export type CategorySourceType = "auto" | "manual" | "system";
export type CategoryRuleType = "domain" | "keyword" | "semantic";

export type CategoryEntity = {
  categoryId: string;
  name: string;
  color?: string;
  sourceType: CategorySourceType;
  ruleType?: CategoryRuleType;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};
