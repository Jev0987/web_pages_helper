import type { TabEntity } from "../../types/tab";
import type { CategoryEntity } from "../../types/category";

type TabItemProps = {
  tab: TabEntity;
  selected?: boolean;
  onSelect?: (tabId: number) => void;
  onActivate: (tabId: number) => void;
  onClose: (tabId: number) => void;
  onEdit?: (tabId: number) => void;
  categories?: CategoryEntity[];
  onChangeCategory?: (tabId: number, categoryId?: string) => void;
};

export function TabItem({
  tab,
  selected,
  onSelect,
  onActivate,
  onClose,
  onEdit,
  categories,
  onChangeCategory
}: TabItemProps) {
  return (
    <div
      className="panel"
      style={{
        padding: 12,
        display: "grid",
        gridTemplateColumns: onSelect ? "24px minmax(0, 1fr) auto" : "minmax(0, 1fr) auto",
        gap: 12,
        alignItems: "center"
      }}
    >
      {onSelect ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(tab.tabId)}
          aria-label={`select-${tab.tabId}`}
        />
      ) : null}
      <button
        style={{ all: "unset", cursor: "pointer" }}
        onClick={() => onActivate(tab.tabId)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tab.favicon ? (
            <img src={tab.favicon} alt="" width={16} height={16} />
          ) : (
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "var(--line)" }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {tab.customTitle || tab.title}
            </div>
            <div
              className="muted"
              style={{
                fontSize: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {tab.domain}
            </div>
          </div>
        </div>
      </button>
      <div style={{ display: "flex", gap: 8 }}>
        {categories && onChangeCategory ? (
          <select
            className="field"
            style={{ width: 130, padding: "8px 10px" }}
            value={tab.categoryId ?? ""}
            onChange={(event) => onChangeCategory(tab.tabId, event.target.value || undefined)}
          >
            <option value="">未分类</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        ) : null}
        {onEdit ? (
          <button className="button-secondary" onClick={() => onEdit(tab.tabId)}>
            编辑
          </button>
        ) : null}
        <button className="button-secondary" onClick={() => onClose(tab.tabId)}>
          关闭
        </button>
      </div>
    </div>
  );
}
