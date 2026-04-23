import { create } from "zustand";
import type { TabEntity } from "../types/tab";

type TabStore = {
  tabs: TabEntity[];
  selectedTabIds: number[];
  search: string;
  setTabs: (tabs: TabEntity[]) => void;
  toggleSelectedTab: (tabId: number) => void;
  clearSelection: () => void;
  setSearch: (search: string) => void;
};

export const useTabStore = create<TabStore>((set) => ({
  tabs: [],
  selectedTabIds: [],
  search: "",
  setTabs: (tabs) => set({ tabs }),
  toggleSelectedTab: (tabId) =>
    set((state) => ({
      selectedTabIds: state.selectedTabIds.includes(tabId)
        ? state.selectedTabIds.filter((id) => id !== tabId)
        : [...state.selectedTabIds, tabId]
    })),
  clearSelection: () => set({ selectedTabIds: [] }),
  setSearch: (search) => set({ search })
}));
