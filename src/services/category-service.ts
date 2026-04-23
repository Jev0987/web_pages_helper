import type { CategoryEntity } from "../types/category";
import type { StoredTabMeta } from "../types/tab";
import { getCategories, getTabsMeta, saveCategories, setTabsMeta } from "./storage-service";

export function validateCategoryName(
  categories: CategoryEntity[],
  nextCategory: CategoryEntity
): string {
  const normalizedName = nextCategory.name.trim();

  if (!normalizedName) {
    throw new Error("分类名称不能为空");
  }

  if (normalizedName.length > 20) {
    throw new Error("分类名称不能超过 20 个字符");
  }

  const duplicateName = categories.some(
    (item) =>
      item.categoryId !== nextCategory.categoryId &&
      item.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );

  if (duplicateName) {
    throw new Error("分类名称不能重复");
  }

  return normalizedName;
}

export function clearCategoryFromTabsMeta(
  tabsMeta: Record<string, StoredTabMeta>,
  categoryId: string
): Record<string, StoredTabMeta> {
  return Object.fromEntries(
    Object.entries(tabsMeta).map(([tabId, meta]) => {
      if (meta.categoryId !== categoryId) {
        return [tabId, meta];
      }

      return [
        tabId,
        {
          ...meta,
          categoryId: undefined,
          classificationMode: "auto",
          updatedAt: Date.now()
        }
      ];
    })
  );
}

export async function upsertCategory(nextCategory: CategoryEntity): Promise<CategoryEntity[]> {
  const categories = await getCategories();
  const normalizedName = validateCategoryName(categories, nextCategory);

  const exists = categories.some((item) => item.categoryId === nextCategory.categoryId);

  const normalizedCategory: CategoryEntity = {
    ...nextCategory,
    name: normalizedName,
    updatedAt: Date.now()
  };

  const next = exists
    ? categories.map((item) =>
        item.categoryId === normalizedCategory.categoryId ? normalizedCategory : item
      )
    : [...categories, normalizedCategory];

  await saveCategories(next);
  return next;
}

export async function deleteCategory(categoryId: string): Promise<CategoryEntity[]> {
  const categories = await getCategories();
  const target = categories.find((item) => item.categoryId === categoryId);

  if (!target) {
    return categories;
  }

  if (target.sourceType === "system") {
    throw new Error("系统分类不允许删除");
  }

  const nextCategories = categories.filter((item) => item.categoryId !== categoryId);
  const nextTabsMeta = clearCategoryFromTabsMeta(await getTabsMeta(), categoryId);

  await Promise.all([saveCategories(nextCategories), setTabsMeta(nextTabsMeta)]);
  return nextCategories;
}
