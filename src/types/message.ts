import type { CategoryEntity } from "./category";
import type { TabEntity } from "./tab";

export type RuntimeMessage =
  | { type: "GET_TABS"; scope: "currentWindow" | "allWindows" }
  | { type: "GET_CATEGORIES" }
  | { type: "ACTIVATE_TAB"; tabId: number }
  | { type: "CLOSE_TAB"; tabId: number }
  | { type: "CLOSE_TABS"; tabIds: number[] }
  | { type: "MOVE_TABS_TO_CATEGORY"; tabIds: number[]; categoryId?: string }
  | { type: "RECLASSIFY_TABS"; scope: "currentWindow" | "allWindows" }
  | { type: "UPSERT_CATEGORY"; payload: CategoryEntity }
  | { type: "DELETE_CATEGORY"; categoryId: string }
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
  data?: TabEntity[] | CategoryEntity[] | null;
  error?: string;
};
