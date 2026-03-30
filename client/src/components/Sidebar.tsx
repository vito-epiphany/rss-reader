import { useState } from "react"
import {
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Inbox,
  CircleDot,
  FolderOpen,
  Settings2,
  Upload,
  RefreshCw,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import type { Feed, Category } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SidebarProps {
  feeds: Feed[]
  categories: Category[]
  selectedFeedId: number | null
  selectedView: "all" | "unread" | "starred" | "feed"
  onSelectAll: () => void
  onSelectUnread: () => void
  onSelectStarred: () => void
  onSelectFeed: (id: number) => void
  onAddFeed: () => void
  onManageCategories: () => void
  onImportOpml: () => void
  onRefreshAll: () => void
  onDeleteFeed: (id: number) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  feeds,
  categories,
  selectedFeedId,
  selectedView,
  onSelectAll,
  onSelectUnread,
  onSelectStarred,
  onSelectFeed,
  onAddFeed,
  onManageCategories,
  onImportOpml,
  onRefreshAll,
  onDeleteFeed,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<number>>(
    new Set()
  )

  const totalUnread = feeds.reduce((sum, f) => sum + (f.unread_count || 0), 0)

  const uncategorizedFeeds = feeds.filter((f) => !f.category_id)
  const categorizedFeeds = categories.map((cat) => ({
    ...cat,
    feeds: feeds.filter((f) => f.category_id === cat.id),
  }))

  const toggleCategory = (id: number) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen transition-[width] duration-200",
        collapsed ? "w-12" : "w-64"
      )}
    >
      {collapsed ? (
        <>
        {/* Collapsed: icon-only nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 flex flex-col items-center gap-1">
          <button
            onClick={onSelectAll}
            className={cn(
              "p-2 rounded-md transition-colors",
              selectedView === "all"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-accent/50"
            )}
            title="All Articles"
          >
            <Inbox className="w-4 h-4" />
          </button>
          <button
            onClick={onSelectUnread}
            className={cn(
              "p-2 rounded-md transition-colors relative",
              selectedView === "unread"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-accent/50"
            )}
            title="Unread"
          >
            <CircleDot className="w-4 h-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] font-medium bg-primary text-primary-foreground rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {totalUnread}
              </span>
            )}
          </button>
          <button
            onClick={onSelectStarred}
            className={cn(
              "p-2 rounded-md transition-colors",
              selectedView === "starred"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-sidebar-foreground hover:bg-accent/50"
            )}
            title="Starred"
          >
            <Star className="w-4 h-4" />
          </button>
        </nav>
        {/* Collapsed footer */}
        <div className="p-2 border-t border-sidebar-border flex flex-col items-center gap-1">
          <button
            onClick={onAddFeed}
            className="p-2 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
            title="Add feed"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
        </>
      ) : (
        /* Expanded: full nav */
        <>
          <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {/* All articles */}
        <button
          onClick={onSelectAll}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
            selectedView === "all"
              ? "bg-accent text-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-accent/50"
          )}
        >
          <Inbox className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">All Articles</span>
        </button>

        {/* Unread */}
        <button
          onClick={onSelectUnread}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
            selectedView === "unread"
              ? "bg-accent text-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-accent/50"
          )}
        >
          <CircleDot className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Unread</span>
          {totalUnread > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              {totalUnread}
            </span>
          )}
        </button>

        {/* Starred */}
        <button
          onClick={onSelectStarred}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
            selectedView === "starred"
              ? "bg-accent text-accent-foreground font-medium"
              : "text-sidebar-foreground hover:bg-accent/50"
          )}
        >
          <Star className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Starred</span>
        </button>

        <div className="my-2 mx-4 border-t border-sidebar-border" />

        {/* Categorized feeds */}
        {categorizedFeeds.map((cat) => (
          <div key={cat.id}>
            <button
              onClick={() => toggleCategory(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-sidebar-foreground transition-colors"
            >
              {collapsedCategories.has(cat.id) ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <FolderOpen className="w-4 h-4" />
              <span>{cat.name}</span>
            </button>
            {!collapsedCategories.has(cat.id) &&
              cat.feeds.map((feed) => (
                <FeedItem
                  key={feed.id}
                  feed={feed}
                  selected={selectedView === "feed" && selectedFeedId === feed.id}
                  onSelect={() => onSelectFeed(feed.id)}
                  onDelete={onDeleteFeed}
                />
              ))}
          </div>
        ))}

        {/* Uncategorized */}
        {uncategorizedFeeds.length > 0 && (
          <>
            {categorizedFeeds.length > 0 && (
              <div className="px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Uncategorized
              </div>
            )}
            {uncategorizedFeeds.map((feed) => (
              <FeedItem
                key={feed.id}
                feed={feed}
                selected={selectedView === "feed" && selectedFeedId === feed.id}
                onSelect={() => onSelectFeed(feed.id)}
                onDelete={onDeleteFeed}
              />
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-sidebar-border flex items-center gap-3">
        <button
          onClick={onAddFeed}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
          title="Add Feed"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onRefreshAll}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
          title="Refresh All Feeds"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={onImportOpml}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
          title="Import OPML"
        >
          <Upload className="w-4 h-4" />
        </button>
        <button
          onClick={onManageCategories}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
          title="Manage Categories"
        >
          <Settings2 className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-accent transition-colors"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>
        </>
      )}
    </aside>
  )
}

function FeedItem({
  feed,
  selected,
  onSelect,
  onDelete,
}: {
  feed: Feed
  selected: boolean
  onSelect: () => void
  onDelete: (id: number) => void
}) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div className="group relative">
      <div
        onClick={onSelect}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-1.5 text-sm transition-colors cursor-pointer",
          selected
            ? "bg-accent text-accent-foreground font-medium"
            : "text-sidebar-foreground hover:bg-accent/50"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onSelect() }}
      >
        <span className="w-4 flex-shrink-0 flex items-center justify-center">
          {feed.health_status === "error" && (
            <span
              className="w-2 h-2 rounded-full bg-red-500"
              title={feed.last_error_message || "Feed unavailable"}
            />
          )}
        </span>
        <span className="flex-1 text-left truncate">{feed.title}</span>
        {/* Right side: unread count or delete button (mutually exclusive) */}
        <div className="w-6 h-4 flex items-center justify-end">
          {/* Unread count - shown when not hovering */}
          {(feed.unread_count || 0) > 0 && !showDelete && (
            <span className="text-xs text-muted-foreground font-medium">
              {feed.unread_count}
            </span>
          )}
          
          {/* Delete button - shown on hover, same position */}
          {showDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`确定要取消订阅 "${feed.title}" 吗？`)) {
                  onDelete(feed.id)
                }
              }}
              className="p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title={`取消订阅 ${feed.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
