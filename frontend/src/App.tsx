import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { HomePage } from "./pages/public/HomePage";
import { BlogIndexPage } from "./pages/public/BlogIndexPage";
import { ArticlePage } from "./pages/public/ArticlePage";
import { TaxonomyPage } from "./pages/public/TaxonomyPage";
import { SearchPage } from "./pages/public/SearchPage";
import { AboutPage } from "./pages/public/AboutPage";
import { AboutMePage } from "./pages/public/AboutMePage";
import { ContactPage } from "./pages/public/ContactPage";
import { PhotographyPage, PaintingPage } from "./pages/public/GalleryPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { ArticlesPage } from "./pages/admin/ArticlesPage";
import { ArticleEditorPage } from "./pages/admin/ArticleEditorPage";
import { CategoriesPage, TagsPage } from "./pages/admin/TaxonomyPages";
import { MediaPage } from "./pages/admin/MediaPage";
import { PhotographyAdminPage, PaintingAdminPage } from "./pages/admin/GalleryAdminPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { RolesPage } from "./pages/admin/RolesPage";
import { AnalyticsPage } from "./pages/admin/AnalyticsPage";
import { CommentsPage } from "./pages/admin/CommentsPage";
import { ContactMessagesPage } from "./pages/admin/ContactMessagesPage";
import { EmailCampaignsPage } from "./pages/admin/EmailCampaignsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<ArticlePage />} />
        <Route path="/photography" element={<PhotographyPage />} />
        <Route path="/painting" element={<PaintingPage />} />
        <Route path="/category/:slug" element={<TaxonomyPage kind="category" />} />
        <Route path="/tag/:slug" element={<TaxonomyPage kind="tag" />} />
        <Route path="/author/:slug" element={<TaxonomyPage kind="author" />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/about-me" element={<AboutMePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/new" element={<ArticleEditorPage />} />
        <Route path="articles/:id" element={<ArticleEditorPage />} />
        <Route path="photography" element={<PhotographyAdminPage />} />
        <Route path="painting" element={<PaintingAdminPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="messages" element={<ContactMessagesPage />} />
        <Route path="campaigns" element={<EmailCampaignsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
