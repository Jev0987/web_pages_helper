import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { CategoryEntity } from "../../types/category";
import type { TabEntity } from "../../types/tab";

type TabItemProps = {
  tab: TabEntity;
  selected?: boolean;
  onSelect?: (tabId: number) => void;
  onActivate: (tabId: number) => void;
  onClose: (tabId: number) => void;
  categories?: CategoryEntity[];
  onChangeCategory?: (tabId: number, categoryId?: string) => void;
  draggable?: boolean;
  dragging?: boolean;
  closing?: boolean;
  onDragStart?: (tabId: number) => void;
  onDragEnd?: () => void;
};

export function TabItem({
  tab,
  selected,
  onSelect,
  onActivate,
  onClose,
  categories,
  onChangeCategory,
  draggable,
  dragging,
  closing,
  onDragStart,
  onDragEnd
}: TabItemProps) {
  const title = tab.customTitle || tab.title;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardSize, setCardSize] = useState({ width: 230, height: 122 });

  useLayoutEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    const measure = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setCardSize({
          width: rect.width,
          height: rect.height
        });
      }
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const shardProfiles = [
    { dx: -0.52, dy: -0.44, rotate: -28, scale: 0.68, gravity: -6, delay: "0ms", sx: 18, sy: 10, sr: -4 },
    { dx: 0.56, dy: -0.42, rotate: 30, scale: 0.7, gravity: -4, delay: "18ms", sx: -20, sy: 8, sr: 5 },
    { dx: -0.58, dy: 0.18, rotate: -34, scale: 0.62, gravity: 16, delay: "30ms", sx: 16, sy: -14, sr: -5 },
    { dx: 0.62, dy: 0.16, rotate: 32, scale: 0.64, gravity: 18, delay: "42ms", sx: -18, sy: -12, sr: 4 },
    { dx: -0.36, dy: 0.94, rotate: -20, scale: 0.5, gravity: 54, delay: "56ms", sx: 12, sy: -28, sr: -3 },
    { dx: 0.38, dy: 0.98, rotate: 22, scale: 0.52, gravity: 58, delay: "68ms", sx: -14, sy: -30, sr: 3 }
  ];

  return (
    <div
      ref={cardRef}
      className={`panel tab-card${dragging ? " is-dragging" : ""}${closing ? " is-closing" : ""}`}
      draggable={draggable}
      onDragStart={() => onDragStart?.(tab.tabId)}
      onDragEnd={() => onDragEnd?.()}
    >
      <div className="tab-card-content">
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
            <div style={{ minWidth: 0 }}>
              <div className="tab-card-title">{title}</div>
              <div className="tab-card-domain">{tab.domain}</div>
            </div>
          </button>
          <button
            className="tab-card-close"
            aria-label="关闭标签页"
            title="关闭标签页"
            onClick={() => onClose(tab.tabId)}
          >
            ✕
          </button>
        </div>

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
        </div>
      </div>

      <div className="tab-card-shatter" aria-hidden="true">
        <div className="tab-card-cracks">
          <span />
          <span />
          <span />
        </div>
        {shardProfiles.map((profile, index) => (
          <div
            key={index}
            className={`tab-card-shard tab-card-shard-${index + 1}`}
            style={
              {
                "--shard-x": `${Math.round(cardSize.width * profile.dx)}px`,
                "--shard-y": `${Math.round(cardSize.height * profile.dy)}px`,
                "--shard-rotate": `${profile.rotate}deg`,
                "--shard-scale": profile.scale,
                "--shard-gravity": `${profile.gravity}px`,
                "--shard-delay": profile.delay,
                "--surface-shift-x": `${profile.sx}px`,
                "--surface-shift-y": `${profile.sy}px`,
                "--surface-rotate": `${profile.sr}deg`
              } as CSSProperties
            }
          >
            <div className="tab-card-shard-surface">
              <div className="tab-card-shard-title">{title}</div>
              <div className="tab-card-shard-domain">{tab.domain}</div>
              <div className="tab-card-shard-bar" />
            </div>
          </div>
        ))}
      </div>

      <div className="tab-card-burst" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
