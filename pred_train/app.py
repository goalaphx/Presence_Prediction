import streamlit as st
import pandas as pd
import numpy as np
import mysql.connector
import joblib
import plotly.express as px
from datetime import timedelta

# Page Config
st.set_page_config(page_title="Attendance Prediction System", page_icon="🟢", layout="wide")

# DB Config
db_config = { 'host': 'localhost', 'user': 'root', 'password': '', 'database': 'predict_app' }

# Caching Functions
@st.cache_resource
def get_db_connection(): return mysql.connector.connect(**db_config)

@st.cache_data
def load_model():
    try:
        # --- FIX 1: Load the new, simpler v8 model ---
        return joblib.load("attendance_model_v8_simple.joblib")
    except FileNotFoundError:
        return None

# Attendance Prediction Page
def render_prediction_page(cnx, model):
    st.header("🔮 Real-Time Attendance Prediction")

    @st.cache_data(ttl=600)
    def get_meetings(_cnx):
        query = """
        WITH NumberedMeetings AS (
            SELECT m.id, m.titre_fr, m.id_classe,
                   ROW_NUMBER() OVER(PARTITION BY m.titre_fr ORDER BY m.id ASC) as rn
            FROM meetings m
            INNER JOIN classes c ON m.id_classe = c.id
            INNER JOIN parcours_classes pc ON FIND_IN_SET(c.id, pc.classes)
            INNER JOIN parcour_group_pivot pgp ON pc.id = pgp.id_parcour_classes
            GROUP BY m.id
        )
        SELECT id, titre_fr, id_classe FROM NumberedMeetings
        WHERE rn = 1 AND titre_fr IS NOT NULL AND titre_fr != '' ORDER BY titre_fr;
        """
        return pd.read_sql(query, _cnx)

    meetings = get_meetings(cnx)
    if meetings.empty:
        st.error("Could not find any meetings with enrolled users in the database.")
        st.stop()

    selected_meeting_title = st.selectbox("Select a Meeting to Predict Attendance:", meetings["titre_fr"])
    selected_row = meetings[meetings['titre_fr'] == selected_meeting_title].iloc[0]
    meeting_id, class_id = int(selected_row['id']), int(selected_row['id_classe'])

    # --- FIX 2: Simplified the query to remove unnecessary features ---
    enrolled_query = """
    SELECT
        p.user_id,
        c.id_cours AS course_id,
        c.id_professeur,
        co.id_matiere
    FROM parcour_group_pivot p
    JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
    JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
    JOIN cours co ON c.id_cours = co.id
    WHERE c.id = %s;
    """
    enrolled_df = pd.read_sql(enrolled_query, cnx, params=(class_id,))
    if enrolled_df.empty:
        st.warning(f"No users are enrolled for meeting: '{selected_meeting_title}'.")
        return

    # Load attendance history (this logic is unchanged)
    user_ids = tuple(enrolled_df['user_id'].unique())
    if user_ids:
        history_query = f"""
        SELECT p.user_id, COUNT(m.id) as user_total_meetings, COUNT(pm.id) as attended_meetings
        FROM parcour_group_pivot p
        JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
        JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
        JOIN meetings m ON m.id_classe = c.id
        LEFT JOIN participation_meetings pm ON m.id = pm.id_meeting AND p.user_id = pm.id_user
        WHERE p.user_id IN {user_ids}
        GROUP BY p.user_id;
        """
        history_df = pd.read_sql(history_query, cnx)
        if not history_df.empty:
            history_df['user_attendance_rate'] = history_df['attended_meetings'] / history_df['user_total_meetings']
            enrolled_df = pd.merge(enrolled_df, history_df[['user_id', 'user_attendance_rate', 'user_total_meetings']], on='user_id', how='left')

    enrolled_df['user_attendance_rate'].fillna(0.5, inplace=True)
    enrolled_df['user_total_meetings'].fillna(0, inplace=True)

    # Load meeting schedule (this robust logic is unchanged)
    schedule_query = """
    SELECT pcj.day AS scheduled_day, pcj.heure_from AS scheduled_hour
    FROM participation_meetings pm
    JOIN meetings m ON pm.id_meeting = m.id
    JOIN planning_cours_journaliers pcj ON m.id_classe = pcj.id_classe AND DATE(pm.entree) = pcj.day
    WHERE pm.id_meeting = %s LIMIT 1;
    """
    schedule_df = pd.read_sql(schedule_query, cnx, params=(meeting_id,))
    meeting_weekday = 0
    meeting_hour = 0

    if not schedule_df.empty:
        scheduled_day_val = schedule_df['scheduled_day'].iloc[0]
        scheduled_hour_val = schedule_df['scheduled_hour'].iloc[0]

        if pd.notna(scheduled_day_val):
            meeting_weekday = pd.to_datetime(scheduled_day_val).weekday()

        try:
            # This robust try/except block handles Timedelta, tuple, None, etc.
            meeting_hour = pd.to_timedelta(str(scheduled_hour_val)).components.hours
        except:
            meeting_hour = 0
    
    enrolled_df["meeting_weekday"] = meeting_weekday
    enrolled_df["meeting_hour"] = meeting_hour
    enrolled_df["class_id"] = class_id

    # --- FIX 3: Updated the feature list to match the v8 model ---
    features_for_prediction = [
        "user_id", "class_id", "course_id", "id_matiere", "id_professeur",
        "meeting_weekday", "meeting_hour", "user_attendance_rate", "user_total_meetings"
    ]
    X = enrolled_df[features_for_prediction]

    predictions = model.predict(X)
    probas = model.predict_proba(X)[:, 1]

    results_df = enrolled_df.copy()
    results_df["probability_of_presence"] = probas
    results_df["prediction"] = np.where(predictions == 1, "✅ PRESENT", "❌ ABSENT")

    st.subheader(f"Predictions for: {selected_meeting_title}")
    st.dataframe(results_df[["user_id", "probability_of_presence", "prediction"]])

    st.subheader("Probability Distribution (Scrollable)")
    if not results_df.empty:
        fig = px.bar(
            results_df,
            x=results_df["user_id"].astype(str),
            y="probability_of_presence",
            color="probability_of_presence",
            color_continuous_scale="Viridis",
            labels={"x": "User ID", "probability_of_presence": "Probability of Presence"},
            title="Predicted Probability of Presence by User"
        )
        fig.update_layout(xaxis_title="User ID", yaxis_title="Presence Probability")
        fig.update_xaxes(type='category')
        st.plotly_chart(fig, use_container_width=True)

