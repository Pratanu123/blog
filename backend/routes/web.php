<?php

use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('/robots.txt', [SeoController::class, 'robots']);
Route::get('/feed.xml', [SeoController::class, 'feed']);
Route::get('/{file}', [SeoController::class, 'googleVerification'])
    ->where('file', 'google[0-9a-z]+\.html');
