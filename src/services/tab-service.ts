import type { TabEntity } from "../types/tab";
import { safeParseDomain } from "../utils/url";
import { getTabsMeta } from "./storage-service";

function mapChromeTab(tab: chrome.tabs.Tab, meta?: Partial<TabEntity>): TabEntity {
  const now = Date.now();
  return {
    tabId: tab.id ?? -1,
    windowId: tab.windowId ?? -1,
    title: tab.title ?? "Untitled Tab",
    url: tab.url ?? "",
    domain: safeParseDomain(tab.url ?? ""),
    favicon: tab.favIconUrl,
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    categoryId: meta?.categoryId,
    customTitle: meta?.customTitle,
    note: meta?.note,
    classificationMode: meta?.classificationMode,
    status: "open",
    createdAt: now,
    updatedAt: meta?.updatedAt ?? now
  };
}

export async function getTabs(scope: "currentWindow" | "allWindows"): Promise<TabEntity[]> {
  const metaMap = await getTabsMeta();
  const queryInfo = scope === "currentWindow" ? { currentWindow: true } : {};
  const tabs = await chrome.tabs.query(queryInfo);

  return tabs
    .filter((tab) => typeof tab.id === "number")
    .map((tab) => mapChromeTab(tab, metaMap[String(tab.id)]));
}

export async function activateTab(tabId: number): Promise<void> {
  const tab = await chrome.tabs.get(tabId);

  if (typeof tab.windowId === "number") {
    await chrome.windows.update(tab.windowId, { focused: true });
  }

  await chrome.tabs.update(tabId, { active: true });
}

export async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId);
}

export async function closeTabs(tabIds: number[]): Promise<void> {
  if (tabIds.length === 0) {
    return;
  }

  await chrome.tabs.remove(tabIds);
}
