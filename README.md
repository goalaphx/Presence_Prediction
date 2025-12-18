# Student Presence Prediction

## Project Overview

This project is a web application designed to predict student presence in meetings. It uses a machine learning model to make predictions based on historical data. The application consists of a React-based frontend, a Laravel-based backend API, and a Python-based machine learning model.

## Architecture

The project follows a 3-tier architecture:

-   **Frontend:** A single-page application (SPA) built with React, responsible for the user interface and user interaction.
-   **Backend:** A RESTful API built with Laravel (PHP), which handles business logic, data processing, and communication with the machine learning model.
-   **Data Store:** A relational database (likely MySQL, as is common with Laravel) to store application data like users and meetings. The trained machine learning model is stored as a `.pkl` file.

## Folder Structure

The project is organized into three main directories:

-   `student-prediction-ui/`: Contains the React frontend application.
-   `student-prediction-api/`: Contains the Laravel backend API.
-   `pred_train/`: Contains scripts for training the prediction model.

## Technology Choices

-   **Frontend:**
    -   React
    -   Vite for frontend tooling
    -   `axios` for making HTTP requests to the backend API.
-   **Backend:**
    -   Laravel (PHP)
    -   Composer for PHP package management.
-   **Machine Learning:**
    -   Python
    -   `scikit-learn` for building the prediction model.
    -   `pandas` for data manipulation.
    -   The backend communicates with Python scripts via `Symfony/Process` component, passing data through standard input (stdin).

## Backend Logic

The Laravel backend exposes a REST API for the frontend to consume. The core logic is within the API controllers:

-   `PredictionController.php`: Handles requests for predictions. It fetches the necessary data and executes the `predict_from_json.py` script, passing the data as a JSON string. The script then returns the predictions to the controller, which sends them back to the frontend.
-   `ModelController.php`: Manages the machine learning model. It has a method to trigger model retraining by executing the `train_model.py` script.

The backend executes the Python scripts directly using a shell command. The data is passed from PHP to Python via `stdin`, and the results are returned via `stdout`.

## Frontend Logic

The React frontend provides a user interface to interact with the prediction system. It is composed of several pages:

-   **PredictionPage:** Allows users to get predictions for a specific meeting.
-   **Retrain Model Button:** A component that allows triggering the model retraining process.

The `apiService.js` file centralizes all the API calls to the backend, making the code more modular and easier to maintain.

## Data Management

-   **Database:** The Laravel application is configured to use a database to store data. The migrations indicate tables for users, cache, and jobs.
-   **Machine Learning Model:** The trained machine learning model is saved as `attendance_model.pkl`. This file is loaded by the prediction script to make predictions. The training script (`train_model.py`) is responsible for generating/updating this file.

## API Endpoints

The main API endpoints defined in `routes/api.php` are:

-   `POST /predict/meeting/{meeting}`: Gets predictions for a given meeting.
-   `POST /model/retrain`: Triggers the model retraining process.

## Security

-   The API endpoints do not seem to be protected by any authentication middleware (like Sanctum or JWT). This means anyone with access to the API URL can make requests. For a production application, it is highly recommended to implement authentication and authorization.
-   Passing data to shell commands should be done carefully to avoid command injection vulnerabilities. The current implementation seems to be passing a JSON string, which is generally safe, but sanitizing and validating all inputs is crucial.

## Performance

-   The model retraining is a synchronous operation. When the `/model/retrain` endpoint is called, the server will be busy until the training process is complete. For large datasets, this can lead to long response times and potentially timeouts. It is recommended to use a queue system (like Laravel Queues) to handle long-running tasks like model training in the background.

## Setup and Installation

### Prerequisites

-   PHP, Composer
-   Node.js, npm
-   Python, pip
-   A database server (e.g., MySQL)

### Backend (`student-prediction-api`)

1.  Navigate to the `student-prediction-api` directory.
2.  Run `composer install`.
3.  Copy `.env.example` to `.env` and configure your database credentials.
4.  Run `php artisan migrate` to create the database tables.
5.  Run `php artisan key:generate`.
6.  Run `php artisan serve` to start the backend server.

### Frontend (`student-prediction-ui`)

1.  Navigate to the `student-prediction-ui` directory.
2.  Run `npm install`.
3.  Run `npm run dev` to start the frontend development server.

### Machine Learning Model

1.  Navigate to the `pred_train` directory.
2.  Run `pip install -r requirements.txt` (assuming a `requirements.txt` file exists with `pandas` and `scikit-learn`).
3.  Run `python train_model.py` to train the model and generate the `attendance_model.pkl` file. Ensure this file is accessible by the Laravel backend.
