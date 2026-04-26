import { useEffect, useMemo, useState } from "react";
import { CategoryList } from "../components/category/CategoryList";
import { SectionTitle } from "../components/common/SectionTitle";
import { TabItem } from "../components/tabs/TabItem";
import { useCategoryStore } from "../store/category-store";
import { useTabStore } from "../store/tab-store";
import type { CategoryEntity } from "../types/category";
import type { RuntimeMessage, RuntimeResponse } from "../types/message";
import type { RecentlyClosedTab, TabEntity } from "../types/tab";

async function sendMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  return chrome.runtime.sendMessage(message);
}

function toTabs(data: RuntimeResponse["data"]): TabEntity[] {
  return (data ?? []) as TabEntity[];
}

function toCategories(data: RuntimeResponse["data"]): CategoryEntity[] {
  return (data ?? []) as CategoryEntity[];
}

function toRecentlyClosed(data: RuntimeResponse["data"]): RecentlyClosedTab[] {
  return (data ?? []) as RecentlyClosedTab[];
}

function createManualCategory(name: string, sortOrder: number): CategoryEntity {
  const now = Date.now();
  const normalizedName = name.trim();
  return {
    categoryId: `manual-${normalizedName}-${now}`,
    name: normalizedName,
    color: "#4e6a8a",
    sourceType: "manual",
    sortOrder,
    createdAt: now,
    updatedAt: now
  };
}

