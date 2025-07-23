<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class ModelController extends Controller
{
    /**
     * Triggers the Python model training script as a background process.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function retrain()
    {
        try {
            $pythonPath = env('PYTHON_PATH', 'python');
            $scriptPath = base_path('scripts/python/train_model.py');
            $scriptDir = dirname($scriptPath);

            // Check if the script exists before trying to run it
            if (!file_exists($scriptPath)) {
                Log::error('Model training script not found at: ' . $scriptPath);
                return response()->json(['message' => 'Training script not found on the server.'], 404);
            }

            // Create a process that will run the Python script.
            // We set the working directory to the script's location so that it saves
            // the .pkl file in the correct place.
            $process = new Process([$pythonPath, $scriptPath], $scriptDir);
            
            // Set a long timeout to prevent the process from being killed prematurely.
            // E.g., 10 minutes (600 seconds). Adjust as needed.
            $process->setTimeout(600);

            // Run the process. We are NOT running this in the background for simplicity now,
            // but we will return a response immediately after it's done.
            // For a true background task, you would use Laravel Queues.
            $process->run();

            if ($process->isSuccessful()) {
                Log::info('Model retraining process completed successfully.');
                Log::info('Python Script Output: ' . $process->getOutput());
                return response()->json(['message' => 'Model retraining completed successfully!']);
            } else {
                // Log the error output from the script for debugging
                $errorOutput = $process->getErrorOutput();
                Log::error('Model retraining process failed.');
                Log::error('Python Script Error Output: ' . $errorOutput);
                return response()->json(['message' => 'Model retraining failed. Check server logs for details.', 'error' => $errorOutput], 500);
            }

        } catch (\Exception $e) {
            Log::error('Exception caught while trying to retrain model: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected server error occurred.'], 500);
        }
    }
}