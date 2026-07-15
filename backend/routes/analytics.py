"""
routes/analytics.py — Analytics endpoint (teacher-scoped).
GET /analytics — returns per-student attendance stats for the current teacher's students.
"""

from flask import Blueprint, jsonify
from config import supabase
from services.analytics import calculate_analytics
from routes.utils import get_teacher_id
import traceback

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/", methods=["GET"])
def get_analytics():
    """Fetch teacher's students and their attendance from Supabase, compute stats with Pandas."""
    try:
        if not supabase:
            return jsonify({"analytics": []}), 200

        teacher_id = get_teacher_id()

        # Fetch students scoped to this teacher
        students_query = supabase.table("students").select("*")
        if teacher_id:
            students_query = students_query.eq("teacher_id", teacher_id)
        students_resp = students_query.execute()
        students = students_resp.data or []

        if not students:
            return jsonify({"analytics": []}), 200

        # Fetch attendance only for this teacher's student IDs
        student_ids = [s["id"] for s in students]
        attendance_resp = (
            supabase.table("attendance")
            .select("*")
            .in_("student_id", student_ids)
            .execute()
        )
        attendance = attendance_resp.data or []

        # Run analytics
        analytics_data = calculate_analytics(students, attendance)

        return jsonify({"analytics": analytics_data}), 200
    except Exception:
        traceback.print_exc()
        return jsonify({"analytics": []}), 200
