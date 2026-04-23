import type { CategoryEntity } from "../../types/category";

type CategoryListProps = {
  categories: CategoryEntity[];
  activeCategoryId: string | "all";
  onSelect: (id: string | "all") => void;
  onDelete?: (id: string) => void;
};

export function CategoryList({ categories, activeCategoryId, onSelect, onDelete }: CategoryListProps) {
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
      {categories.map((category) => (
        <div
          key={category.categoryId}
          style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}
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
          {onDelete && category.sourceType === "manual" ? (
            <button className="button-secondary" onClick={() => onDelete(category.categoryId)}>
              删除
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
