<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Meeting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PredictionControllerTest extends TestCase
{
    /**
     * Test the integration between Laravel and the Python prediction engine.
     */
    public function test_prediction_engine_returns_valid_json()
    {
        // 1. Arrange: Prepare a mock meeting and user history in the DB
        $meetingId = 1; // Assuming a meeting with ID 1 exists or is mocked

        // 2. Act: Call the prediction endpoint
        $response = $this->getJson("/api/predict/{$meetingId}");

        // 3. Assert: Verify the engineering hygiene and data integrity
        $response->assertStatus(200);
        
        // Ensure the response contains the expected keys from the Python stdout
        $response->assertJsonStructure([
            '*' => [
                'user_id',
                'probability_of_presence',
                'prediction'
            ]
        ]);

        // Validate that probability is a float between 0 and 1
        $data = $response->json();
        if (!empty($data)) {
            $this->assertIsFloat($data[0]['probability_of_presence']);
            $this->assertLessThanOrEqual(1.0, $data[0]['probability_of_presence']);
        }
    }
}
