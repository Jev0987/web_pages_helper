import type { CategoryEntity } from "./category";
import type { RecentlyClosedTab, TabEntity } from "./tab";

export type RuntimeMessage =
  | { type: "GET_TABS"; scope: "currentWindow" | "allWindows" }
  | { type: "GET_CATEGORIES" }
  | { type: "GET_RECENTLY_CLOSED" }
  | { type: "ACTIVATE_TAB"; tabId: number }
  | { type: "CLOSE_TAB"; tabId: number }
  | { type: "CLOSE_TABS"; tabIds: number[] }
  | { type: "RESTORE_CLOSED_TAB"; id: string }
  | { type: "MOVE_TABS_TO_CATEGORY"; tabIds: number[]; categoryId?: string }
  | { type: "RECLASSIFY_TABS"; scope: "currentWindow" | "allWindows" }
  | { type: "UPSERT_CATEGORY"; payload: CategoryEntity }
  | { type: "DELETE_CATEGORY"; categoryId: string }
  | { type: "REORDER_CATEGORY"; categoryId: string; direction: "up" | "down" }
  | {
      type: "UPDATE_TAB_META";
      tabId: number;
      payload: {
        customTitle?: string;
        note?: string;
        categoryId?: string;
        classificationMode?: "auto" | "manual";
      };
    };

export type RuntimeResponse = {
  ok: boolean;
  data?: TabEntity[] | CategoryEntity[] | RecentlyClosedTab[] | null;
  error?: string;
};
