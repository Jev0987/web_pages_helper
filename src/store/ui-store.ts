import { create } from "zustand";

type UiStore = {
  loading: boolean;
  editingTabId: number | null;
  setLoading: (loading: boolean) => void;
  setEditingTabId: (tabId: number | null) => void;
};

export const useUiStore = create<UiStore>((set) => ({
  loading: false,
  editingTabId: null,
  setLoading: (loading) => set({ loading }),
  setEditingTabId: (tabId) => set({ editingTabId: tabId })
}));