# Analytics Page (Unchanged)
def render_user_analytics_page(cnx):
    st.header("📊 User Attendance Analytics")

    @st.cache_data(ttl=600)
    def get_all_users(_cnx):
        query = "SELECT DISTINCT user_id as id, CAST(user_id AS CHAR) as display_name FROM parcour_group_pivot ORDER BY user_id"
        return pd.read_sql(query, _cnx)

    users_df = get_all_users(cnx)
    if users_df.empty:
        st.warning("No users found.")
        return

    selected_user_id = st.selectbox("Select a User:", users_df['id'])

    if selected_user_id:
        personal_query = """
        SELECT COUNT(m.id) AS total, COUNT(pm.id) AS attended
        FROM parcour_group_pivot p
        JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
        JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
        JOIN meetings m ON m.id_classe = c.id
        LEFT JOIN participation_meetings pm ON m.id = pm.id_meeting AND p.user_id = pm.id_user
        WHERE p.user_id = %s;
        """
        analytics_df = pd.read_sql(personal_query, cnx, params=(selected_user_id,))
        total = int(analytics_df['total'].iloc[0])
        attended = int(analytics_df['attended'].iloc[0])

        st.subheader(f"Overall Record for User {selected_user_id}")
        if total > 0:
            rate = attended / total
            c1, c2, c3 = st.columns(3)
            c1.metric("Total Enrolled Meetings", f"{total}")
            c2.metric("Attended Meetings", f"{attended}")
            c3.metric("Personal Presence Rate", f"{rate:.1%}")
        else:
            st.info("This user is not enrolled in any meetings.")
            return

        st.subheader("Performance for Each of User's Meetings")
        with st.spinner('Loading meeting analytics...'):
            user_meetings_query = """
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
                m.titre_fr,
                msl.scheduled_day,
                msl.scheduled_hour,
                (SELECT COUNT(DISTINCT id_user) FROM participation_meetings WHERE id_meeting = m.id) AS total_attended,
                (SELECT COUNT(DISTINCT p_inner.user_id) FROM parcour_group_pivot p_inner JOIN parcours_classes pc_inner ON p_inner.id_parcour_classes = pc_inner.id WHERE FIND_IN_SET(c.id, pc_inner.classes)) AS total_enrolled
            FROM parcour_group_pivot p
            JOIN parcours_classes pc ON p.id_parcour_classes = pc.id
            JOIN classes c ON FIND_IN_SET(c.id, pc.classes)
            JOIN meetings m ON m.id_classe = c.id
            LEFT JOIN MeetingScheduleLink msl ON m.id = msl.id_meeting
            WHERE p.user_id = %s
            ORDER BY m.id DESC;
            """
            results_df = pd.read_sql(user_meetings_query, cnx, params=(selected_user_id,))

        if not results_df.empty:
            results_df.rename(columns={'titre_fr': 'Meeting Title', 'scheduled_day': 'Scheduled Day', 'scheduled_hour': 'Scheduled Time'}, inplace=True)
            results_df['Class Attendance Rate'] = (results_df['total_attended'] / results_df['total_enrolled']).fillna(0)
            results_df['Attendees'] = results_df['total_attended'].astype(str) + ' / ' + results_df['total_enrolled'].astype(str)
            results_df['Class Attendance Rate'] = results_df['Class Attendance Rate'].map('{:.1%}'.format)
            results_df['Scheduled Day'] = pd.to_datetime(results_df['Scheduled Day']).dt.strftime('%Y-%m-%d').fillna('N/A')
            results_df['Scheduled Time'] = pd.to_timedelta(results_df['Scheduled Time'].astype(str), errors='coerce').astype(str).str.split().str[-1].str.slice(0, 5).fillna("N/A")
            st.dataframe(results_df[['Meeting Title', 'Scheduled Day', 'Scheduled Time', 'Class Attendance Rate', 'Attendees']], use_container_width=True)
        else:
            st.info("Could not calculate meeting attendance rates.")

# Main App Entry Point
def main():
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Go to", ["Attendance Prediction", "User Analytics"])
    st.title("🟢 Student Attendance System")

    cnx = get_db_connection()
    model = load_model()
    if model is None:
        st.error("Model 'attendance_model_v8_simple.joblib' not found. Run the latest training script first.")
        st.stop()

    if page == "Attendance Prediction":
        render_prediction_page(cnx, model)
    elif page == "User Analytics":
        render_user_analytics_page(cnx)

if __name__ == "__main__":
    main()