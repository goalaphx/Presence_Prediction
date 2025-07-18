<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MeetingController extends Controller
{
    /**
     * Get a list of all meetings that have enrolled users.
     * This populates the dropdown in the frontend.
     *
     * @return \Illuminate\Http\JsonResponse
     */
        public function index()
    {
        // This query now ensures that each meeting title appears only once.
        $subQuery = DB::table('meetings as m')
            ->select(
                'm.id',
                'm.titre_fr',
                'm.id_classe as class_id',
                DB::raw('ROW_NUMBER() OVER (PARTITION BY m.titre_fr ORDER BY m.id ASC) as rn')
            )
            ->whereNotNull('m.titre_fr')
            ->where('m.titre_fr', '!=', '')
            ->whereExists(function ($query) {
                // Ensure the meeting's class actually has students enrolled
                $query->select(DB::raw(1))
                      ->from('parcours_classes as pc')
                      ->join('parcour_group_pivot as pgp', 'pc.id', '=', 'pgp.id_parcour_classes')
                      ->whereRaw('FIND_IN_SET(m.id_classe, pc.classes)');
            });

        $meetings = DB::table(DB::raw("({$subQuery->toSql()}) as meetings_with_rn"))
            ->mergeBindings($subQuery) // Important: we need to pass the bindings
            ->where('rn', '=', 1)
            ->orderBy('titre_fr')
            ->get();
            
        return response()->json($meetings);
    }
}