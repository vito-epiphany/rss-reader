import { useState, useEffect, useCallback, useRef } from "react"
import { Sidebar } from "@/components/Sidebar"
import { ArticleList, EmptyArticleList } from "@/components/ArticleList"
import { ArticleReader } from "@/components/ArticleReader"
import { AddFeedDialog } from "@/components/AddFeedDialog"
import { ManageCategoriesDialog } from "@/components/ManageCategoriesDialog"
import { SearchBar } from "@/components/SearchBar"
import { CheckCheck } from "lucide-react"
import * as api from "@/lib/api"
import type { Feed, Category, Article } from "@/lib/types"

function App() {
  const [feeds, setFeeds] = useState<Feed[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [articles, setArticles] = useState<Article[]>([])

  const [selectedView, setSelectedView] = useState<"all" | "unread" | "starred" | "feed">("all")
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showAddFeed, setShowAddFeed] = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [search, setSearch] = useState("")
  const [loadingArticles, setLoadingArticles] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const loadFeeds = useCallback(async () => {
    try {
      const [f, c] = await Promise.all([api.getFeeds(), api.getCategories()])
      setFeeds(f)
      setCategories(c)
    } catch {
      // silently fail
    }
  }, [])

  const loadArticles = useCallback(async () => {
    setLoadingArticles(true)
    try {
      const params: Record<string, string | number | undefined> = {
        limit: 100,
        search: search || undefined,
      }
      if (selectedView === "unread") {
        params.is_read = 0
      } else if (selectedView === "starred") {
        params.is_starred = 1
      } else if (selectedView === "feed" && selectedFeedId) {
        params.feed_id = selectedFeedId
      }
      const res = await api.getArticles(params)
      setArticles(res.articles)
    } catch {
      setArticles([])
    } finally {
      setLoadingArticles(false)
    }
  }, [selectedView, selectedFeedId, search])

  useEffect(() => { loadFeeds() }, [loadFeeds])
  useEffect(() => { loadArticles() }, [loadArticles])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await api.refreshAllFeeds()
        await Promise.all([loadFeeds(), loadArticles()])
      } catch {
        // silently fail
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadFeeds, loadArticles])

  const handleSelectAll = () => {
    setSelectedView("all")
    setSelectedFeedId(null)
    setSelectedArticle(null)
  }

  const handleSelectUnread = () => {
    setSelectedView("unread")
    setSelectedFeedId(null)
    setSelectedArticle(null)
  }

  const handleSelectStarred = () => {
    setSelectedView("starred")
    setSelectedFeedId(null)
    setSelectedArticle(null)
  }

  const handleSelectFeed = (id: number) => {
    setSelectedView("feed")
    setSelectedFeedId(id)
    setSelectedArticle(null)
  }

  const handleSelectArticle = async (article: Article) => {
    setSelectedArticle(article)
    if (!article.is_read) {
      await api.markRead(article.id, true)
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, is_read: 1 } : a))
      )
      setSelectedArticle((prev) =>
        prev && prev.id === article.id ? { ...prev, is_read: 1 } : prev
      )
      loadFeeds()
    }
  }

  const handleToggleStar = async (id: number, starred: boolean) => {
    await api.toggleStar(id, starred)
    const newVal = starred ? 1 : 0
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_starred: newVal } : a))
    )
    setSelectedArticle((prev) =>
      prev && prev.id === id ? { ...prev, is_starred: newVal } : prev
    )
  }

  const handleAddFeed = async (url: string, categoryId: number | null) => {
    await api.addFeed(url, categoryId)
    await loadFeeds()
    await loadArticles()
  }

  const handleCreateCategory = async (name: string) => {
    await api.createCategory(name)
    await loadFeeds()
  }

  const handleRenameCategory = async (id: number, name: string) => {
    await api.renameCategory(id, name)
    await loadFeeds()
  }

  const handleDeleteCategory = async (id: number) => {
    await api.deleteCategory(id)
    await loadFeeds()
  }

  const handleMarkAllRead = async () => {
    const feedId = selectedView === "feed" && selectedFeedId ? selectedFeedId : undefined
    await api.markAllRead(feedId)
    setArticles((prev) => prev.map((a) => ({ ...a, is_read: 1 })))
    loadFeeds()
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportOpml = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = "" // reset so same file can be re-selected
    try {
      const text = await file.text()
      const result = await api.importOpml(text)
      alert(`Imported ${result.imported} feed(s), skipped ${result.skipped} duplicate(s).${result.errors.length > 0 ? "\nErrors:\n" + result.errors.join("\n") : ""}`)
      await loadFeeds()
      await loadArticles()
    } catch (err: any) {
      alert("Import failed: " + (err.message || "Unknown error"))
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        feeds={feeds}
        categories={categories}
        selectedFeedId={selectedFeedId}
        selectedView={selectedView}
        onSelectAll={handleSelectAll}
        onSelectUnread={handleSelectUnread}
        onSelectStarred={handleSelectStarred}
        onSelectFeed={handleSelectFeed}
        onAddFeed={() => setShowAddFeed(true)}
        onManageCategories={() => setShowManageCategories(true)}
        onImportOpml={handleImportOpml}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Hidden file input for OPML import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".opml,.xml,text/xml,application/xml"
        className="hidden"
        onChange={handleFileSelected}
      />

      {feeds.length === 0 && !loadingArticles ? (
        <>
          <EmptyArticleList />
          <ArticleReader article={null} />
        </>
      ) : (
        <>
          <div className="flex flex-col w-80 flex-shrink-0 border-r border-border h-screen bg-background">
            <div className="px-3 pt-3 pb-1 flex items-center gap-2">
              <SearchBar value={search} onChange={setSearch} className="flex-1" />
              <button
                onClick={handleMarkAllRead}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
                title="Mark all as read"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            </div>
            <ArticleList
              articles={articles}
              selectedId={selectedArticle?.id ?? null}
              onSelect={handleSelectArticle}
              onToggleStar={handleToggleStar}
              loading={loadingArticles}
            />
          </div>
          <ArticleReader article={selectedArticle} />
        </>
      )}

      <AddFeedDialog
        open={showAddFeed}
        categories={categories}
        onClose={() => setShowAddFeed(false)}
        onSubmit={handleAddFeed}
        onCreateCategory={handleCreateCategory}
      />

      <ManageCategoriesDialog
        open={showManageCategories}
        categories={categories}
        onClose={() => setShowManageCategories(false)}
        onCreate={handleCreateCategory}
        onRename={handleRenameCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  )
}

export default App
