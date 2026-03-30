import { useState } from "react"
import { X, Loader2, Rss } from "lucide-react"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AddFeedDialogProps {
  open: boolean
  categories: Category[]
  onClose: () => void
  onSubmit: (url: string, categoryId: number | null) => Promise<void>
  onCreateCategory: (name: string) => Promise<void>
}

export function AddFeedDialog({
  open,
  categories,
  onClose,
  onSubmit,
  onCreateCategory,
}: AddFeedDialogProps) {
  const [url, setUrl] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError("")
    try {
      await onSubmit(url.trim(), categoryId)
      setUrl("")
      setCategoryId(null)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to add feed")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    try {
      await onCreateCategory(newCategory.trim())
      setNewCategory("")
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-popover border border-border rounded-lg shadow-lg w-full max-w-md mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-popover-foreground">
              Add Feed
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* URL input */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Feed URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Category select */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Category (optional)
            </label>
            <select
              value={categoryId ?? ""}
              onChange={(e) =>
                setCategoryId(e.target.value ? Number(e.target.value) : null)
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* New category */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={!newCategory.trim()}
              className={cn(
                "px-3 py-2 text-sm rounded-md border transition-colors",
                newCategory.trim()
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border"
                  : "bg-muted text-muted-foreground border-border cursor-not-allowed"
              )}
            >
              Add
            </button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className={cn(
              "w-full py-2 text-sm font-medium rounded-md transition-colors",
              loading || !url.trim()
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Subscribing...
              </span>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
