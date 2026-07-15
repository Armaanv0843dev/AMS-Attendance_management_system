"""
routes/utils.py — Shared helpers for all route blueprints.

Previously, get_teacher_id() was copy-pasted in every route file.
Now it lives here and is imported where needed.
"""

from flask import request


def get_teacher_id() -> str | None:
    """Extract teacher_id from X-Teacher-ID request header.

    Returns:
        The teacher UUID string, or None if the header is missing / empty.
    """
    return request.headers.get("X-Teacher-ID", "").strip() or None
