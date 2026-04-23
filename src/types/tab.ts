export type TabStatus = "open" | "closed" | "saved";
export type ClassificationMode = "auto" | "manual";

export type TabEntity = {
  tabId: number;
  windowId: number;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  active: boolean;
  pinned: boolean;
  categoryId?: string;
  customTitle?: string;
  note?: string;
  classificationMode?: ClassificationMode;
  status: TabStatus;
  createdAt: number;
  updatedAt: number;
};

export type StoredTabMeta = Pick<
  TabEntity,
  "categoryId" | "customTitle" | "note" | "classificationMode" | "updatedAt"
>;

export type RecentlyClosedTab = {
  id: string;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  categoryId?: string;
  customTitle?: string;
  note?: string;
  classificationMode?: ClassificationMode;
  closedAt: number;
};
