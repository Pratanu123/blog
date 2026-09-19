import type { Article, ArticleRevision, Paginated } from "../types";
import { api } from "./api";

export const articleService = {
  async list(params: Record<string, unknown>) {
    const { data } = await api.get("/articles", { params });
    return data.data as Paginated<Article>;
  },
  async get(id: number) {
    const { data } = await api.get(`/articles/${id}`);
    return data.data as Article;
  },
  async save(payload: Record<string, unknown>, id?: number) {
    const { data } = id ? await api.put(`/articles/${id}`, payload) : await api.post("/articles", payload);
    return data.data as Article;
  },
  async destroy(id: number) {
    await api.delete(`/articles/${id}`);
  },
  async publish(id: number) {
    const { data } = await api.post(`/articles/${id}/publish`);
    return data.data as Article;
  },
  async schedule(id: number, scheduled_at: string) {
    const { data } = await api.post(`/articles/${id}/schedule`, { scheduled_at });
    return data.data as Article;
  },
  async archive(id: number) {
    const { data } = await api.post(`/articles/${id}/archive`);
    return data.data as Article;
  },
  async duplicate(id: number) {
    const { data } = await api.post(`/articles/${id}/duplicate`);
    return data.data as Article;
  },
  async bulk(action: string, ids: number[]) {
    const { data } = await api.post("/articles/bulk", { action, ids });
    return data.data as { count: number };
  },
  async revisions(id: number) {
    const { data } = await api.get(`/articles/${id}/revisions`);
    return data.data as ArticleRevision[];
  },
  async restoreRevision(articleId: number, revisionId: number) {
    const { data } = await api.post(`/articles/${articleId}/revisions/${revisionId}/restore`);
    return data.data as Article;
  },
};
