import type { Article, Category, GalleryType, GalleryWork, Paginated, SiteSettings, Tag, User } from "../types";
import { api } from "./api";

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
    const { data } = await api.get("/public/articles", { params: { page } });
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
    const { data } = await api.post("/public/contact", payload);
    return data;
  },
  async newsletter(email: string) {
    const { data } = await api.post("/public/newsletter", { email });
    return data;
  },
  async gallery(type: GalleryType, page = 1) {
    const { data } = await api.get("/public/gallery", { params: { type, page } });
    return data.data as {
      type: GalleryType;
      label: string;
      items: GalleryWork[];
      meta: Paginated<GalleryWork>["meta"];
    };
  },
};
