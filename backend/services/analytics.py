"""
services/analytics.py — Pandas-based attendance analytics.
Processes raw attendance data into per-student statistics.
"""

import pandas as pd
import numpy as np


def calculate_analytics(students: list, attendance: list) -> list:
    """
    Compute per-student attendance statistics.

    Args:
        students: List of student dicts from Supabase.
        attendance: List of attendance dicts from Supabase.

    Returns:
        List of dicts with per-student analytics.
    """
    if not students:
        return []

    # Normalize students — Supabase may use "Full Name", "Roll Number" etc.
    def normalize_student(s):
        return {
            "id":       s.get("id", ""),
            "name":     s.get("Full Name") or s.get("name") or "",
            "roll_no":  s.get("Roll Number") or s.get("roll_no") or "",
            "course":   s.get("Course") or s.get("course") or "",
            "semester": s.get("Semester") or s.get("semester") or "",
            "section":  s.get("section") or "",
        }

    normalized = [normalize_student(s) for s in students]

    # Build students DataFrame
    students_df = pd.DataFrame(normalized)[["id", "name", "roll_no", "course", "semester", "section"]]

    if not attendance:
        # No attendance data yet — return zeros
        result = students_df.copy()
        for col in ["present", "absent", "late", "total", "percentage"]:
            result[col] = 0
        result["status"] = "No Data"
        return result.to_dict(orient="records")

    # Build attendance DataFrame
    att_df = pd.DataFrame(attendance)

    # --- Data Cleaning ---
    # Remove duplicates: keep last record per (student_id, date)
    att_df = att_df.drop_duplicates(subset=["student_id", "date"], keep="last")

    # Drop rows with missing critical values
    att_df = att_df.dropna(subset=["student_id", "status", "date"])

    # Ensure status column is clean
    att_df["status"] = att_df["status"].str.strip().str.capitalize()
    att_df = att_df[att_df["status"].isin(["Present", "Absent", "Late"])]

    # --- Pivot / Count per student ---
    # Count each status per student
    pivot = (
        att_df.groupby(["student_id", "status"])
        .size()
        .unstack(fill_value=0)
        .reset_index()
    )

    # Ensure all status columns exist
    for col in ["Present", "Absent", "Late"]:
        if col not in pivot.columns:
            pivot[col] = 0

    pivot.rename(columns={"Present": "present", "Absent": "absent", "Late": "late"}, inplace=True)
    pivot["total"] = pivot["present"] + pivot["absent"] + pivot["late"]

    # Attendance % = (Present + 0.5 * Late) / Total * 100
    # Late counts as half-present for a fairer metric
    pivot["percentage"] = np.where(
        pivot["total"] > 0,
        ((pivot["present"] + 0.5 * pivot["late"]) / pivot["total"] * 100).round(2),
        0.0,
    )

    # --- Merge with student info ---
    merged = students_df.merge(pivot, left_on="id", right_on="student_id", how="left")
    merged[["present", "absent", "late", "total"]] = (
        merged[["present", "absent", "late", "total"]].fillna(0).astype(int)
    )
    merged["percentage"] = merged["percentage"].fillna(0.0)

    # --- Classify status ---
    def classify(pct: float) -> str:
        if pct >= 75:
            return "Good"
        elif pct >= 60:
            return "Warning"
        else:
            return "Critical"

    merged["status"] = merged["percentage"].apply(classify)

    # Drop the duplicate student_id column from the merge
    if "student_id" in merged.columns:
        merged.drop(columns=["student_id"], inplace=True)

    return merged.to_dict(orient="records")
