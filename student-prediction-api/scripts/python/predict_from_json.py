import sys
import os
import json
import pandas as pd
import pickle

def print_json_error(message):
    """Prints a structured JSON error message and exits."""
    print(json.dumps({"error": True, "message": message}))
    sys.exit(1)

def main():
    """
    Loads the model and predicts attendance based on JSON data read from standard input.
    """
    try:
        # Read the complete JSON data from the standard input stream.
        # This is the most robust way to receive large amounts of data.
        feature_data_json = sys.stdin.read()
        
        # If the input is empty for some reason, exit gracefully.
        if not feature_data_json:
            print(json.dumps([]))
            return

        # Load the input data from the JSON string into a DataFrame.
        input_df = pd.read_json(feature_data_json, orient='records')

        if input_df.empty:
            print(json.dumps([])) # Return empty array if no users were passed
            return
            
        # Load the pre-trained model (using pickle).
        model_path = os.path.join(os.path.dirname(__file__), 'attendance_model.pkl')
        if not os.path.exists(model_path):
             raise FileNotFoundError(f"Model file not found at {model_path}")

        with open(model_path, 'rb') as file:
            model = pickle.load(file)

        # Define the exact feature order the model was trained on. This is critical.
        features_for_prediction = [
            "user_id", "class_id", "course_id", "id_matiere", "id_professeur",
            "meeting_weekday", "meeting_hour", "user_attendance_rate", "user_total_meetings"
        ]
        
        # Ensure all required columns are present in the DataFrame from Laravel.
        for col in features_for_prediction:
            if col not in input_df.columns:
                raise ValueError(f"Missing required feature column in JSON data: {col}")

        # Prepare the data for prediction.
        X = input_df[features_for_prediction]

        # Make predictions.
        predictions = model.predict(X)
        probas = model.predict_proba(X)[:, 1] # Probability of the '1' class (present)

        # Format and print the final JSON output to standard output.
        results_df = input_df[['user_id']].copy()
        results_df["probability_of_presence"] = probas
        results_df["prediction"] = predictions.tolist()
        print(results_df.to_json(orient="records"))

    except Exception as e:
        print_json_error(f"Error in Python prediction script: {str(e)}")

if __name__ == "__main__":
    # The script now takes NO command-line arguments and just runs main.
    main()