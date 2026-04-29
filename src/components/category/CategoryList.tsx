import type { CategoryEntity } from "../../types/category";

type CategoryListProps = {
  categories: CategoryEntity[];
  activeCategoryId: string | "all";
  onSelect: (id: string | "all") => void;
  onDelete?: (id: string) => void;
  onEdit?: (category: CategoryEntity) => void;
  onReorder?: (draggedCategoryId: string, targetCategoryId: string) => void;
};

export function CategoryList({
  categories,
  activeCategoryId,
  onSelect,
  onDelete,
  onEdit
}: CategoryListProps) {
  const sortedCategories = categories
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const activeCategory =
    activeCategoryId === "all"
      ? null
      : categories.find((category) => category.categoryId === activeCategoryId) ?? null;

  return (
    <div className="category-picker">
      <select
        className="field category-select"
        value={activeCategoryId}
        onChange={(event) => onSelect(event.target.value)}
      >
        <option value="all">全部标签页</option>
        {sortedCategories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.name}
          </option>
        ))}
      </select>

      {activeCategory ? (
        <div className="category-picker-current">
          <span
            className="category-color-dot"
            style={{ background: activeCategory.color ?? "var(--line)" }}
          />
          <span>{activeCategory.name}</span>
          {onEdit && activeCategory.sourceType === "manual" ? (
            <button className="button-secondary" onClick={() => onEdit(activeCategory)}>
              改名
            </button>
          ) : null}
          {onDelete && activeCategory.sourceType === "manual" ? (
            <button className="button-secondary" onClick={() => onDelete(activeCategory.categoryId)}>
              删除
            </button>
          ) : null}
        </div>
      ) : (
        <div className="category-picker-current">
          <span className="category-color-dot" style={{ background: "var(--accent)" }} />
          <span>全部分类</span>
        </div>
      )}
    </div>
  );
}
