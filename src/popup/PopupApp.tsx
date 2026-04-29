import { useEffect, useState } from "react";
import { SectionTitle } from "../components/common/SectionTitle";
import { TabItem } from "../components/tabs/TabItem";
import { useCategoryStore } from "../store/category-store";
import { useTabStore } from "../store/tab-store";
import { useUiStore } from "../store/ui-store";
import type { CategoryEntity } from "../types/category";
import type { RuntimeMessage, RuntimeResponse } from "../types/message";
import type { TabEntity } from "../types/tab";

async function sendMessage(message: RuntimeMessage): Promise<RuntimeResponse> {
  return chrome.runtime.sendMessage(message);
}

function toTabs(data: RuntimeResponse["data"]): TabEntity[] {
  return (data ?? []) as TabEntity[];
}

function toCategories(data: RuntimeResponse["data"]): CategoryEntity[] {
  return (data ?? []) as CategoryEntity[];
}

export function PopupApp() {
  const { tabs, setTabs, search, setSearch } = useTabStore();
  const { categories, setCategories } = useCategoryStore();
  const { loading, setLoading } = useUiStore();
  const [refreshState, setRefreshState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

  async function refreshTabs() {
    setRefreshState("loading");
    setLoading(true);
    const response = await sendMessage({ type: "GET_TABS", scope: "currentWindow" });
    if (response.ok && Array.isArray(response.data)) {
      setTabs(toTabs(response.data));
      setRefreshState("success");
    } else {
      setRefreshState("error");
    }
    setLoading(false);
    window.setTimeout(() => {
      setRefreshState("idle");
    }, 1200);
  }

  const refreshLabel =
    refreshState === "loading"
      ? "刷新中..."
      : refreshState === "success"
        ? "已刷新"
        : refreshState === "error"
          ? "刷新失败"
          : "刷新标签";

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);

      const [tabsResponse, categoriesResponse] = await Promise.all([
        sendMessage({ type: "GET_TABS", scope: "currentWindow" }),
        sendMessage({ type: "GET_CATEGORIES" })
      ]);

      if (tabsResponse.ok && Array.isArray(tabsResponse.data)) {
        setTabs(toTabs(tabsResponse.data));
      }

      if (categoriesResponse.ok && Array.isArray(categoriesResponse.data)) {
        setCategories(toCategories(categoriesResponse.data));
      }

      setLoading(false);
    }

    void bootstrap();
  }, [setCategories, setLoading, setTabs]);

  const filteredTabs = tabs.filter((tab) => {
    const source = `${tab.customTitle ?? ""} ${tab.title} ${tab.url}`.toLowerCase();
    return source.includes(search.toLowerCase());
  });

  return (
    <div className="app-shell" style={{ width: 420, minHeight: 540 }}>
      <div className="panel" style={{ padding: 16, display: "grid", gap: 16 }}>
        <SectionTitle
          title="标签页管家"
          subtitle="统一查看当前窗口标签页并快速整理"
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="button-secondary"
                onClick={() => void refreshTabs()}
                disabled={refreshState === "loading"}
              >
                {refreshLabel}
              </button>
              <button
                className="button-primary"
                onClick={() => chrome.runtime.openOptionsPage()}
              >
                管理页
              </button>
            </div>
          }
        />

        <input
          className="field"
          placeholder="搜索标签页 / URL / 备注"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((category) => (
            <span key={category.categoryId} className="chip">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: category.color ?? "var(--line)"
                }}
              />
              {category.name}
            </span>
          ))}
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {loading ? (
            <div className="muted">正在加载标签页...</div>
          ) : filteredTabs.length === 0 ? (
            <div className="muted">没有找到匹配的标签页。</div>
          ) : (
            filteredTabs.map((tab) => (
              <TabItem
                key={tab.tabId}
                tab={tab}
                onActivate={(tabId) => void sendMessage({ type: "ACTIVATE_TAB", tabId })}
                onClose={async (tabId) => {
                  await sendMessage({ type: "CLOSE_TAB", tabId });
                  setTabs(tabs.filter((item) => item.tabId !== tabId));
                }}
              />
            ))
          )}
        </div>

        <button
          className="button-secondary"
          onClick={async () => {
            const response = await sendMessage({
              type: "RECLASSIFY_TABS",
              scope: "currentWindow"
            });
            if (response.ok && Array.isArray(response.data)) {
              setTabs(toTabs(response.data));
            }
          }}
        >
          重新自动分类
        </button>
      </div>
    </div>
  );
}
