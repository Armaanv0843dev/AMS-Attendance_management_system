"""
routes/attendance.py — Attendance endpoints (teacher-scoped).
All routes require X-Teacher-ID header to scope data per teacher.

GET  /attendance?date=YYYY-MM-DD  — get attendance for teacher's students (optionally by date)
POST /attendance                  — bulk save attendance records for teacher's students
"""

from flask import Blueprint, request, jsonify
from config import supabase
from routes.utils import get_teacher_id
from datetime import date

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/", methods=["GET"])
def get_attendance():
    """
    Retrieve attendance records for the current teacher's students.
    Optional query param: ?date=YYYY-MM-DD to filter by specific date.
    """
    try:
        if not supabase:
            return jsonify({"attendance": []}), 200

        teacher_id = get_teacher_id()
        filter_date = request.args.get("date")

        if teacher_id:
            # Get only this teacher's student IDs first
            students_resp = (
                supabase.table("students")
                .select("id")
                .eq("teacher_id", teacher_id)
                .execute()
            )
            student_ids = [s["id"] for s in (students_resp.data or [])]

            if not student_ids:
                return jsonify({"attendance": []}), 200

            # Now fetch attendance only for those students
            query = (
                supabase.table("attendance")
                .select("id, student_id, date, status")
                .in_("student_id", student_ids)
            )
        else:
            query = supabase.table("attendance").select("id, student_id, date, status")

        if filter_date:
            query = query.eq("date", filter_date)

        response = query.order("date", desc=True).execute()
        return jsonify({"attendance": response.data}), 200
    except Exception as e:
        return jsonify({"attendance": [], "error": str(e)}), 200


@attendance_bp.route("/", methods=["POST"])
def save_attendance():
    """
    Bulk save/update attendance records for a given date.
    Expects: { date: "YYYY-MM-DD", records: [{ student_id, status }] }
    Uses upsert to prevent duplicates (unique constraint on student_id + date).
    Only saves records for students belonging to the current teacher.
    """
    data = request.get_json()

    if not data.get("date") or not data.get("records"):
        return jsonify({"error": "Date and records are required."}), 400

    if not supabase:
        return jsonify({"error": "Database not connected. Please check Supabase credentials."}), 503

    teacher_id = get_teacher_id()
    attendance_date = data["date"]
    records = data["records"]

    if not isinstance(records, list) or len(records) == 0:
        return jsonify({"error": "Records must be a non-empty list."}), 400

    # Validate status values
    valid_statuses = {"Present", "Absent", "Late"}
    for record in records:
        if record.get("status") not in valid_statuses:
            return jsonify({"error": f"Invalid status: {record.get('status')}. Must be Present, Absent, or Late."}), 400

    try:
        # If teacher_id is set, restrict to only that teacher's student IDs
        allowed_ids = None
        if teacher_id:
            students_resp = (
                supabase.table("students")
                .select("id")
                .eq("teacher_id", teacher_id)
                .execute()
            )
            allowed_ids = {s["id"] for s in (students_resp.data or [])}

        # Build upsert payload — filter out any student_ids not owned by this teacher
        upsert_data = [
            {
                "student_id": record["student_id"],
                "date": attendance_date,
                "status": record["status"],
            }
            for record in records
            if record.get("student_id") and (allowed_ids is None or record["student_id"] in allowed_ids)
        ]

        if not upsert_data:
            return jsonify({"error": "No valid student records to save."}), 400

        # Upsert: insert or update on conflict (student_id, date)
        response = (
            supabase.table("attendance")
            .upsert(upsert_data, on_conflict="student_id,date")
            .execute()
        )
        return jsonify({"message": f"Attendance saved for {len(upsert_data)} students.", "data": response.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
