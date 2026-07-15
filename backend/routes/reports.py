"""
routes/reports.py — PDF and Excel report download endpoints (teacher-scoped).
GET /report/pdf   — stream PDF report for the current teacher's students
GET /report/excel — stream Excel report for the current teacher's students
"""

from flask import Blueprint, request, send_file, jsonify
from config import supabase
from services.analytics import calculate_analytics
from ml.predict import predict_attendance
from services.pdf import build_pdf_report
from services.excel import build_excel_report
from routes.utils import get_teacher_id
from io import BytesIO
from datetime import datetime
import traceback

reports_bp = Blueprint("reports", __name__)


def _get_predictions(teacher_id=None):
    """Helper: fetch teacher-scoped data and build predictions list."""
    if not supabase:
        return [], []
    try:
        # Fetch students scoped to this teacher
        students_query = supabase.table("students").select("*")
        if teacher_id:
            students_query = students_query.eq("teacher_id", teacher_id)
        students_resp = students_query.execute()
        students = students_resp.data or []

        if not students:
            return [], []

        # Fetch attendance only for this teacher's student IDs
        student_ids = [s["id"] for s in students]
        attendance_resp = (
            supabase.table("attendance")
            .select("*")
            .in_("student_id", student_ids)
            .execute()
        )
        attendance = attendance_resp.data or []

        analytics_data = calculate_analytics(students, attendance)
        predictions = predict_attendance(analytics_data)

        return predictions, attendance
    except Exception:
        traceback.print_exc()
        return [], []


@reports_bp.route("/pdf", methods=["GET"])
def download_pdf():
    """Generate and stream a PDF attendance report for the current teacher."""
    try:
        teacher_id = get_teacher_id()
        predictions, _ = _get_predictions(teacher_id)
        pdf_bytes = build_pdf_report(predictions)
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@reports_bp.route("/excel", methods=["GET"])
def download_excel():
    """Generate and stream an Excel attendance report for the current teacher."""
    try:
        teacher_id = get_teacher_id()
        predictions, attendance = _get_predictions(teacher_id)
        excel_bytes = build_excel_report(predictions, attendance)
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        return send_file(
            BytesIO(excel_bytes),
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
