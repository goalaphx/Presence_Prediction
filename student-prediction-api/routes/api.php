<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\UserAnalyticsController;
use App\Http\Controllers\Api\DashboardStatsController;
use App\Http\Controllers\Api\AnalyticsController;

use App\Http\Controllers\Api\ModelController; 


Route::post('/model/retrain', [ModelController::class, 'retrain']);

// --- Existing Core Routes ---
Route::get('/predict/meeting/{meeting}', [PredictionController::class, 'predictForMeeting'])->where('meeting', '[0-9]+');
Route::get('/meetings', [MeetingController::class, 'index']);
Route::get('/users', [UserAnalyticsController::class, 'index']);
Route::get('/users/{user}/stats', [UserAnalyticsController::class, 'getOverallStats'])->where('user', '[0-9]+');
Route::get('/users/{user}/meeting-performance', [UserAnalyticsController::class, 'getMeetingPerformance'])->where('user', '[0-9]+');


// --- NEW DASHBOARD & ANALYTICS ROUTES ---
Route::get('/stats/overview', [DashboardStatsController::class, 'getSystemOverview']);
Route::get('/analytics/students/at-risk', [AnalyticsController::class, 'getAtRiskStudents']);