export function ManagerApp() {
  const { tabs, setTabs, selectedTabIds, toggleSelectedTab, clearSelection, search, setSearch } =
    useTabStore();
  const { categories, setCategories, activeCategoryId, setActiveCategoryId } = useCategoryStore();
  const [loading, setLoading] = useState(false);
  const [draftCategoryName, setDraftCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryEntity | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [recentlyClosed, setRecentlyClosed] = useState<RecentlyClosedTab[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "board">("grid");
  const [boardSort, setBoardSort] = useState<"category" | "count">("category");
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  const [draggingTabId, setDraggingTabId] = useState<number | null>(null);
  const [dropCategoryId, setDropCategoryId] = useState<string | null>(null);
  const [closingTabIds, setClosingTabIds] = useState<number[]>([]);
  const activeCategoryName =
    activeCategoryId === "all"
      ? "全部标签页"
      : categories.find((category) => category.categoryId === activeCategoryId)?.name ?? "筛选结果";

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);

      const [tabsResponse, categoriesResponse, recentResponse] = await Promise.all([
        sendMessage({ type: "GET_TABS", scope: "allWindows" }),
        sendMessage({ type: "GET_CATEGORIES" }),
        sendMessage({ type: "GET_RECENTLY_CLOSED" })
      ]);

      if (tabsResponse.ok && Array.isArray(tabsResponse.data)) {
        setTabs(toTabs(tabsResponse.data));
      }

      if (categoriesResponse.ok && Array.isArray(categoriesResponse.data)) {
        setCategories(toCategories(categoriesResponse.data));
      }

      if (recentResponse.ok && Array.isArray(recentResponse.data)) {
        setRecentlyClosed(toRecentlyClosed(recentResponse.data));
      }

      setLoading(false);
    }

    void bootstrap();
  }, [setCategories, setLoading, setTabs]);

  const filteredTabs = useMemo(() => {
    return tabs.filter((tab) => {
      const matchCategory = activeCategoryId === "all" || tab.categoryId === activeCategoryId;
      const source = `${tab.customTitle ?? ""} ${tab.title} ${tab.url} ${tab.note ?? ""}`.toLowerCase();
      const matchSearch = source.includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategoryId, search, tabs]);

  const boardColumns = useMemo(() => {
    const sortedCategories = categories
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder);

    const groups =
      activeCategoryId === "all"
        ? [
            {
              categoryId: "uncategorized",
              name: "未分类",
              tabs: filteredTabs.filter((tab) => !tab.categoryId)
            },
            ...sortedCategories.map((category) => ({
              categoryId: category.categoryId,
              name: category.name,
              tabs: filteredTabs.filter((tab) => tab.categoryId === category.categoryId)
            }))
          ]
        : [
            {
              categoryId: activeCategoryId,
              name: activeCategoryName,
              tabs: filteredTabs
            }
          ];

    return groups
      .filter((group) => group.tabs.length > 0 || activeCategoryId !== "all")
      .sort((left, right) => {
        if (boardSort === "count") {
          return right.tabs.length - left.tabs.length || left.name.localeCompare(right.name, "zh-CN");
        }

        return left.name.localeCompare(right.name, "zh-CN");
      });
  }, [activeCategoryId, activeCategoryName, boardSort, categories, filteredTabs]);

  async function refreshTabs() {
    const response = await sendMessage({ type: "GET_TABS", scope: "allWindows" });
    if (response.ok && Array.isArray(response.data)) {
      setTabs(toTabs(response.data));
    }
  }

  async function refreshRecentlyClosed() {
    const response = await sendMessage({ type: "GET_RECENTLY_CLOSED" });
    if (response.ok && Array.isArray(response.data)) {
      setRecentlyClosed(toRecentlyClosed(response.data));
    }
  }

  async function moveTabToCategory(tabId: number, categoryId?: string) {
    await sendMessage({
      type: "UPDATE_TAB_META",
      tabId,
      payload: {
        categoryId,
        classificationMode: "manual"
      }
    });
    await refreshTabs();
  }

  function toggleColumn(categoryId: string) {
    setCollapsedColumns((current) => ({
      ...current,
      [categoryId]: !current[categoryId]
    }));
  }

  async function handleCloseTab(tabId: number) {
    setClosingTabIds((current) => [...current, tabId]);
    await new Promise((resolve) => setTimeout(resolve, 940));
    await sendMessage({ type: "CLOSE_TAB", tabId });
    await refreshTabs();
    await refreshRecentlyClosed();
    setClosingTabIds((current) => current.filter((id) => id !== tabId));
  }

  return (
    <div className="app-shell">
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="stat-card panel">
          <strong>{tabs.length}</strong>
          <span className="muted">全部标签页</span>
        </div>
        <div className="stat-card panel">
          <strong>{filteredTabs.length}</strong>
          <span className="muted">当前筛选结果</span>
        </div>
        <div className="stat-card panel">
          <strong>{recentlyClosed.length}</strong>
          <span className="muted">最近关闭待恢复</span>
        </div>
      </div>

      <div className="workspace-layout workspace-layout-wide">
        <aside className="panel workspace-sidebar">
          <SectionTitle title="分类" subtitle="系统分类与自定义分类" />
          <CategoryList
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelect={setActiveCategoryId}
            onReorder={async (draggedCategoryId, targetCategoryId) => {
              const response = await sendMessage({
                type: "MOVE_CATEGORY",
                draggedCategoryId,
                targetCategoryId
              });
              if (response.ok && Array.isArray(response.data)) {
                setCategories(toCategories(response.data));
                return;
              }

              window.alert(response.error ?? "分类拖拽排序失败");
            }}
            onEdit={(category) => {
              setEditingCategory(category);
              setEditingCategoryName(category.name);
            }}
            onDelete={async (categoryId) => {
              const response = await sendMessage({ type: "DELETE_CATEGORY", categoryId });
              if (response.ok && Array.isArray(response.data)) {
                setCategories(toCategories(response.data));
                if (activeCategoryId === categoryId) {
                  setActiveCategoryId("all");
                }
                await refreshTabs();
                return;
              }

              window.alert(response.error ?? "删除分类失败");
            }}
          />
          {editingCategory ? (
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <input
                className="field"
                placeholder="修改分类名称"
                value={editingCategoryName}
                onChange={(event) => setEditingCategoryName(event.target.value)}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="button-primary"
                  onClick={async () => {
                    const response = await sendMessage({
                      type: "UPSERT_CATEGORY",
                      payload: {
                        ...editingCategory,
                        name: editingCategoryName
                      }
                    });

                    if (response.ok && Array.isArray(response.data)) {
                      setCategories(toCategories(response.data));
                      setEditingCategory(null);
                      setEditingCategoryName("");
                      return;
                    }

                    window.alert(response.error ?? "分类改名失败");
                  }}
                >
                  保存改名
                </button>
                <button
                  className="button-secondary"
                  onClick={() => {
                    setEditingCategory(null);
                    setEditingCategoryName("");
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            <input
              className="field"
              placeholder="新分类名称"
              value={draftCategoryName}
              onChange={(event) => setDraftCategoryName(event.target.value)}
            />
            <button
              className="button-primary"
              onClick={async () => {
                const name = draftCategoryName.trim();
                if (!name) {
                  return;
                }

                const category = createManualCategory(name, categories.length);
                const response = await sendMessage({ type: "UPSERT_CATEGORY", payload: category });
                if (response.ok && Array.isArray(response.data)) {
                  setCategories(toCategories(response.data));
                  setDraftCategoryName("");
                  return;
                }

                window.alert(response.ok ? "分类保存失败" : response.error);
              }}
            >
              新建分类
            </button>
          </div>
        </aside>

        <main className="panel workspace-main">
          <SectionTitle
            title={activeCategoryName}
            subtitle="标签以卡片窗口形式展示，便于像看工作台一样浏览和整理"
            action={
              <div className="toolbar-row">
                <button
                  className={viewMode === "grid" ? "button-primary" : "button-secondary"}
                  onClick={() => setViewMode("grid")}
                >
                  网格视图
                </button>
                <button
                  className={viewMode === "board" ? "button-primary" : "button-secondary"}
                  onClick={() => setViewMode("board")}
                >
                  看板视图
                </button>
                {viewMode === "board" ? (
                  <select
                    className="field"
                    style={{ width: 150 }}
                    value={boardSort}
                    onChange={(event) =>
                      setBoardSort(event.target.value as "category" | "count")
                    }
                  >
                    <option value="category">按分类名称</option>
                    <option value="count">按标签数量</option>
                  </select>
                ) : null}
                <button
                  className="button-secondary"
                  onClick={async () => {
                    const response = await sendMessage({
                      type: "RECLASSIFY_TABS",
                      scope: "allWindows"
                    });
                    if (response.ok && Array.isArray(response.data)) {
                      setTabs(toTabs(response.data));
                    }
                  }}
                >
                  自动分类
                </button>
                <button
                  className="button-secondary"
                  onClick={async () => {
                    const response = await sendMessage({
                      type: "MOVE_TABS_TO_CATEGORY",
                      tabIds: selectedTabIds,
                      categoryId: bulkCategoryId || undefined
                    });

                    if (!response.ok) {
                      window.alert(response.error ?? "批量归类失败");
                      return;
                    }

                    clearSelection();
                    await refreshTabs();
                  }}
                  disabled={selectedTabIds.length === 0}
                >
                  批量归类
                </button>
                <button
                  className="button-primary"
                  onClick={async () => {
                    await sendMessage({ type: "CLOSE_TABS", tabIds: selectedTabIds });
                    clearSelection();
                    await refreshTabs();
                  }}
                  disabled={selectedTabIds.length === 0}
                >
                  批量关闭
                </button>
              </div>
            }
          />

          <div style={{ display: "grid", gap: 12 }}>
            <input
              className="field"
              placeholder="搜索标题 / URL / 备注"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {selectedTabIds.length > 0 ? (
              <div className="toolbar-row">
                <div className="chip">已选择 {selectedTabIds.length} 个标签页</div>
                <select
                  className="field"
                  style={{ maxWidth: 220 }}
                  value={bulkCategoryId}
                  onChange={(event) => setBulkCategoryId(event.target.value)}
                >
                  <option value="">移动到未分类</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 10 }}>
              {loading ? (
                <div className="muted">正在加载全部窗口标签页...</div>
              ) : filteredTabs.length === 0 ? (
                <div className="muted">当前条件下没有标签页。</div>
              ) : viewMode === "board" ? (
                <div className="board-grid">
                  {boardColumns.map((group) => (
                    <section
                      key={group.categoryId}
                      className={`board-column${dropCategoryId === group.categoryId ? " is-drop-target" : ""}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropCategoryId(group.categoryId);
                      }}
                      onDragLeave={() => {
                        setDropCategoryId((current) =>
                          current === group.categoryId ? null : current
                        );
                      }}
                      onDrop={async (event) => {
                        event.preventDefault();
                        if (draggingTabId === null) {
                          return;
                        }

                        await moveTabToCategory(
                          draggingTabId,
                          group.categoryId === "uncategorized" ? undefined : group.categoryId
                        );
                        setDraggingTabId(null);
                        setDropCategoryId(null);
                      }}
                    >
                      <div className="board-column-header">
                        <strong>{group.name}</strong>
                        <div className="board-column-toolbar">
                          <span className="chip">{group.tabs.length} 个标签</span>
                          <button
                            className="button-secondary"
                            onClick={() => toggleColumn(group.categoryId)}
                          >
                            {collapsedColumns[group.categoryId] ? "展开" : "折叠"}
                          </button>
                        </div>
                      </div>
                      {collapsedColumns[group.categoryId] ? (
                        <div className="muted">该列已折叠。</div>
                      ) : (
                        <div className="board-column-stack">
                          {group.tabs.map((tab) => (
                            <TabItem
                              key={tab.tabId}
                              tab={tab}
                              selected={selectedTabIds.includes(tab.tabId)}
                              closing={closingTabIds.includes(tab.tabId)}
                              onSelect={toggleSelectedTab}
                              onActivate={(tabId) => void sendMessage({ type: "ACTIVATE_TAB", tabId })}
                              onClose={handleCloseTab}
                              categories={categories}
                              onChangeCategory={moveTabToCategory}
                              draggable
                              dragging={draggingTabId === tab.tabId}
                              onDragStart={setDraggingTabId}
                              onDragEnd={() => {
                                setDraggingTabId(null);
                                setDropCategoryId(null);
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="tab-grid">
                  {filteredTabs.map((tab) => (
                    <TabItem
                      key={tab.tabId}
                      tab={tab}
                      selected={selectedTabIds.includes(tab.tabId)}
                      closing={closingTabIds.includes(tab.tabId)}
                      onSelect={toggleSelectedTab}
                      onActivate={(tabId) => void sendMessage({ type: "ACTIVATE_TAB", tabId })}
                      onClose={handleCloseTab}
                      categories={categories}
                      onChangeCategory={moveTabToCategory}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="panel" style={{ padding: 16 }}>
              <SectionTitle
                title="最近关闭"
                subtitle="可恢复最近关闭的标签页"
                action={
                  recentlyClosed.length > 0 ? (
                    <button
                      className="button-secondary"
                      onClick={async () => {
                        const response = await sendMessage({ type: "CLEAR_RECENTLY_CLOSED" });
                        if (response.ok) {
                          setRecentlyClosed([]);
                          return;
                        }

                        window.alert(response.error ?? "清空最近关闭失败");
                      }}
                    >
                      清空
                    </button>
                  ) : undefined
                }
              />
              <div className="recent-grid">
                {recentlyClosed.length === 0 ? (
                  <div className="muted">最近没有可恢复的标签页。</div>
                ) : (
                  recentlyClosed.map((tab) => (
                    <div key={tab.id} className="recent-card">
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
                        <div className="muted" style={{ fontSize: 12 }}>
                          {tab.domain}
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {new Date(tab.closedAt).toLocaleString()}
                      </div>
                      <button
                        className="button-secondary"
                        onClick={async () => {
                          const response = await sendMessage({
                            type: "RESTORE_CLOSED_TAB",
                            id: tab.id
                          });
                          if (response.ok && Array.isArray(response.data)) {
                            setRecentlyClosed(toRecentlyClosed(response.data));
                            await refreshTabs();
                            return;
                          }

                          window.alert(response.error ?? "恢复标签页失败");
                        }}
                      >
                        恢复
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
