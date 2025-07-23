<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserAnalyticsController extends Controller
{
    /**
     * Get a list of all users for the analytics dropdown.
     */
    public function index()
    {
        // This function is simple and correct. No changes needed.
        $users = DB::table('parcour_group_pivot')
            ->select('user_id as id')
            ->distinct()
            ->orderBy('user_id')
            ->get();
        
        return response()->json($users);
    }

    /**
     * Get the overall statistics for a single user.
     * This is a completely reworked function to guarantee correct counts.
     */
    public function getOverallStats($userId)
    {
        // STEP 1: Get a definitive, clean list of all class IDs this user is enrolled in.
        $classIdsCollection = DB::table('parcour_group_pivot as p')
            ->join('parcours_classes as pc', 'p.id_parcour_classes', '=', 'pc.id')
            ->where('p.user_id', $userId)
            ->select('pc.classes') // e.g., "101,102,103"
            ->get();

        $allClassIds = [];
        foreach ($classIdsCollection as $item) {
            $ids = explode(',', $item->classes);
            $allClassIds = array_merge($allClassIds, $ids);
        }
        $uniqueClassIds = array_unique(array_filter($allClassIds));

        // STEP 2: Count all meetings associated with those exact class IDs.
        // This is the true number of sessions the user was supposed to attend.
        $total_enrolled_meetings = 0;
        if (!empty($uniqueClassIds)) {
            $total_enrolled_meetings = DB::table('meetings')
                ->whereIn('id_classe', $uniqueClassIds)
                ->count();
        }

        // STEP 3: Count how many meetings this user actually has a participation record for.
        $attended_meetings = DB::table('participation_meetings')
            ->where('id_user', $userId)
            // We count distinct meetings to avoid issues if a user has multiple entries for one session.
            ->count(DB::raw('DISTINCT id_meeting'));

        $rate = 0;
        if ($total_enrolled_meetings > 0) {
            $rate = $attended_meetings / $total_enrolled_meetings;
        }

        return response()->json([
            'total_enrolled_meetings' => $total_enrolled_meetings,
            'attended_meetings' => $attended_meetings,
            'personal_presence_rate' => $rate
        ]);
    }

    /**
     * Get the detailed performance for each meeting a user was enrolled in.
     * This version is also completely reworked for correctness.
     */
    public function getMeetingPerformance($userId)
    {
        // Get a clean list of all meeting IDs the user is enrolled in.
        $enrolledMeetingIds = DB::table('parcour_group_pivot as p')
            ->join('parcours_classes as pc', 'p.id_parcour_classes', '=', 'pc.id')
            ->join('classes as c', DB::raw('FIND_IN_SET(c.id, pc.classes)'), '>', DB::raw('0'))
            ->join('meetings as m', 'm.id_classe', '=', 'c.id')
            ->where('p.user_id', '=', $userId)
            ->select('m.id')
            ->distinct()
            ->pluck('id');

        if ($enrolledMeetingIds->isEmpty()) {
            return response()->json([]);
        }

        // Now, for that clean list of meetings, get their details safely.
        $results = DB::table('meetings as m')
            ->whereIn('m.id', $enrolledMeetingIds)
            ->select(
                'm.titre_fr AS meeting_title',
                'm.id_classe AS class_id',
                DB::raw('(SELECT MAX(pcj.day) FROM planning_cours_journaliers pcj WHERE pcj.id_classe = m.id_classe) as scheduled_day'),
                DB::raw('(SELECT COUNT(DISTINCT id_user) FROM participation_meetings WHERE id_meeting = m.id) AS total_attended')
            )
            ->orderBy('scheduled_day', 'DESC')
            ->orderBy('m.id', 'DESC')
            ->get();
        
        $resultsArray = $results->all();

        $processedResults = array_map(function($row) {
            // Run a separate, clean query to get the total number of students enrolled in this specific class.
            $total_enrolled = DB::table('parcour_group_pivot as p')
                ->join('parcours_classes as pc', 'p.id_parcour_classes', '=', 'pc.id')
                ->whereRaw('FIND_IN_SET(?, pc.classes)', [$row->class_id])
                ->count(DB::raw('DISTINCT p.user_id'));
            
            $class_attendance_rate = 0;
            if ($total_enrolled > 0) {
                // Defensive check: attended count can't be more than enrolled count.
                $attended = min($row->total_attended, $total_enrolled);
                $class_attendance_rate = $attended / $total_enrolled;
            }

            return [
                'meeting_title' => $row->meeting_title,
                'scheduled_day' => $row->scheduled_day ? (new \DateTime($row->scheduled_day))->format('Y-m-d') : 'N/A',
                'attendees_string' => $row->total_attended . ' / ' . $total_enrolled,
                'class_attendance_rate' => $class_attendance_rate
            ];
        }, $resultsArray);

        return response()->json($processedResults);
    }
}