<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Finds students whose overall attendance rate is below a given threshold.
     */
    // In app/Http/Controllers/Api/AnalyticsController.php

public function getAtRiskStudents(Request $request)
{
    // Get the threshold from the request, with a default of 60%
    $threshold = (float) $request->input('threshold', 0.60);
    
    // Get the minimum meetings from the request, with a default of 5
    $minMeetings = (int) $request->input('minMeetings', 5);

    // This query now uses both dynamic parameters to filter the results.
    $atRiskStudents = DB::select("
        SELECT
            p.user_id,
            COUNT(m.id) AS enrolled_meetings,
            COUNT(pm.id) AS attended_meetings,
            (COUNT(pm.id) / COUNT(m.id)) AS overall_rate
        FROM
            parcour_group_pivot p
        JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
        JOIN classes c ON FIND_IN_SET(c.id, pc.classes) > 0
        JOIN meetings m ON m.id_classe = c.id
        LEFT JOIN participation_meetings pm ON m.id = pm.id_meeting AND p.user_id = pm.id_user
        GROUP BY
            p.user_id
        HAVING
            overall_rate < ?
            AND enrolled_meetings >= ?  -- <<< NOW A DYNAMIC PARAMETER
        ORDER BY
            overall_rate ASC;
    ", [$threshold, $minMeetings]); // <-- Pass both values to the query

    return response()->json($atRiskStudents);
}
}