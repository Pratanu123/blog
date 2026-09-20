import type { Article, Category, GalleryType, GalleryWork, Paginated, SiteSettings, Tag, User } from "../types";
import { api, ensureCsrf } from "./api";
import { getVisitorKey } from "../utils/visitorKey";

export type PublicComment = {
  id: number;
  author_name: string;
  body: string;
  created_at?: string | null;
};

export type EngagementSummary = {
  likes_count: number;
  liked: boolean;
  comments_count: number;
  comments: PublicComment[];
};

const engagementCache = new Map<string, { at: number; data: EngagementSummary; inflight?: Promise<EngagementSummary> }>();
const ENGAGEMENT_TTL_MS = 15_000;

function engagementCacheKey(type: "article" | "gallery_work", id: number) {
  return `${type}:${id}:${getVisitorKey()}`;
}

export const publicService = {
  async homepage() {
    const { data } = await api.get("/public/homepage");
    return data.data as {
      settings: SiteSettings;
      featured: Article[];
      latest: Article[];
      popular: Article[];
      categories: Category[];
    };
  },
  async settings() {
    const { data } = await api.get("/public/settings");
    return data.data as SiteSettings;
  },
  async articles(page = 1) {
    const { data } = await api.get("/public/articles", { params: { page, per_page: 9 } });
    return data.data as Paginated<Article>;
  },
  async article(slug: string) {
    const { data } = await api.get(`/public/articles/${slug}`);
    return data.data as Article;
  },
  async category(slug: string, page = 1) {
    const { data } = await api.get(`/public/categories/${slug}`, { params: { page } });
    return data.data as { category: Category; items: Article[]; meta: Paginated<Article>["meta"] };
  },
  async tag(slug: string, page = 1) {
    const { data } = await api.get(`/public/tags/${slug}`, { params: { page } });
    return data.data as { tag: Tag; items: Article[]; meta: Paginated<Article>["meta"] };
  },
  async author(slug: string, page = 1) {
    const { data } = await api.get(`/public/authors/${slug}`, { params: { page } });
    return data.data as { author: User; items: Article[]; meta: Paginated<Article>["meta"] };
  },
  async search(q: string, page = 1) {
    const { data } = await api.get("/search", { params: { q, page } });
    return data.data as Paginated<Article> & { query: string };
  },
  async contact(payload: { name: string; email: string; message: string }) {
    await ensureCsrf();
    const { data } = await api.post("/public/contact", payload);
    return data;
  },
  async newsletter(email: string) {
    await ensureCsrf();
    const { data } = await api.post("/public/newsletter", { email });
    return data;
  },
  async gallery(type: GalleryType, page = 1) {
    const { data } = await api.get("/public/gallery", { params: { type, page, per_page: 9 } });
    return data.data as {
      type: GalleryType;
      label: string;
      items: GalleryWork[];
      meta: Paginated<GalleryWork>["meta"];
    };
  },
  async engagement(type: "article" | "gallery_work", id: number) {
    const key = engagementCacheKey(type, id);
    const cached = engagementCache.get(key);
    if (cached?.data && Date.now() - cached.at < ENGAGEMENT_TTL_MS) {
      return cached.data;
    }
    if (cached?.inflight) {
      return cached.inflight;
    }

    const inflight = api
      .get(`/public/engagement/${type}/${id}`, {
        headers: { "X-Visitor-Key": getVisitorKey() },
      })
      .then(({ data }) => {
        const summary = data.data as EngagementSummary;
        engagementCache.set(key, { at: Date.now(), data: summary });
        return summary;
      })
      .catch((error) => {
        engagementCache.delete(key);
        throw error;
      });

    engagementCache.set(key, { at: 0, data: cached?.data ?? { likes_count: 0, liked: false, comments_count: 0, comments: [] }, inflight });
    return inflight;
  },
  async toggleLike(type: "article" | "gallery_work", id: number) {
    await ensureCsrf();
    const visitor_key = getVisitorKey();
    const { data } = await api.post(`/public/engagement/${type}/${id}/like`, { visitor_key });
    const result = data.data as { liked: boolean; likes_count: number };
    const key = engagementCacheKey(type, id);
    const cached = engagementCache.get(key);
    if (cached?.data) {
      engagementCache.set(key, {
        at: Date.now(),
        data: { ...cached.data, liked: result.liked, likes_count: result.likes_count },
      });
    }
    return result;
  },
  async postComment(
    type: "article" | "gallery_work",
    id: number,
    payload: { author_name: string; author_email?: string; body: string },
  ) {
    await ensureCsrf();
    const { data } = await api.post(`/public/engagement/${type}/${id}/comments`, payload);
    const comment = data.data as PublicComment;
    const key = engagementCacheKey(type, id);
    const cached = engagementCache.get(key);
    if (cached?.data) {
      const comments = [comment, ...cached.data.comments];
      engagementCache.set(key, {
        at: Date.now(),
        data: { ...cached.data, comments, comments_count: comments.length },
      });
    }
    return comment;
  },
};
