<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserAnalyticsController extends Controller
{
    /**
     * Get a list of all users for the analytics dropdown.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $users = DB::table('parcour_group_pivot')
            ->select('user_id as id')
            ->distinct()
            ->orderBy('user_id')
            ->get();
        
        return response()->json($users);
    }

    /**
     * Get the overall statistics for a single user.
     * (Total meetings, attended, rate).
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getOverallStats($userId)
    {
        $stats = DB::table('parcour_group_pivot as p')
            ->select(
                DB::raw('COUNT(m.id) AS total_meetings'),
                DB::raw('COUNT(pm.id) AS attended_meetings')
            )
            ->join('parcours_classes as pc', 'p.id_parcour_classes', '=', 'pc.id')
            ->join('classes as c', DB::raw('FIND_IN_SET(c.id, pc.classes)'), '>', DB::raw('0'))
            ->join('meetings as m', 'm.id_classe', '=', 'c.id')
            ->leftJoin('participation_meetings as pm', function ($join) use ($userId) {
                $join->on('m.id', '=', 'pm.id_meeting')
                     ->on('p.user_id', '=', 'pm.id_user');
            })
            ->where('p.user_id', '=', $userId)
            ->first();

        $rate = 0;
        if ($stats && $stats->total_meetings > 0) {
            $rate = $stats->attended_meetings / $stats->total_meetings;
        }

        return response()->json([
            'total_enrolled_meetings' => (int)($stats->total_meetings ?? 0),
            'attended_meetings' => (int)($stats->attended_meetings ?? 0),
            'personal_presence_rate' => $rate
        ]);
    }

    /**
     * Get the detailed performance for each meeting a user was enrolled in.
     *
     * @param int $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMeetingPerformance($userId)
    {
        $results = DB::select("
            WITH MeetingScheduleLink AS (
                SELECT
                    pm.id_meeting,
                    MAX(pcj.day) AS scheduled_day,
                    MAX(pcj.heure_from) AS scheduled_hour
                FROM participation_meetings pm
                JOIN meetings m ON pm.id_meeting = m.id
                JOIN planning_cours_journaliers pcj ON m.id_classe = pcj.id_classe AND DATE(pm.entree) = pcj.day
                GROUP BY pm.id_meeting
            )
            SELECT
                m.titre_fr AS meeting_title,
                msl.scheduled_day,
                msl.scheduled_hour,
                (SELECT COUNT(DISTINCT id_user) FROM participation_meetings WHERE id_meeting = m.id) AS total_attended,
                (SELECT COUNT(DISTINCT p_inner.user_id) FROM parcour_group_pivot p_inner JOIN parcours_classes pc_inner ON p_inner.id_parcour_classes = pc_inner.id WHERE FIND_IN_SET(c.id, pc_inner.classes)) AS total_enrolled
            FROM parcour_group_pivot p
            JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
            JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
            JOIN meetings m ON m.id_classe = c.id
            LEFT JOIN MeetingScheduleLink msl ON m.id = msl.id_meeting
            WHERE p.user_id = ?
            ORDER BY m.id DESC;
        ", [$userId]);

        $processedResults = array_map(function($row) {
            $class_attendance_rate = 0;
            if ($row->total_enrolled > 0) {
                $class_attendance_rate = $row->total_attended / $row->total_enrolled;
            }

            return [
                'meeting_title' => $row->meeting_title,
                'scheduled_day' => $row->scheduled_day ? (new \DateTime($row->scheduled_day))->format('Y-m-d') : 'N/A',
                'scheduled_time' => $row->scheduled_hour ? substr((string)$row->scheduled_hour, 0, 5) : 'N/A',
                'attendees_string' => $row->total_attended . ' / ' . $row->total_enrolled,
                'class_attendance_rate' => $class_attendance_rate
            ];
        }, $results);

        return response()->json($processedResults);
    }
}