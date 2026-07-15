"""
routes/sections.py — Section CRUD endpoints (teacher-scoped).
All routes require X-Teacher-ID header to scope data per teacher.

GET    /sections/        — list this teacher's sections
POST   /sections/        — create a new section (teacher-owned)
DELETE /sections/<id>    — delete a section (teacher-owned only)
"""

from flask import Blueprint, request, jsonify
from config import supabase
from routes.utils import get_teacher_id

sections_bp = Blueprint("sections", __name__)


@sections_bp.route("/", methods=["GET"])
def get_sections():
    """Retrieve all sections for the current teacher, ordered by name."""
    try:
        if not supabase:
            return jsonify({"sections": []}), 200

        teacher_id = get_teacher_id()
        query = supabase.table("sections").select("*").order("name")
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)

        response = query.execute()
        return jsonify({"sections": response.data}), 200
    except Exception:
        return jsonify({"sections": []}), 200


@sections_bp.route("/", methods=["POST"])
def create_section():
    """Create a new section under the current teacher. Requires: name."""
    data = request.get_json()
    if not data or not data.get("name", "").strip():
        return jsonify({"error": "Section name is required."}), 400

    if not supabase:
        return jsonify({"error": "Database not connected."}), 503

    teacher_id = get_teacher_id()

    try:
        response = (
            supabase.table("sections")
            .insert({"name": data["name"].strip(), "teacher_id": teacher_id})
            .execute()
        )
        return jsonify({"section": response.data[0], "message": "Section created."}), 201
    except Exception as e:
        error_msg = str(e)
        if "unique" in error_msg.lower() or "duplicate" in error_msg.lower():
            return jsonify({"error": "Section already exists."}), 409
        return jsonify({"error": error_msg}), 500


@sections_bp.route("/<section_id>", methods=["DELETE"])
def delete_section(section_id):
    """Delete a section (teacher-owned only)."""
    if not supabase:
        return jsonify({"error": "Database not connected."}), 503

    teacher_id = get_teacher_id()

    try:
        query = supabase.table("sections").delete().eq("id", section_id)
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)

        response = query.execute()
        if not response.data:
            return jsonify({"error": "Section not found."}), 404
        return jsonify({"message": "Section deleted."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
