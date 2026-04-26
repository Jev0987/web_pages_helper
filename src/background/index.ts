import { classifyTabs } from "../services/classification-service";
import {
  deleteCategory,
  moveCategory,
  reorderCategory,
  upsertCategory
} from "../services/category-service";
import {
  activateTab,
  buildRecentlyClosedTab,
  closeTab,
  closeTabs,
  getTabs,
  restoreClosedTab
} from "../services/tab-service";
import {
  addRecentlyClosed,
  clearRecentlyClosed,
  getCategories,
  getPreferences,
  getRecentlyClosed,
  getTabsMeta,
  removeRecentlyClosed,
  removeTabMeta,
  setTabsMeta,
  updateManyTabsMeta,
  updateTabMeta
} from "../services/storage-service";
import type { RuntimeMessage, RuntimeResponse } from "../types/message";

async function collectClassifiedTabs(scope: "currentWindow" | "allWindows") {
  const [tabs, categories] = await Promise.all([getTabs(scope), getCategories()]);
  return classifyTabs(tabs, categories);
}

async function persistClassification(
  tabs: Awaited<ReturnType<typeof collectClassifiedTabs>>
): Promise<void> {
  const metaMap = await getTabsMeta();

  for (const tab of tabs) {
    metaMap[String(tab.tabId)] = {
      ...metaMap[String(tab.tabId)],
      categoryId: tab.categoryId,
      classificationMode: tab.classificationMode,
      updatedAt: Date.now()
    };
  }

  await setTabsMeta(metaMap);
}

chrome.runtime.onInstalled.addListener(() => {
  void getCategories();
  void getPreferences();
});

chrome.tabs.onCreated.addListener((tab) => {
  if (typeof tab.id !== "number") {
    return;
  }

  const tabId = tab.id;

  void (async () => {
    const [categories, tabs] = await Promise.all([getCategories(), getTabs("allWindows")]);
    const target = tabs.find((item) => item.tabId === tabId);
    if (!target) {
      return;
    }
    const [classified] = classifyTabs([target], categories);
    await updateTabMeta(tabId, {
      categoryId: classified.categoryId,
      classificationMode: classified.classificationMode
    });
  })();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeTabMeta(tabId);
});

async function snapshotTabsForClose(tabIds: number[]): Promise<void> {
  const metaMap = await getTabsMeta();
  const snapshots = await Promise.all(
    tabIds.map(async (tabId) => {
      try {
        const tab = await chrome.tabs.get(tabId);
        return buildRecentlyClosedTab(tab, metaMap[String(tabId)]);
      } catch {
        return null;
      }
    })
  );

  await Promise.all(
    snapshots.filter((tab): tab is NonNullable<typeof tab> => Boolean(tab)).map(addRecentlyClosed)
  );
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  void (async () => {
    try {
      let response: RuntimeResponse = { ok: true, data: null };

      switch (message.type) {
        case "GET_TABS": {
          const tabs = await collectClassifiedTabs(message.scope);
          response = { ok: true, data: tabs };
          break;
        }
        case "GET_CATEGORIES": {
          response = { ok: true, data: await getCategories() };
          break;
        }
        case "GET_RECENTLY_CLOSED": {
          response = { ok: true, data: await getRecentlyClosed() };
          break;
        }
        case "CLEAR_RECENTLY_CLOSED": {
          await clearRecentlyClosed();
          response = { ok: true, data: [] };
          break;
        }
        case "ACTIVATE_TAB": {
          await activateTab(message.tabId);
          response = { ok: true, data: null };
          break;
        }
        case "CLOSE_TAB": {
          await snapshotTabsForClose([message.tabId]);
          await closeTab(message.tabId);
          response = { ok: true, data: null };
          break;
        }
        case "CLOSE_TABS": {
          await snapshotTabsForClose(message.tabIds);
          await closeTabs(message.tabIds);
          response = { ok: true, data: null };
          break;
        }
        case "RESTORE_CLOSED_TAB": {
          const recentTabs = await getRecentlyClosed();
          const target = recentTabs.find((tab) => tab.id === message.id);
          if (!target) {
            response = { ok: false, error: "未找到可恢复的标签页" };
            break;
          }

          const tabId = await restoreClosedTab(target);
          if (tabId >= 0) {
            await updateTabMeta(tabId, {
              categoryId: target.categoryId,
              customTitle: target.customTitle,
              note: target.note,
              classificationMode: target.classificationMode
            });
          }
          await removeRecentlyClosed(message.id);
          response = { ok: true, data: await getRecentlyClosed() };
          break;
        }
        case "MOVE_TABS_TO_CATEGORY": {
          await updateManyTabsMeta(message.tabIds, {
            categoryId: message.categoryId,
            classificationMode: "manual"
          });
          response = { ok: true, data: null };
          break;
        }
        case "RECLASSIFY_TABS": {
          const tabs = await collectClassifiedTabs(message.scope);
          await persistClassification(tabs);
          response = { ok: true, data: tabs };
          break;
        }
        case "UPSERT_CATEGORY": {
          const categories = await upsertCategory(message.payload);
          response = { ok: true, data: categories };
          break;
        }
        case "DELETE_CATEGORY": {
          const categories = await deleteCategory(message.categoryId);
          response = { ok: true, data: categories };
          break;
        }
        case "MOVE_CATEGORY": {
          const categories = await moveCategory(
            message.draggedCategoryId,
            message.targetCategoryId
          );
          response = { ok: true, data: categories };
          break;
        }
        case "REORDER_CATEGORY": {
          const categories = await reorderCategory(message.categoryId, message.direction);
          response = { ok: true, data: categories };
          break;
        }
        case "UPDATE_TAB_META": {
          await updateTabMeta(message.tabId, message.payload);
          response = { ok: true, data: null };
          break;
        }
        default: {
          response = { ok: false, error: "Unsupported message type" };
        }
      }

      sendResponse(response);
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  })();

  return true;
});
