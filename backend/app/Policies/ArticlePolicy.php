<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('articles.view');
    }

    public function view(User $user, Article $article): bool
    {
        if (! $user->hasPermission('articles.view')) {
            return false;
        }

        return ! $user->isAuthorRole() || $article->author_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('articles.create');
    }

    public function update(User $user, Article $article): bool
    {
        if (! $user->hasPermission('articles.edit')) {
            return false;
        }

        return ! $user->isAuthorRole() || $article->author_id === $user->id;
    }

    public function delete(User $user, Article $article): bool
    {
        if (! $user->hasPermission('articles.delete')) {
            return false;
        }

        return ! $user->isAuthorRole() || $article->author_id === $user->id;
    }

    public function publish(User $user, ?Article $article = null): bool
    {
        if (! $user->hasPermission('articles.publish')) {
            return false;
        }

        return ! $article || ! $user->isAuthorRole() || $article->author_id === $user->id;
    }
}
