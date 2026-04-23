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
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: (tabId: number) => void;
  onDragEnd?: () => void;
};

export function TabItem({
  tab,
  selected,
  onSelect,
  onActivate,
  onClose,
  onEdit,
  categories,
  onChangeCategory,
  draggable,
  dragging,
  onDragStart,
  onDragEnd
}: TabItemProps) {
  return (
    <div
      className={`panel tab-card${dragging ? " is-dragging" : ""}`}
      draggable={draggable}
      onDragStart={() => onDragStart?.(tab.tabId)}
      onDragEnd={() => onDragEnd?.()}
    >
      <div className="tab-card-header">
        {onSelect ? (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(tab.tabId)}
            aria-label={`select-${tab.tabId}`}
          />
        ) : null}
        <button onClick={() => onActivate(tab.tabId)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {tab.favicon ? (
              <img src={tab.favicon} alt="" width={18} height={18} />
            ) : (
              <div style={{ width: 18, height: 18, borderRadius: 4, background: "var(--line)" }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div className="tab-card-title">{tab.customTitle || tab.title}</div>
              <div className="tab-card-domain">{tab.domain}</div>
            </div>
          </div>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="chip">{tab.status === "open" ? "打开中" : tab.status}</span>
        {tab.categoryId ? <span className="chip">已分类</span> : <span className="chip">未分类</span>}
        {tab.note ? <span className="chip">有备注</span> : null}
      </div>

      <div className="tab-card-preview">
        <div className="tab-card-preview-bar">
          <span className="tab-card-preview-dot" />
          <span className="tab-card-preview-dot" />
          <span className="tab-card-preview-dot" />
          <span className="tab-card-preview-url">{tab.domain}</span>
        </div>
        <div className="tab-card-preview-body">
          <div className="tab-card-preview-title">{tab.customTitle || tab.title}</div>
          <div className="tab-card-preview-line" style={{ width: "88%" }} />
          <div className="tab-card-preview-line" style={{ width: "72%" }} />
          <div className="tab-card-preview-line" style={{ width: "56%" }} />
        </div>
      </div>

      <div className="tab-card-note">{tab.note || "暂无备注。你可以在右侧详情面板里补充用途说明。"}</div>

      <div className="tab-card-actions">
        {categories && onChangeCategory ? (
          <select
            className="field"
            style={{ padding: "8px 10px" }}
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

        <div className="tab-card-actions-row">
          {onEdit ? (
            <button className="button-secondary" style={{ flex: 1 }} onClick={() => onEdit(tab.tabId)}>
              编辑
            </button>
          ) : null}
          <button className="button-secondary" style={{ flex: 1 }} onClick={() => onClose(tab.tabId)}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
