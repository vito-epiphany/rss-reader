import type { Article, ArticlesResponse, Category, Feed } from "./types"

const BASE = "/api"

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// Categories
export const getCategories = () => request<Category[]>("/categories")
export const createCategory = (name: string) =>
  request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
export const deleteCategory = (id: number) =>
  request<void>(`/categories/${id}`, { method: "DELETE" })
export const renameCategory = (id: number, name: string) =>
  request<Category>(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  })

// Feeds
export const getFeeds = () => request<Feed[]>("/feeds")
export const addFeed = (url: string, category_id?: number | null) =>
  request<Feed>("/feeds", {
    method: "POST",
    body: JSON.stringify({ url, category_id }),
  })
export const updateFeed = (id: number, data: { title?: string; category_id?: number | null }) =>
  request<void>(`/feeds/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
export const deleteFeed = (id: number) =>
  request<void>(`/feeds/${id}`, { method: "DELETE" })
export const refreshFeed = (id: number) =>
  request<{ new_articles: number }>(`/feeds/${id}/refresh`, { method: "POST" })
export const refreshAllFeeds = () =>
  request<{ total_new: number }>("/feeds/refresh-all", { method: "POST" })

// Articles
export const getArticles = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") query.set(k, String(v))
  }
  return request<ArticlesResponse>(`/articles?${query}`)
}
export const getArticle = (id: number) => request<Article>(`/articles/${id}`)
export const markRead = (id: number, is_read: boolean) =>
  request<void>(`/articles/${id}/read`, {
    method: "PATCH",
    body: JSON.stringify({ is_read }),
  })
export const toggleStar = (id: number, is_starred: boolean) =>
  request<void>(`/articles/${id}/star`, {
    method: "PATCH",
    body: JSON.stringify({ is_starred }),
  })
export const markAllRead = (feed_id?: number) =>
  request<void>("/articles/mark-all-read", {
    method: "POST",
    body: JSON.stringify({ feed_id }),
  })

// OPML
export const importOpml = (opml: string) =>
  request<{ imported: number; skipped: number; errors: string[] }>("/opml/import", {
    method: "POST",
    body: JSON.stringify({ opml }),
  })
