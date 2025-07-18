<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class PredictionController extends Controller
{
    /**
     * Gathers all necessary features from the database, passes them via stdin to a Python
     * script for prediction, and returns the results.
     *
     * @param int $meetingId
     * @return \Illuminate\Http\JsonResponse
     */
    public function predictForMeeting($meetingId)
    {
        try {
            // --- Step 1: Get Basic Meeting and Class Info ---
            $meeting = DB::table('meetings')->where('id', $meetingId)->first();
            if (!$meeting) {
                return response()->json(['message' => 'Meeting not found.'], 404);
            }
            $classId = $meeting->id_classe;

            // --- Step 2: Get All Users Enrolled in the Class ---
            $enrolledUsers = DB::select("
                SELECT p.user_id, c.id_cours AS course_id, c.id_professeur, co.id_matiere
                FROM parcour_group_pivot p
                JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
                JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
                JOIN cours co ON c.id_cours = co.id
                WHERE c.id = ?
            ", [$classId]);

            if (empty($enrolledUsers)) {
                return response()->json([]);
            }

            // --- Step 3: Get User Attendance History for all enrolled users ---
            $userIds = array_map(fn($user) => $user->user_id, $enrolledUsers);
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $history = DB::select("
                SELECT p.user_id, COUNT(m.id) as user_total_meetings, COUNT(pm.id) as attended_meetings
                FROM parcour_group_pivot p
                JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
                JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
                JOIN meetings m ON m.id_classe = c.id
                LEFT JOIN participation_meetings pm ON m.id = pm.id_meeting AND p.user_id = pm.id_user
                WHERE p.user_id IN ($placeholders)
                GROUP BY p.user_id
            ", $userIds);

            $historyMap = [];
            foreach ($history as $h) {
                $historyMap[$h->user_id] = $h;
            }
            
            // --- Step 4: Get the Schedule Info for the specific meeting ---
            $schedule = DB::table('meetings as m')
                ->join('planning_cours_journaliers as pcj', 'm.id_classe', '=', 'pcj.id_classe')
                ->where('m.id', $meetingId)
                ->select('pcj.day as scheduled_day', 'pcj.heure_from as scheduled_hour')
                ->orderBy('pcj.day', 'desc')
                ->first();
            
            // --- Step 5: Assemble the Final Feature Set for Each User ---
            $featureSet = [];
            foreach ($enrolledUsers as $user) {
                $userHistory = $historyMap[$user->user_id] ?? null;
                $totalMeetings = $userHistory ? (int)$userHistory->user_total_meetings : 0;
                $attendedMeetings = $userHistory ? (int)$userHistory->attended_meetings : 0;
                $attendanceRate = $totalMeetings > 0 ? $attendedMeetings / $totalMeetings : 0.5;
                $meeting_weekday = $schedule && $schedule->scheduled_day ? (new \DateTime($schedule->scheduled_day))->format('w') : 0;
                $meeting_hour = $schedule && $schedule->scheduled_hour ? (int)explode(':', $schedule->scheduled_hour)[0] : 0;

                $featureSet[] = [
                    'user_id' => $user->user_id,
                    'class_id' => $classId,
                    'course_id' => $user->course_id,
                    'id_matiere' => $user->id_matiere,
                    'id_professeur' => $user->id_professeur,
                    'meeting_weekday' => $meeting_weekday,
                    'meeting_hour' => $meeting_hour,
                    'user_attendance_rate' => $attendanceRate,
                    'user_total_meetings' => $totalMeetings,
                ];
            }
            
            // --- Step 6: Execute the "Pure" Python Script using stdin ---
            $pythonPath = config('app.python_path');
            $scriptPath = str_replace('\\', '/', base_path('scripts/python/predict_from_json.py'));
            $jsonData = json_encode($featureSet);
            
            // Create the process with NO command-line arguments for the data.
            $process = new Process([$pythonPath, $scriptPath]);
            
            // Provide the JSON data to the script via its standard input.
            $process->setInput($jsonData);
            
            $process->run();

            if (!$process->isSuccessful()) {
                throw new ProcessFailedException($process);
            }
            
            $output = $process->getOutput();
            $decodedOutput = json_decode($output, true);

            if (isset($decodedOutput['error']) && $decodedOutput['error']) {
                throw new \Exception('Python script returned an error: ' . $decodedOutput['message']);
            }
            
            return response()->json($decodedOutput);

        } catch (\Exception $e) {
            Log::error('Prediction Process Failed: ' . $e->getMessage());
            if ($e instanceof ProcessFailedException) {
                Log::error('Python STDOUT: ' . $e->getProcess()->getOutput());
                Log::error('Python STDERR: ' . $e->getProcess()->getErrorOutput());
            }
            return response()->json(['message' => 'The prediction engine encountered a critical error. Please check system logs.'], 500);
        }
    }
}