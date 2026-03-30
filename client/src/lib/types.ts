export interface Category {
  id: number
  name: string
  created_at: string
}

export interface Feed {
  id: number
  title: string
  url: string
  site_url: string | null
  description: string | null
  category_id: number | null
  last_fetched_at: string | null
  health_status: "ok" | "error"
  last_error_message: string | null
  created_at: string
  category_name: string | null
  unread_count: number
}

export interface Article {
  id: number
  feed_id: number
  title: string
  url: string
  author: string | null
  content: string | null
  summary: string | null
  published_at: string | null
  is_read: number
  is_starred: number
  created_at: string
  feed_title: string
}

export interface ArticlesResponse {
  articles: Article[]
  total: number
}
