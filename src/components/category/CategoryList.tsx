import type { CategoryEntity } from "../../types/category";

type CategoryListProps = {
  categories: CategoryEntity[];
  activeCategoryId: string | "all";
  onSelect: (id: string | "all") => void;
  onDelete?: (id: string) => void;
  onEdit?: (category: CategoryEntity) => void;
  onMove?: (categoryId: string, direction: "up" | "down") => void;
};

export function CategoryList({
  categories,
  activeCategoryId,
  onSelect,
  onDelete,
  onEdit,
  onMove
}: CategoryListProps) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        className="button-secondary"
        style={{
          textAlign: "left",
          background: activeCategoryId === "all" ? "var(--accent-soft)" : undefined
        }}
        onClick={() => onSelect("all")}
      >
        全部标签页
      </button>
      {categories
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((category, index, sortedCategories) => (
        <div
          key={category.categoryId}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 8,
            alignItems: "center"
          }}
        >
          <button
            className="button-secondary"
            style={{
              textAlign: "left",
              background:
                activeCategoryId === category.categoryId ? "var(--accent-soft)" : undefined,
              borderLeft: `4px solid ${category.color ?? "#ccc"}`
            }}
            onClick={() => onSelect(category.categoryId)}
          >
            {category.name}
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            {onMove ? (
              <>
                <button
                  className="button-secondary"
                  onClick={() => onMove(category.categoryId, "up")}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  className="button-secondary"
                  onClick={() => onMove(category.categoryId, "down")}
                  disabled={index === sortedCategories.length - 1}
                >
                  ↓
                </button>
              </>
            ) : null}
            {onEdit && category.sourceType === "manual" ? (
              <button className="button-secondary" onClick={() => onEdit(category)}>
                改名
              </button>
            ) : null}
            {onDelete && category.sourceType === "manual" ? (
              <button className="button-secondary" onClick={() => onDelete(category.categoryId)}>
                删除
              </button>
            ) : null}
          </div>
        </div>
        ))}
    </div>
  );
}
