import type { AdminComment, AuditLog, Category, ContactMessage, DashboardStats, EmailCampaign, EmailTemplate, GalleryType, GalleryWork, MediaItem, NewsletterSubscriber, Paginated, Role, SiteSettings, Tag, User } from "../types";
import { api } from "./api";

export const taxonomyService = {
  async categories() {
    const { data } = await api.get("/categories");
    return data.data as Category[];
  },
  async saveCategory(payload: Partial<Category>, id?: number) {
    const { data } = id ? await api.put(`/categories/${id}`, payload) : await api.post("/categories", payload);
    return data.data as Category;
  },
  async deleteCategory(id: number) {
    await api.delete(`/categories/${id}`);
  },
  async tags() {
    const { data } = await api.get("/tags");
    return data.data as Tag[];
  },
  async saveTag(payload: Partial<Tag>, id?: number) {
    const { data } = id ? await api.put(`/tags/${id}`, payload) : await api.post("/tags", payload);
    return data.data as Tag;
  },
  async deleteTag(id: number) {
    await api.delete(`/tags/${id}`);
  },
};

export const mediaService = {
  async list(params: Record<string, unknown>) {
    const { data } = await api.get("/media", { params });
    return data.data as Paginated<MediaItem>;
  },
  async upload(file: File, altText?: string) {
    const form = new FormData();
    form.append("file", file);
    if (altText) form.append("alt_text", altText);
    const { data } = await api.post("/media", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as MediaItem;
  },
  async destroy(id: number) {
    await api.delete(`/media/${id}`);
  },
};

export const galleryService = {
  async list(params: { type: GalleryType; search?: string; page?: number }) {
    const { data } = await api.get("/gallery-works", { params });
    return data.data as Paginated<GalleryWork>;
  },
  async create(payload: FormData) {
    const { data } = await api.post("/gallery-works", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as GalleryWork;
  },
  async update(id: number, payload: FormData) {
    const { data } = await api.post(`/gallery-works/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.data as GalleryWork;
  },
  async destroy(id: number) {
    await api.delete(`/gallery-works/${id}`);
  },
};

export const userService = {
  async list(params: Record<string, unknown>) {
    const { data } = await api.get("/users", { params });
    return data.data as Paginated<User>;
  },
  async save(payload: Record<string, unknown>, id?: number) {
    const { data } = id ? await api.put(`/users/${id}`, payload) : await api.post("/users", payload);
    return data.data as User;
  },
  async destroy(id: number) {
    await api.delete(`/users/${id}`);
  },
};

export const roleService = {
  async list() {
    const { data } = await api.get("/roles");
    return data.data as Role[];
  },
  async updatePermissions(id: number, permission_ids: number[]) {
    const { data } = await api.put(`/roles/${id}/permissions`, { permission_ids });
    return data.data as Role;
  },
};

export const dashboardService = {
  async overview(days = 30) {
    const { data } = await api.get("/dashboard", { params: { days } });
    return data.data as {
      stats: DashboardStats;
      views: { date: string; views: number }[];
      published: { date: string; articles: number }[];
      top: import("../types").Article[];
    };
  },
  async stats() {
    const { data } = await api.get("/dashboard/stats");
    return data.data as DashboardStats;
  },
  async views(days = 30) {
    const { data } = await api.get("/dashboard/views", { params: { days } });
    return data.data as { date: string; views: number }[];
  },
  async published(days = 30) {
    const { data } = await api.get("/dashboard/articles-over-time", { params: { days } });
    return data.data as { date: string; articles: number }[];
  },
  async top() {
    const { data } = await api.get("/dashboard/top-articles");
    return data.data as import("../types").Article[];
  },
};

export const settingsService = {
  async get() {
    const { data } = await api.get("/settings");
    return data.data as SiteSettings;
  },
  async save(payload: SiteSettings) {
    const { data } = await api.put("/settings", payload);
    return data.data as SiteSettings;
  },
  async logs(page = 1) {
    const { data } = await api.get("/audit-logs", { params: { page } });
    return data.data as Paginated<AuditLog>;
  },
};

export const commentService = {
  async list(params: Record<string, unknown> = {}) {
    const { data } = await api.get("/comments", { params });
    return data.data as Paginated<AdminComment>;
  },
  async create(payload: Partial<AdminComment>) {
    const { data } = await api.post("/comments", payload);
    return data.data as AdminComment;
  },
  async update(id: number, payload: Partial<AdminComment>) {
    const { data } = await api.put(`/comments/${id}`, payload);
    return data.data as AdminComment;
  },
  async destroy(id: number) {
    await api.delete(`/comments/${id}`);
  },
};

export const contactMessageService = {
  async list(params: Record<string, unknown> = {}) {
    const { data } = await api.get("/contact-messages", { params });
    return data.data as Paginated<ContactMessage> & { unread_count: number };
  },
  async show(id: number) {
    const { data } = await api.get(`/contact-messages/${id}`);
    return data.data as ContactMessage;
  },
  async markRead(id: number) {
    const { data } = await api.post(`/contact-messages/${id}/read`);
    return data.data as ContactMessage;
  },
  async markUnread(id: number) {
    const { data } = await api.post(`/contact-messages/${id}/unread`);
    return data.data as ContactMessage;
  },
  async destroy(id: number) {
    await api.delete(`/contact-messages/${id}`);
  },
};

export const emailCampaignService = {
  async list(params: Record<string, unknown> = {}) {
    const { data } = await api.get("/email-campaigns", { params });
    return data.data as Paginated<EmailCampaign>;
  },
  async show(id: number) {
    const { data } = await api.get(`/email-campaigns/${id}`);
    return data.data as EmailCampaign;
  },
  async send(payload: {
    name: string;
    email_template_id: number;
    subscriber_ids?: number[];
    emails?: string[];
    scheduled_at?: string | null;
  }) {
    const { data } = await api.post("/email-campaigns", payload);
    return data.data as EmailCampaign;
  },
  async resendFailed(id: number) {
    const { data } = await api.post(`/email-campaigns/${id}/resend-failed`);
    return data.data as EmailCampaign;
  },
  async resendRecipient(campaignId: number, recipientId: number) {
    const { data } = await api.post(`/email-campaigns/${campaignId}/recipients/${recipientId}/resend`);
    return data.data as EmailCampaign;
  },
  async templates() {
    const { data } = await api.get("/email-templates");
    return data.data as EmailTemplate[];
  },
  async createTemplate(payload: Partial<EmailTemplate>) {
    const { data } = await api.post("/email-templates", payload);
    return data.data as EmailTemplate;
  },
  async updateTemplate(id: number, payload: Partial<EmailTemplate>) {
    const { data } = await api.put(`/email-templates/${id}`, payload);
    return data.data as EmailTemplate;
  },
  async deleteTemplate(id: number) {
    await api.delete(`/email-templates/${id}`);
  },
  async previewTemplate(id: number, email?: string) {
    const { data } = await api.post(`/email-templates/${id}/preview`, { email });
    return data.data as { subject: string; html: string };
  },
  async subscribers(params: Record<string, unknown> = {}) {
    const { data } = await api.get("/newsletter-subscribers", { params });
    return data.data as Paginated<NewsletterSubscriber>;
  },
};
