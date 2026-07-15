"""
routes/students.py — Student CRUD endpoints (teacher-scoped).
All routes require X-Teacher-ID header to scope data per teacher.

GET    /students              — list teacher's students (with section)
POST   /students              — add a new student (with optional section)
POST   /students/assign-sections — bulk auto-assign teacher's students to sections
PUT    /students/<id>         — update a student (teacher-owned only)
DELETE /students/<id>         — delete a student (teacher-owned only)
"""

from flask import Blueprint, request, jsonify
from config import supabase
from routes.utils import get_teacher_id

students_bp = Blueprint("students", __name__)


@students_bp.route("/", methods=["GET"])
def get_students():
    """Retrieve all students for the current teacher, ordered by name."""
    try:
        if not supabase:
            return jsonify({"students": []}), 200

        teacher_id = get_teacher_id()
        query = supabase.table("students").select("*")
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)

        response = query.execute()

        # Map column names to match frontend expectations
        students = [
            {
                "id": record.get("id"),
                "name": record.get("Full Name", record.get("name", "")),
                "roll_no": record.get("Roll Number", record.get("roll_no", "")),
                "email": record.get("Email", record.get("email", "")),
                "course": record.get("Course", record.get("course", "")),
                "semester": record.get("Semester", record.get("semester", "")),
                "section": record.get("section", ""),
                "teacher_id": record.get("teacher_id"),
                "created_at": record.get("created_at"),
            }
            for record in response.data
        ]

        return jsonify({"students": students}), 200
    except Exception:
        return jsonify({"students": []}), 200


@students_bp.route("/", methods=["POST"])
def add_student():
    """Add a new student under the current teacher. Requires: name, roll_no.
    Tries lowercase column names first; if PGRST204, retries with Excel-style names.
    """
    data = request.get_json()

    if not data.get("name") or not data.get("roll_no"):
        return jsonify({"error": "Name and Roll Number are required."}), 400

    if not supabase:
        return jsonify({"error": "Database not connected. Please check Supabase credentials."}), 503

    teacher_id = get_teacher_id()

    def build_payload(excel_style=False):
        """Build the insert dict using either lowercase or Excel-style column names."""
        if excel_style:
            p = {
                "Full Name": data["name"].strip(),
                "Roll Number": data["roll_no"].strip(),
            }
            if data.get("email", "").strip():    p["Email"]    = data["email"].strip()
            if data.get("course", "").strip():   p["Course"]   = data["course"].strip()
            if data.get("semester", "").strip(): p["Semester"] = data["semester"].strip()
            if data.get("section", "").strip():  p["section"]  = data["section"].strip()
        else:
            p = {
                "name":    data["name"].strip(),
                "roll_no": data["roll_no"].strip(),
            }
            if data.get("email", "").strip():    p["email"]    = data["email"].strip()
            if data.get("course", "").strip():   p["course"]   = data["course"].strip()
            if data.get("semester", "").strip(): p["semester"] = data["semester"].strip()
            if data.get("section", "").strip():  p["section"]  = data["section"].strip()

        if teacher_id:
            p["teacher_id"] = teacher_id
        return p

    try:
        # --- Attempt 1: standard lowercase schema ---
        student = build_payload(excel_style=False)
        try:
            response = supabase.table("students").insert(student).execute()
            return jsonify({"student": response.data[0], "message": "Student added successfully."}), 201
        except Exception as e1:
            err = str(e1)
            # PGRST204 = column not found in schema cache
            if "PGRST204" in err or "schema cache" in err or "could not find" in err.lower():
                if "teacher_id" in err:
                    # Migration not run yet — retry without teacher_id only
                    student.pop("teacher_id", None)
                    response = supabase.table("students").insert(student).execute()
                    return jsonify({"student": response.data[0], "message": "Student added successfully."}), 201
                else:
                    # Column naming mismatch — try Excel-style capitalized columns
                    student_xl = build_payload(excel_style=True)
                    try:
                        response = supabase.table("students").insert(student_xl).execute()
                        return jsonify({"student": response.data[0], "message": "Student added successfully."}), 201
                    except Exception as e2:
                        err2 = str(e2)
                        if "teacher_id" in err2:
                            student_xl.pop("teacher_id", None)
                            response = supabase.table("students").insert(student_xl).execute()
                            return jsonify({"student": response.data[0], "message": "Student added successfully."}), 201
                        raise e2
            raise e1

    except Exception as e:
        error_msg = str(e)
        if "unique" in error_msg.lower() or "duplicate" in error_msg.lower():
            return jsonify({"error": "Roll number already exists."}), 409
        return jsonify({"error": error_msg}), 500



