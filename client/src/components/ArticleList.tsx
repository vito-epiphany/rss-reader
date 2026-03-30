import { Star, Circle, CheckCircle2, ExternalLink } from "lucide-react"
import type { Article } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ArticleListProps {
  articles: Article[]
  selectedId: number | null
  onSelect: (article: Article) => void
  onToggleStar: (id: number, starred: boolean) => void
  onToggleRead: (id: number, isRead: boolean) => void
  loading: boolean
}

export function ArticleList({
  articles,
  selectedId,
  onSelect,
  onToggleStar,
  onToggleRead,
  loading,
}: ArticleListProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Article list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Circle className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No articles</p>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              onClick={() => onSelect(article)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onSelect(article) }}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-border/50 transition-colors group cursor-pointer",
                selectedId === article.id
                  ? "bg-accent"
                  : "hover:bg-accent/30",
                article.is_read && selectedId !== article.id && "opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Unread indicator */}
                <div className="mt-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onToggleRead(article.id, !article.is_read)
                    }}
                    className="p-1 rounded hover:bg-accent transition-colors"
                    title={article.is_read ? "Mark as unread" : "Mark as read"}
                  >
                    {article.is_read ? (
                      <CheckCircle2 className="w-3 h-3 text-muted-foreground/40" />
                    ) : (
                      <Circle className="w-3 h-3 fill-primary text-primary" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0 mr-2">
                  <h3
                    className={cn(
                      "text-sm leading-snug line-clamp-2",
                      article.is_read
                        ? "text-muted-foreground font-normal"
                        : "text-foreground font-medium"
                    )}
                  >
                    {article.title}
                  </h3>

                  {article.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {article.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-muted-foreground truncate">
                      {article.feed_title}
                    </span>
                    <span className="text-xs text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(article.published_at)}
                    </span>
                  </div>
                </div>

                {/* Star button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleStar(article.id, !article.is_starred)
                  }}
                  className={cn(
                    "flex-shrink-0 p-0.5 rounded transition-colors mt-0.5",
                    article.is_starred
                      ? "text-primary"
                      : "text-muted-foreground/30 opacity-0 group-hover:opacity-100"
                  )}
                >
                  <Star
                    className={cn(
                      "w-3.5 h-3.5",
                      article.is_starred && "fill-current"
                    )}
                  />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function EmptyArticleList() {
  return (
    <div className="w-80 flex-shrink-0 border-r border-border flex flex-col items-center justify-center h-screen bg-background text-muted-foreground">
      <ExternalLink className="w-10 h-10 mb-3 opacity-20" />
      <p className="text-sm font-medium">Add a feed to get started</p>
      <p className="text-xs mt-1 opacity-70">
        Click + to subscribe to an RSS feed
      </p>
    </div>
  )
}
