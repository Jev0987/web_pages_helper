import { create } from "zustand";
import type { CategoryEntity } from "../types/category";

type CategoryStore = {
  categories: CategoryEntity[];
  activeCategoryId: string | "all";
  setCategories: (categories: CategoryEntity[]) => void;
  setActiveCategoryId: (id: string | "all") => void;
};

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  activeCategoryId: "all",
  setCategories: (categories) => set({ categories }),
  setActiveCategoryId: (id) => set({ activeCategoryId: id })
}));
