export type ArticleStatus = "draft" | "scheduled" | "published" | "archived";
export type UserStatus = "active" | "inactive" | "suspended";

export interface Permission {
  id: number;
  name: string;
  slug: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  slug: string;
  bio?: string | null;
  avatar?: string | null;
  status: UserStatus | string;
  last_login_at?: string | null;
  role?: Role | null;
  created_at?: string;
  updated_at?: string;
}

export interface MediaItem {
  id: number;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  alt_text?: string | null;
  created_at?: string;
}

export type GalleryType = "photography" | "painting";

export interface GalleryWork {
  id: number;
  type: GalleryType | string;
  title: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  alt_text?: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  path: string;
  url: string;
  is_published: boolean;
  sort_order: number;
  uploaded_by?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  children?: Category[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  status: ArticleStatus | string;
  published_at?: string | null;
  scheduled_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  twitter_card?: string | null;
  reading_time?: number;
  views?: number;
  author?: User | null;
  category?: Category | null;
  featured_image?: MediaItem | null;
  og_image?: MediaItem | null;
  tags?: Tag[];
  revisions?: ArticleRevision[];
  related?: Article[];
  created_at?: string;
  updated_at?: string;
}

export interface ArticleRevision {
  id: number;
  article_id: number;
  user?: User | null;
  title: string;
  content?: string | null;
  excerpt?: string | null;
  revision_number: number;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
}

export interface DashboardStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  scheduled_articles: number;
  total_views: number;
  total_authors: number;
  categories: number;
  tags: number;
}

export interface SiteSettings {
  site_name?: string;
  site_description?: string;
  site_url?: string;
  organization_name?: string;
  organization_logo?: string;
  default_og_image?: string;
  twitter_handle?: string;
  contact_email?: string;
  about_content?: string;
  about_me_content?: string;
  newsletter_enabled?: string;
  robots_custom?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  entity_type?: string | null;
  entity_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  user?: User | null;
  created_at: string;
}
