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
        $users = DB::table('parcour_group_pivot')
            ->select('user_id as id')
            ->distinct()
            ->orderBy('user_id')
            ->get();

        return response()->json($users);
    }

    /**
     * Get the overall statistics for a single user.
     */
    public function getOverallStats($userId)
    {
        // STEP 1: Get all class IDs the user is enrolled in
        $classIdsCollection = DB::table('parcour_group_pivot as p')
            ->join('parcours_classes as pc', 'p.id_parcour_classes', '=', 'pc.id')
            ->where('p.user_id', $userId)
            ->select('pc.classes')
            ->get();

        $allClassIds = [];
        foreach ($classIdsCollection as $item) {
            $ids = explode(',', $item->classes);
            $allClassIds = array_merge($allClassIds, $ids);
        }
        $uniqueClassIds = array_unique(array_filter($allClassIds));

        // STEP 2: Count all meetings tied to those class IDs
        $total_enrolled_meetings = 0;
        if (!empty($uniqueClassIds)) {
            $total_enrolled_meetings = DB::table('meetings')
                ->whereIn('id_classe', $uniqueClassIds)
                ->count();
        }

        // STEP 3: Count how many distinct meetings this user attended
        $attended_meetings = DB::table('participation_meetings')
            ->where('id_user', $userId)
            ->count(DB::raw('DISTINCT id_meeting'));

        // STEP 4: Calculate personal presence rate
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
     * Get performance details for each meeting the user is enrolled in.
     */
    public function getMeetingPerformance($userId)
{
    // Step 1: Get enrolled meeting IDs for this user
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

    // Step 2: Get meeting data and compute accurate attendance
    $results = DB::table('meetings as m')
        ->whereIn('m.id', $enrolledMeetingIds)
        ->select(
            'm.id',
            'm.titre_fr AS meeting_title',
            'm.id_classe AS class_id',
            DB::raw('(SELECT MAX(pcj.day) FROM planning_cours_journaliers pcj WHERE pcj.id_classe = m.id_classe) as scheduled_day')
        )
        ->orderBy('scheduled_day', 'DESC')
        ->orderBy('m.id', 'DESC')
        ->get();

    $processedResults = collect($results)->map(function ($row) {
        // Step 2.1: Get all parcours_classes that include this class
        $parcourClassIds = DB::table('parcours_classes')
            ->whereRaw('FIND_IN_SET(?, classes)', [$row->class_id])
            ->pluck('id');

        // Step 2.2: Get user IDs enrolled in those parcours_classes
        $enrolledUserIds = DB::table('parcour_group_pivot')
            ->whereIn('id_parcour_classes', $parcourClassIds)
            ->pluck('user_id')
            ->unique();

        // Step 2.3: Count only users who attended and are enrolled
        $attendedUserIds = DB::table('participation_meetings')
            ->where('id_meeting', $row->id)
            ->whereIn('id_user', $enrolledUserIds)
            ->pluck('id_user')
            ->unique();

        $total_enrolled = $enrolledUserIds->count();
        $total_attended = $attendedUserIds->count();

        $class_attendance_rate = 0;
        if ($total_enrolled > 0) {
            $class_attendance_rate = $total_attended / $total_enrolled;
        }

        return [
            'meeting_title' => $row->meeting_title,
            'scheduled_day' => $row->scheduled_day ? (new \DateTime($row->scheduled_day))->format('Y-m-d') : 'N/A',
            'attendees_string' => $total_attended . ' / ' . $total_enrolled,
            'class_attendance_rate' => $class_attendance_rate
        ];
    });

    return response()->json($processedResults);
}

}