@students_bp.route("/assign-sections", methods=["POST"])
def assign_sections():
    """
    Bulk assign THIS teacher's students to sections based on their Course field.
    Each unique course becomes a section.
    Students with no course go to 'Unassigned'.
    """
    if not supabase:
        return jsonify({"error": "Database not connected."}), 503

    teacher_id = get_teacher_id()

    try:
        # Fetch only this teacher's students
        query = supabase.table("students").select("*")
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)
        response = query.execute()
        students = response.data

        if not students:
            return jsonify({"error": "No students found."}), 404

        # Group students by course
        course_groups = {}
        for student in students:
            course = (
                student.get("Course") or
                student.get("course") or
                ""
            ).strip()
            if not course:
                course = "Unassigned"
            if course not in course_groups:
                course_groups[course] = []
            course_groups[course].append(student["id"])

        # Ensure all course-sections exist in sections table (scoped to teacher)
        sec_query = supabase.table("sections").select("name")
        if teacher_id:
            sec_query = sec_query.eq("teacher_id", teacher_id)
        existing_resp = sec_query.execute()
        existing_names = {s["name"] for s in existing_resp.data}

        new_sections = [
            {"name": name, "teacher_id": teacher_id}
            for name in course_groups
            if name not in existing_names
        ]
        if new_sections:
            supabase.table("sections").insert(new_sections).execute()

        # Update each course's students in one batch
        summary = {}
        for course, student_ids in course_groups.items():
            supabase.table("students").update({"section": course}).in_("id", student_ids).execute()
            summary[course] = len(student_ids)

        total = len(students)
        return jsonify({
            "message": f"{total} students assigned to {len(course_groups)} sections by course.",
            "summary": summary,
            "sections": list(course_groups.keys()),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("/<student_id>", methods=["PUT"])
def update_student(student_id):
    """Update an existing student's details (teacher-owned only)."""
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided."}), 400

    if not supabase:
        return jsonify({"error": "Database not connected. Please check Supabase credentials."}), 503

    teacher_id = get_teacher_id()

    try:
        update_data = {}
        for field in ["name", "roll_no", "email", "course", "semester"]:
            if field in data:
                update_data[field] = data[field].strip()
        if "section" in data:
            update_data["section"] = data["section"].strip() or None

        query = supabase.table("students").update(update_data).eq("id", student_id)
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)

        response = query.execute()
        if not response.data:
            return jsonify({"error": "Student not found."}), 404
        return jsonify({"student": response.data[0], "message": "Student updated successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@students_bp.route("/<student_id>", methods=["DELETE"])
def delete_student(student_id):
    """Delete a student (teacher-owned only) and all their attendance records (cascade in DB)."""
    if not supabase:
        return jsonify({"error": "Database not connected. Please check Supabase credentials."}), 503

    teacher_id = get_teacher_id()

    try:
        query = supabase.table("students").delete().eq("id", student_id)
        if teacher_id:
            query = query.eq("teacher_id", teacher_id)

        response = query.execute()
        if not response.data:
            return jsonify({"error": "Student not found."}), 404
        return jsonify({"message": "Student deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
