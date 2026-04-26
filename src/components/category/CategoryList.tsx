import { useState } from "react";
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
  onEdit,
  onReorder
}: CategoryListProps) {
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);

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
        .map((category) => (
        <div
          key={category.categoryId}
          className={`category-row${dragOverCategoryId === category.categoryId ? " is-drop-target" : ""}${draggingCategoryId === category.categoryId ? " is-dragging" : ""}`}
          draggable={Boolean(onReorder)}
          onDragStart={(event) => {
            if (!onReorder) {
              return;
            }
            event.dataTransfer.setData("text/category-id", category.categoryId);
            event.dataTransfer.effectAllowed = "move";
            setDraggingCategoryId(category.categoryId);
          }}
          onDragOver={(event) => {
            if (!onReorder) {
              return;
            }
            event.preventDefault();
            setDragOverCategoryId(category.categoryId);
          }}
          onDragLeave={() => {
            setDragOverCategoryId((current: string | null) =>
              current === category.categoryId ? null : current
            );
          }}
          onDrop={(event) => {
            if (!onReorder) {
              return;
            }
            event.preventDefault();
            setDragOverCategoryId(null);
            const draggedCategoryId = event.dataTransfer.getData("text/category-id");
            if (draggedCategoryId && draggedCategoryId !== category.categoryId) {
              onReorder(draggedCategoryId, category.categoryId);
            }
          }}
          onDragEnd={() => {
            setDraggingCategoryId(null);
            setDragOverCategoryId(null);
          }}
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
