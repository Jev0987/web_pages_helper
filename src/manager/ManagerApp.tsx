import { useEffect, useMemo, useState } from "react";
import { CategoryList } from "../components/category/CategoryList";
import { SectionTitle } from "../components/common/SectionTitle";
import { TabItem } from "../components/tabs/TabItem";
import { useCategoryStore } from "../store/category-store";
import { useTabStore } from "../store/tab-store";
import { useUiStore } from "../store/ui-store";
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
  const { editingTabId, setEditingTabId, loading, setLoading } = useUiStore();
  const [draftCategoryName, setDraftCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<CategoryEntity | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [recentlyClosed, setRecentlyClosed] = useState<RecentlyClosedTab[]>([]);
  const editingTab = tabs.find((tab) => tab.tabId === editingTabId) ?? null;

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

  return (
    <div className="app-shell">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 1fr) 320px",
          gap: 16,
          alignItems: "start"
        }}
      >
        <aside className="panel" style={{ padding: 16, position: "sticky", top: 16 }}>
          <SectionTitle title="分类" subtitle="系统分类与自定义分类" />
          <CategoryList
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelect={setActiveCategoryId}
            onEdit={(category) => {
              setEditingCategory(category);
              setEditingCategoryName(category.name);
            }}
            onMove={async (categoryId, direction) => {
              const response = await sendMessage({ type: "REORDER_CATEGORY", categoryId, direction });
              if (response.ok && Array.isArray(response.data)) {
                setCategories(toCategories(response.data));
                return;
              }

              window.alert(response.error ?? "分类排序失败");
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

        <main className="panel" style={{ padding: 16 }}>
          <SectionTitle
            title="标签页管理"
            subtitle="查看全部窗口标签页，支持批量操作"
            action={
              <div style={{ display: "flex", gap: 8 }}>
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
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
              ) : (
                filteredTabs.map((tab) => (
                  <TabItem
                    key={tab.tabId}
                    tab={tab}
                    selected={selectedTabIds.includes(tab.tabId)}
                    onSelect={toggleSelectedTab}
                    onActivate={(tabId) => void sendMessage({ type: "ACTIVATE_TAB", tabId })}
                    onClose={async (tabId) => {
                      await sendMessage({ type: "CLOSE_TAB", tabId });
                      await refreshTabs();
                      await refreshRecentlyClosed();
                    }}
                    onEdit={setEditingTabId}
                    categories={categories}
                    onChangeCategory={async (tabId, categoryId) => {
                      await sendMessage({
                        type: "UPDATE_TAB_META",
                        tabId,
                        payload: {
                          categoryId,
                          classificationMode: "manual"
                        }
                      });
                      await refreshTabs();
                    }}
                  />
                ))
              )}
            </div>

            <div className="panel" style={{ padding: 16 }}>
              <SectionTitle title="最近关闭" subtitle="可恢复最近关闭的标签页" />
              <div style={{ display: "grid", gap: 8 }}>
                {recentlyClosed.length === 0 ? (
                  <div className="muted">最近没有可恢复的标签页。</div>
                ) : (
                  recentlyClosed.map((tab) => (
                    <div
                      key={tab.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 12,
                        alignItems: "center"
                      }}
                    >
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

        <aside className="panel" style={{ padding: 16, position: "sticky", top: 16 }}>
          <SectionTitle title="标签详情" subtitle="编辑自定义名称、备注和分类" />
          {editingTab ? (
            <EditPanel
              tabId={editingTab.tabId}
              title={editingTab.customTitle ?? editingTab.title}
              note={editingTab.note ?? ""}
              categoryId={editingTab.categoryId ?? ""}
              categories={categories}
              onSaved={async () => {
                setEditingTabId(null);
                await refreshTabs();
              }}
            />
          ) : (
            <div className="muted">从中间列表选择“编辑”后在这里修改信息。</div>
          )}
        </aside>
      </div>
    </div>
  );
}

type EditPanelProps = {
  tabId: number;
  title: string;
  note: string;
  categoryId: string;
  categories: CategoryEntity[];
  onSaved: () => Promise<void>;
};

function EditPanel({ tabId, title, note, categoryId, categories, onSaved }: EditPanelProps) {
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftNote, setDraftNote] = useState(note);
  const [draftCategoryId, setDraftCategoryId] = useState(categoryId);

  useEffect(() => {
    setDraftTitle(title);
    setDraftNote(note);
    setDraftCategoryId(categoryId);
  }, [categoryId, note, title]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span className="muted">自定义标题</span>
        <input
          className="field"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span className="muted">备注</span>
        <textarea
          className="field"
          rows={6}
          value={draftNote}
          onChange={(event) => setDraftNote(event.target.value)}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span className="muted">分类</span>
        <select
          className="field"
          value={draftCategoryId}
          onChange={(event) => setDraftCategoryId(event.target.value)}
        >
          <option value="">未分类</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <button
        className="button-primary"
        onClick={async () => {
          await sendMessage({
            type: "UPDATE_TAB_META",
            tabId,
            payload: {
              customTitle: draftTitle,
              note: draftNote,
              categoryId: draftCategoryId || undefined,
              classificationMode: "manual"
            }
          });
          await onSaved();
        }}
      >
        保存修改
      </button>
    </div>
  );
}
