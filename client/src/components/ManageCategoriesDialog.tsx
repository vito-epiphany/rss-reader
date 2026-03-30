import { useState } from "react"
import { X, Pencil, Trash2, Plus, Check, FolderOpen } from "lucide-react"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ManageCategoriesDialogProps {
  open: boolean
  categories: Category[]
  onClose: () => void
  onCreate: (name: string) => Promise<void>
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function ManageCategoriesDialog({
  open,
  categories,
  onClose,
  onCreate,
  onRename,
  onDelete,
}: ManageCategoriesDialogProps) {
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError("")
    try {
      await onCreate(newName.trim())
      setNewName("")
    } catch (err: any) {
      setError(err.message || "Failed to create category")
    } finally {
      setCreating(false)
    }
  }

  const handleRename = async (id: number) => {
    if (!editingName.trim()) return
    setError("")
    try {
      await onRename(id, editingName.trim())
      setEditingId(null)
      setEditingName("")
    } catch (err: any) {
      setError(err.message || "Failed to rename category")
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? Feeds in this category will become uncategorized.`)) {
      return
    }
    setError("")
    try {
      await onDelete(id)
    } catch (err: any) {
      setError(err.message || "Failed to delete category")
    }
  }

  const startEditing = (cat: Category) => {
    setEditingId(cat.id)
    setEditingName(cat.name)
    setError("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-popover border border-border rounded-lg shadow-lg w-full max-w-sm mx-4 animate-fade-in">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-popover-foreground">
              Manage Categories
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Create new category */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-md text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-colors"
              autoFocus
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className={cn(
                "px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 text-sm",
                creating || !newName.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {error && <p className="text-xs text-destructive">{error}</p>}

          {/* Category list */}
          <div className="border border-border rounded-md divide-y divide-border">
            {categories.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No categories yet
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 group"
                >
                  {editingId === cat.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(cat.id)
                          if (e.key === "Escape") {
                            setEditingId(null)
                            setEditingName("")
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(cat.id)}
                        disabled={!editingName.trim()}
                        className="p-1 rounded text-primary hover:bg-accent transition-colors"
                        title="Save"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditingName("")
                        }}
                        className="p-1 rounded text-muted-foreground hover:bg-accent transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 text-sm text-foreground truncate">
                        {cat.name}
                      </span>
                      <button
                        onClick={() => startEditing(cat)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-all opacity-0 group-hover:opacity-100"
                        title="Rename"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-accent transition-all opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
