"""
routes/prediction.py — AI Prediction endpoint (teacher-scoped).
GET /prediction — returns ML-predicted attendance for the current teacher's students.
"""

from flask import Blueprint, jsonify
from config import supabase
from services.analytics import calculate_analytics
from ml.predict import predict_attendance
from routes.utils import get_teacher_id
import traceback

prediction_bp = Blueprint("prediction", __name__)


@prediction_bp.route("/", methods=["GET"])
def get_prediction():
    """
    Fetch analytics data for the current teacher's students and run ML prediction.
    Auto-trains the model on first call if no model exists.
    """
    if not supabase:
        return jsonify({"predictions": []}), 200

    try:
        teacher_id = get_teacher_id()

        # Fetch students scoped to this teacher
        students_query = supabase.table("students").select("*")
        if teacher_id:
            students_query = students_query.eq("teacher_id", teacher_id)
        students_resp = students_query.execute()
        students = students_resp.data or []

        if not students:
            return jsonify({"predictions": []}), 200

        # Fetch attendance only for this teacher's student IDs
        student_ids = [s["id"] for s in students]
        attendance_resp = (
            supabase.table("attendance")
            .select("*")
            .in_("student_id", student_ids)
            .execute()
        )
        attendance = attendance_resp.data or []

        # Compute analytics first (features for ML)
        analytics_data = calculate_analytics(students, attendance)

        # Run ML predictions
        predictions = predict_attendance(analytics_data)

        return jsonify({"predictions": predictions}), 200
    except Exception:
        traceback.print_exc()
        return jsonify({"predictions": []}), 200
