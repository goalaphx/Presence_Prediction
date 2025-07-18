<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\UserAnalyticsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// --- Prediction Endpoints ---
Route::get('/predict/meeting/{meeting}', [PredictionController::class, 'predictForMeeting'])->where('meeting', '[0-9]+');

// --- Meeting Endpoints ---
Route::get('/meetings', [MeetingController::class, 'index']);

// --- User Analytics Endpoints ---
Route::get('/users', [UserAnalyticsController::class, 'index']);
Route::get('/users/{user}/stats', [UserAnalyticsController::class, 'getOverallStats'])->where('user', '[0-9]+');
Route::get('/users/{user}/meeting-performance', [UserAnalyticsController::class, 'getMeetingPerformance'])->where('user', '[0-9]+');