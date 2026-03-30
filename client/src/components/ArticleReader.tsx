import { BookOpen, Clock } from "lucide-react"
import type { Article } from "@/lib/types"

interface ArticleReaderProps {
  article: Article | null
}

export function ArticleReader({ article }: ArticleReaderProps) {
  if (!article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen bg-background text-muted-foreground">
        <BookOpen className="w-12 h-12 mb-4 opacity-15" />
        <p className="text-base font-medium opacity-50">Select an article to read</p>
      </div>
    )
  }

  const formatFullDate = (dateStr: string | null) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <article className="max-w-2xl mx-auto px-6 py-8 animate-fade-in">
          {/* Meta */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold leading-tight mb-3">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors"
              >
                {article.title}
              </a>
            </h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/70">
                {article.feed_title}
              </span>
              {article.author && (
                <>
                  <span className="opacity-30">·</span>
                  <span>{article.author}</span>
                </>
              )}
              {article.published_at && (
                <>
                  <span className="opacity-30">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatFullDate(article.published_at)}
                  </span>
                </>
              )}
            </div>
          </header>

          {/* Article body */}
          {article.content ? (
            <div
              className="prose-reader"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : article.summary ? (
            <div className="prose-reader">
              <p>{article.summary}</p>
              <p className="mt-6">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:opacity-80 transition-opacity"
                >
                  Read full article →
                </a>
              </p>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              <p>No content available.</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-primary hover:opacity-80"
              >
                Read on original site →
              </a>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
