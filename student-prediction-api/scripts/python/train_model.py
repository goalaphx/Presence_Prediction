import pandas as pd
import numpy as np
import mysql.connector
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import pickle

# --- CONFIG ---
db_config = { 'host': 'localhost', 'user': 'root', 'password': '', 'database': 'predict_app' }

print("Connecting to the database...")
try:
    # Set a longer timeout to handle potentially large data transfers
    cnx = mysql.connector.connect(**db_config, connect_timeout=300)
    print("-> Connection successful.")
except mysql.connector.Error as err:
    print(f"ERROR: Database Connection Error: {err}"); 
    exit()

print("Pulling data for training...")

# --- SQL QUERY (Simplified for focus and performance) ---
unified_query = """
WITH MeetingScheduleLink AS (
    SELECT 
        pm.id_meeting, 
        MAX(pcj.day) AS scheduled_day, 
        MAX(pcj.heure_from) AS scheduled_hour
    FROM participation_meetings pm
    JOIN meetings m ON pm.id_meeting = m.id
    JOIN planning_cours_journaliers pcj ON m.id_classe = pcj.id_classe AND DATE(pm.entree) = pcj.day
    GROUP BY pm.id_meeting
)
SELECT
    pgp.user_id,
    c.id AS class_id, 
    c.id_cours AS course_id, 
    c.id_professeur,
    co.id_matiere,
    m.id AS meeting_id,
    msl.scheduled_day, 
    msl.scheduled_hour,
    IF(pm_check.id IS NOT NULL, 1, 0) AS presence
FROM parcour_group_pivot pgp
JOIN parcours_classes pc ON pgp.id_parcour_classes = pc.id
JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
JOIN meetings m ON m.id_classe = c.id
JOIN cours co ON c.id_cours = co.id
LEFT JOIN participation_meetings pm_check ON pm_check.id_user = pgp.user_id AND pm_check.id_meeting = m.id
LEFT JOIN MeetingScheduleLink msl ON m.id = msl.id_meeting
WHERE c.active = 'Y';
"""

try:
    df = pd.read_sql(unified_query, cnx)
except Exception as e:
    print(f"ERROR: Failed to execute SQL query: {e}")
    cnx.close()
    exit()

if df.empty:
    print("ERROR: Query returned 0 rows. Cannot train model."); 
    cnx.close(); 
    exit()

print(f"-> Successfully pulled {len(df)} records.")

# --- Feature Engineering ---
print("Performing feature engineering...")
df['meeting_weekday'] = pd.to_datetime(df['scheduled_day']).dt.weekday
df['meeting_hour'] = pd.to_timedelta(df['scheduled_hour'].astype(str), errors='coerce').dt.components['hours']

# Fill missing schedule data with 0 (e.g., Sunday) and 0 (e.g., midnight), a neutral value
df.fillna({'meeting_weekday': 0, 'meeting_hour': 0}, inplace=True)
df['meeting_weekday'] = df['meeting_weekday'].astype(int)
df['meeting_hour'] = df['meeting_hour'].astype(int)

# Calculate historical attendance rate for each user
user_history = df.groupby('user_id')['presence'].agg(['mean', 'count']).rename(columns={'mean': 'user_attendance_rate', 'count': 'user_total_meetings'})
df = pd.merge(df, user_history, on='user_id', how='left')

# For users with no history, fill their rate with the global average
global_attendance_rate = df['presence'].mean()
df['user_attendance_rate'].fillna(global_attendance_rate, inplace=True)
df['user_total_meetings'].fillna(0, inplace=True)
print("-> Feature engineering complete.")

# --- Finalize Features for Training ---
features = [
    "user_id", "class_id", "course_id", "id_matiere", "id_professeur",
    "meeting_weekday", "meeting_hour", "user_attendance_rate", "user_total_meetings"
]
target = "presence"

# Drop any rows that might still have nulls in crucial feature columns
df.dropna(subset=features, inplace=True)
print(f"-> Training with {len(df)} records after cleaning.")
print(f"-> Features for model: {features}")

X = df[features]
y = df[target]

if len(df) < 10:
    print("ERROR: Not enough data to train the model after cleaning.")
    cnx.close()
    exit()

# --- Model Training ---
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
print("Training RandomForestClassifier...")
model = RandomForestClassifier(n_estimators=150, random_state=42, class_weight='balanced', n_jobs=-1, min_samples_leaf=5)
model.fit(X_train, y_train)
print("-> Model training complete.")

# --- Model Evaluation (printed to logs) ---
print("\n--- Model Evaluation ---")
y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\n--- Feature Importances ---")
feature_imp = pd.Series(model.feature_importances_, index=features).sort_values(ascending=False)
print(feature_imp)

# --- Save Model using Pickle ---
model_filename = "attendance_model.pkl"
try:
    with open(model_filename, 'wb') as file:
        pickle.dump(model, file)
    print(f"\n-> SUCCESS: Model saved to {model_filename}")
except Exception as e:
    print(f"\nERROR: Could not save the model file. Reason: {e}")
    cnx.close()
    exit()

cnx.close()
print("-> Connection closed.")