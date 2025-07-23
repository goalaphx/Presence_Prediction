<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardStatsController extends Controller
{
    // In app/Http/Controllers/Api/DashboardStatsController.php

// In app/Http/Controllers/Api/DashboardStatsController.php

public function getSystemOverview()
{
    // The other stats queries are likely correct, we will leave them.
    $total_students = DB::table('parcour_group_pivot as pgp')
        ->join('parcours_classes as pc', 'pgp.id_parcour_classes', '=', 'pc.id')
        ->join('classes as c', DB::raw('find_in_set(c.id, pc.classes)'), '>', DB::raw('0'))
        ->whereExists(function ($query) {
            $query->select(DB::raw(1))
                    ->from('meetings as m')
                    ->whereRaw('m.id_classe = c.id');
        })
        ->distinct('pgp.user_id')
        ->count('pgp.user_id');

    $total_classes = DB::table('cours as co')
        ->whereExists(function ($query) {
            $query->select(DB::raw(1))
                    ->from('classes as c')
                    ->whereRaw('c.id_cours = co.id')
                    ->whereExists(function ($subQuery1) {
                        $subQuery1->select(DB::raw(1))
                                ->from('meetings as m')
                                ->whereRaw('m.id_classe = c.id');
                    })
                    ->whereExists(function ($subQuery2) {
                        $subQuery2->select(DB::raw(1))
                                ->from('parcours_classes as pc')
                                ->join('parcour_group_pivot as pgp', 'pc.id', '=', 'pgp.id_parcour_classes')
                                ->whereRaw('find_in_set(c.id, pc.classes)');
                    });
        })
        ->count('co.id');

    $total_meetings_held = DB::table('meetings')->count('id');

    // ===================================================================
    // === NEW ATTENDANCE RATE CALCULATION WITH LOGGING                ===
    // ===================================================================

    // STEP 1: Calculate the NUMERATOR (Actual Participations)
    // We count DISTINCT pairs of meeting and user to prevent duplicates from inflating the count.
    $total_actual_participations = DB::table('participation_meetings')
                                     ->distinct()
                                     ->count(DB::raw('CONCAT(id_meeting, "-", id_user)'));

    // STEP 2: Calculate the DENOMINATOR (Potential Participations)
    // This subquery calculates the number of distinct students enrolled for each meeting.
    $enrollments_per_meeting_query = DB::table('meetings as m')
        ->select('m.id as meeting_id', DB::raw('COUNT(DISTINCT p.user_id) as student_count'))
        ->join('classes as c', 'm.id_classe', '=', 'c.id')
        ->join('parcours_classes as pc', DB::raw('FIND_IN_SET(c.id, pc.classes)'), '>', DB::raw('0'))
        ->join('parcour_group_pivot as p', 'pc.id', '=', 'p.id_parcour_classes')
        ->groupBy('m.id');
    
    // We then wrap that subquery and SUM the student counts across all meetings.
    $total_potential_participations = DB::table(DB::raw("({$enrollments_per_meeting_query->toSql()}) as enrollments"))
        ->mergeBindings($enrollments_per_meeting_query)
        ->sum('student_count');
    
    // STEP 3: LOG THE RAW NUMBERS FOR DEBUGGING
    // This is the most important part of this fix.
    \Illuminate\Support\Facades\Log::info('--- Dashboard Attendance Calculation ---');
    \Illuminate\Support\Facades\Log::info('Numerator (Actual Distinct Participations): ' . $total_actual_participations);
    \Illuminate\Support\Facades\Log::info('Denominator (Total Potential Participations): ' . $total_potential_participations);

    // STEP 4: Calculate the final rate
    $overall_attendance_rate = 0;
    if ($total_potential_participations > 0) {
        $overall_attendance_rate = $total_actual_participations / $total_potential_participations;
    }

    return response()->json([
        'total_students' => $total_students,
        'total_classes' => $total_classes,
        'total_meetings_held' => $total_meetings_held,
        'overall_attendance_rate' => round($overall_attendance_rate, 4)
    ]);
}
}