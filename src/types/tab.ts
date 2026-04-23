export type TabStatus = "open" | "closed" | "saved";

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
  classificationMode?: "auto" | "manual";
  status: TabStatus;
  createdAt: number;
  updatedAt: number;
};

export type StoredTabMeta = Pick<
  TabEntity,
  "categoryId" | "customTitle" | "note" | "classificationMode" | "updatedAt"
>;
