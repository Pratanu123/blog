<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ContactMessageController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmailCampaignController;
use App\Http\Controllers\Api\GalleryWorkController;
use App\Http\Controllers\Api\Public\PublicGalleryController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\Public\ContactController;
use App\Http\Controllers\Api\Public\EngagementController;
use App\Http\Controllers\Api\Public\HomeController;
use App\Http\Controllers\Api\Public\PublicArticleController;
use App\Http\Controllers\Api\Public\PublicTaxonomyController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::prefix('public')->group(function () {
    Route::get('homepage', HomeController::class);
    Route::get('settings', [HomeController::class, 'settings']);
    Route::get('articles', [PublicArticleController::class, 'index']);
    Route::get('articles/{slug}', [PublicArticleController::class, 'show']);
    Route::get('categories', [PublicTaxonomyController::class, 'categories']);
    Route::get('categories/{slug}', [PublicTaxonomyController::class, 'category']);
    Route::get('tags', [PublicTaxonomyController::class, 'tags']);
    Route::get('tags/{slug}', [PublicTaxonomyController::class, 'tag']);
    Route::get('authors/{slug}', [PublicTaxonomyController::class, 'author']);
    Route::post('contact', [ContactController::class, 'contact'])->middleware('throttle:20,1');
    Route::post('newsletter', [ContactController::class, 'newsletter'])->middleware('throttle:20,1');
    Route::get('gallery', [PublicGalleryController::class, 'index']);
    Route::get('engagement/{type}/{id}', [EngagementController::class, 'show'])->middleware('throttle:120,1');
    Route::post('engagement/{type}/{id}/comments', [EngagementController::class, 'storeComment'])->middleware('throttle:30,1');
    Route::post('engagement/{type}/{id}/like', [EngagementController::class, 'toggleLike'])->middleware('throttle:60,1');
});

Route::get('search', SearchController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'overview']);
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/views', [DashboardController::class, 'views']);
    Route::get('dashboard/articles-over-time', [DashboardController::class, 'publishedOverTime']);
    Route::get('dashboard/top-articles', [DashboardController::class, 'topArticles']);

    Route::get('articles', [ArticleController::class, 'index']);
    Route::post('articles', [ArticleController::class, 'store']);
    Route::post('articles/bulk', [ArticleController::class, 'bulk']);
    Route::get('articles/{article}', [ArticleController::class, 'show']);
    Route::put('articles/{article}', [ArticleController::class, 'update']);
    Route::delete('articles/{article}', [ArticleController::class, 'destroy']);
    Route::post('articles/{article}/publish', [ArticleController::class, 'publish']);
    Route::post('articles/{article}/schedule', [ArticleController::class, 'schedule']);
    Route::post('articles/{article}/archive', [ArticleController::class, 'archive']);
    Route::post('articles/{article}/unarchive', [ArticleController::class, 'unarchive']);
    Route::post('articles/{article}/duplicate', [ArticleController::class, 'duplicate']);
    Route::get('articles/{article}/revisions', [ArticleController::class, 'revisions']);
    Route::get('articles/{article}/revisions/{revision}', [ArticleController::class, 'showRevision']);
    Route::post('articles/{article}/revisions/{revision}/restore', [ArticleController::class, 'restoreRevision']);

    Route::get('categories', [CategoryController::class, 'index']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

    Route::get('tags', [TagController::class, 'index']);
    Route::post('tags', [TagController::class, 'store']);
    Route::put('tags/{tag}', [TagController::class, 'update']);
    Route::delete('tags/{tag}', [TagController::class, 'destroy']);

    Route::get('media', [MediaController::class, 'index']);
    Route::post('media', [MediaController::class, 'store']);
    Route::put('media/{medium}', [MediaController::class, 'update']);
    Route::delete('media/{medium}', [MediaController::class, 'destroy']);

    Route::get('gallery-works', [GalleryWorkController::class, 'index']);
    Route::post('gallery-works', [GalleryWorkController::class, 'store']);
    Route::post('gallery-works/{galleryWork}', [GalleryWorkController::class, 'update']);
    Route::delete('gallery-works/{galleryWork}', [GalleryWorkController::class, 'destroy']);

    Route::get('comments', [CommentController::class, 'index']);
    Route::post('comments', [CommentController::class, 'store']);
    Route::put('comments/{contentComment}', [CommentController::class, 'update']);
    Route::delete('comments/{contentComment}', [CommentController::class, 'destroy']);

    Route::get('contact-messages', [ContactMessageController::class, 'index']);
    Route::get('contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);
    Route::post('contact-messages/{contactMessage}/read', [ContactMessageController::class, 'markRead']);
    Route::post('contact-messages/{contactMessage}/unread', [ContactMessageController::class, 'markUnread']);
    Route::delete('contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy']);

    Route::get('email-campaigns', [EmailCampaignController::class, 'index']);
    Route::post('email-campaigns', [EmailCampaignController::class, 'store']);
    Route::get('email-campaigns/{emailCampaign}', [EmailCampaignController::class, 'show']);
    Route::post('email-campaigns/{emailCampaign}/resend-failed', [EmailCampaignController::class, 'resendFailed']);
    Route::post('email-campaigns/{emailCampaign}/recipients/{recipient}/resend', [EmailCampaignController::class, 'resendRecipient']);
    Route::get('email-templates', [EmailCampaignController::class, 'templates']);
    Route::post('email-templates', [EmailCampaignController::class, 'storeTemplate']);
    Route::put('email-templates/{emailTemplate}', [EmailCampaignController::class, 'updateTemplate']);
    Route::delete('email-templates/{emailTemplate}', [EmailCampaignController::class, 'destroyTemplate']);
    Route::post('email-templates/{emailTemplate}/preview', [EmailCampaignController::class, 'previewTemplate']);
    Route::get('newsletter-subscribers', [EmailCampaignController::class, 'subscribers']);

    Route::get('users', [UserController::class, 'index']);
    Route::post('users', [UserController::class, 'store']);
    Route::put('users/{user}', [UserController::class, 'update']);
    Route::delete('users/{user}', [UserController::class, 'destroy']);

    Route::get('roles', [RoleController::class, 'index']);
    Route::get('permissions', [RoleController::class, 'permissions']);
    Route::put('roles/{role}/permissions', [RoleController::class, 'updatePermissions']);

    Route::get('settings', [SettingController::class, 'index']);
    Route::put('settings', [SettingController::class, 'update']);

    Route::get('audit-logs', [AuditLogController::class, 'index']);
});
