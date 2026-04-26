import type { CategoryEntity } from "../types/category";
import type { RecentlyClosedTab, StoredTabMeta } from "../types/tab";

type StorageSchema = {
  categories: CategoryEntity[];
  tabsMeta: Record<string, StoredTabMeta>;
  recentlyClosed: RecentlyClosedTab[];
  preferences: {
    defaultView: "list" | "group";
    autoClassifyOnOpen: boolean;
    confirmBeforeBulkClose: boolean;
    showCurrentWindowOnly: boolean;
  };
};

const STORAGE_KEYS = {
  categories: "categories",
  tabsMeta: "tabsMeta",
  recentlyClosed: "recentlyClosed",
  preferences: "preferences"
} as const;

const defaultCategories: CategoryEntity[] = [
  createCategory("待整理", "system", "#8d99a7", 0),
  createCategory("工作", "system", "#d35d3f", 1),
  createCategory("学习", "system", "#2e6b4f", 2),
  createCategory("娱乐", "system", "#5f4b8b", 3),
  createCategory("购物", "system", "#c28b2c", 4)
];

function createCategory(
  name: string,
  sourceType: CategoryEntity["sourceType"],
  color: string,
  sortOrder: number
): CategoryEntity {
  const now = Date.now();
  return {
    categoryId: name.toLowerCase(),
    name,
    color,
    sourceType,
    sortOrder,
    createdAt: now,
    updatedAt: now
  };
}

export async function getCategories(): Promise<CategoryEntity[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.categories);
  const categories = result[STORAGE_KEYS.categories] as CategoryEntity[] | undefined;

  if (!categories || categories.length === 0) {
    await chrome.storage.local.set({ [STORAGE_KEYS.categories]: defaultCategories });
    return defaultCategories;
  }

  return [...categories].sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function saveCategories(categories: CategoryEntity[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.categories]: categories });
}

export async function getTabsMeta(): Promise<Record<string, StoredTabMeta>> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.tabsMeta);
  return (result[STORAGE_KEYS.tabsMeta] as Record<string, StoredTabMeta> | undefined) ?? {};
}

export async function updateTabMeta(tabId: number, payload: Partial<StoredTabMeta>): Promise<void> {
  const current = await getTabsMeta();
  current[String(tabId)] = {
    ...current[String(tabId)],
    ...payload,
    updatedAt: Date.now()
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.tabsMeta]: current });
}

export async function updateManyTabsMeta(
  tabIds: number[],
  payload: Partial<StoredTabMeta>
): Promise<void> {
  if (tabIds.length === 0) {
    return;
  }

  const current = await getTabsMeta();
  const now = Date.now();

  for (const tabId of tabIds) {
    current[String(tabId)] = {
      ...current[String(tabId)],
      ...payload,
      updatedAt: now
    };
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.tabsMeta]: current });
}

export async function setTabsMeta(next: Record<string, StoredTabMeta>): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.tabsMeta]: next });
}

export async function removeTabMeta(tabId: number): Promise<void> {
  const current = await getTabsMeta();
  delete current[String(tabId)];
  await chrome.storage.local.set({ [STORAGE_KEYS.tabsMeta]: current });
}

export async function getRecentlyClosed(): Promise<RecentlyClosedTab[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.recentlyClosed);
  return (result[STORAGE_KEYS.recentlyClosed] as RecentlyClosedTab[] | undefined) ?? [];
}

export async function saveRecentlyClosed(tabs: RecentlyClosedTab[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.recentlyClosed]: tabs });
}

export async function addRecentlyClosed(tab: RecentlyClosedTab): Promise<void> {
  const current = await getRecentlyClosed();
  const next = [tab, ...current].slice(0, 20);
  await saveRecentlyClosed(next);
}

export async function removeRecentlyClosed(id: string): Promise<void> {
  const current = await getRecentlyClosed();
  await saveRecentlyClosed(current.filter((tab) => tab.id !== id));
}

export async function clearRecentlyClosed(): Promise<void> {
  await saveRecentlyClosed([]);
}

export async function getPreferences(): Promise<StorageSchema["preferences"]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.preferences);
  return (
    (result[STORAGE_KEYS.preferences] as StorageSchema["preferences"] | undefined) ?? {
      defaultView: "list",
      autoClassifyOnOpen: true,
      confirmBeforeBulkClose: true,
      showCurrentWindowOnly: true
    }
  );
}
