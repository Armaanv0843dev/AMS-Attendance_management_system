"""
ml/predict.py — Load the trained model and generate predictions.
Auto-trains the model if no saved model file exists.

Optimization: The model is cached in a module-level variable (_cached_model)
so the 1.8 MB pkl file is only read from disk once per server process,
regardless of how many prediction requests are made.
"""

import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(os.path.dirname(__file__), "attendance_model.pkl")

# Module-level cache — avoids re-loading 1.8MB pkl on every request
_cached_model = None


def load_or_train_model(analytics_data: list = None):
    """
    Return the cached model (load from disk on first call, or train if missing).

    Args:
        analytics_data: Optional list of analytics dicts to augment training.

    Returns:
        Loaded/trained model.
    """
    global _cached_model

    if _cached_model is not None:
        return _cached_model

    if os.path.exists(MODEL_PATH):
        print("Loading ML model from disk (first request)...")
        _cached_model = joblib.load(MODEL_PATH)
        return _cached_model

    print("No saved model found. Training a new model...")
    from ml.train_model import train_model
    _cached_model = train_model(analytics_data)
    return _cached_model


def generate_suggestion(current_pct: float, predicted_pct: float, total: int = 0) -> str:
    """Generate a human-readable suggestion based on attendance percentages."""
    if current_pct >= 90:
        return "🌟 Excellent attendance! Keep up the great work."
    elif current_pct >= 75:
        if predicted_pct >= 75:
            return "✅ Good attendance. Stay consistent to maintain your record."
        else:
            return "⚠️ Good so far, but predicted to drop. Avoid further absences."
    elif current_pct >= 60:
        # Formula: to reach 75%, need X more consecutive "present" classes.
        # If current present = total * (current_pct/100), then:
        #   (present + X) / (total + X) = 0.75
        # => X = (0.75*total - present) / (1 - 0.75) = (0.75*total - present) / 0.25
        if total > 0:
            present = total * (current_pct / 100)
            classes_needed = max(0, int(np.ceil((0.75 * total - present) / 0.25)))
        else:
            classes_needed = 10  # fallback estimate
        return f"⚠️ Attendance below 75%. Attend approximately {classes_needed} more consecutive classes to reach 75%."
    else:
        return "🚨 Critical attendance. Immediately meet the class coordinator to discuss your situation."


def predict_attendance(analytics_data: list) -> list:
    """
    Generate attendance predictions for all students.

    Args:
        analytics_data: List of per-student analytics dicts (from services/analytics.py).

    Returns:
        List of prediction result dicts.
    """
    if not analytics_data:
        return []

    model = load_or_train_model(analytics_data)
    results = []

    for student in analytics_data:
        present = student.get("present", 0)
        absent = student.get("absent", 0)
        late = student.get("late", 0)
        current_pct = student.get("percentage", 0.0)

        # Feature vector
        features = [[present, absent, late, current_pct]]

        # Predict
        predicted_pct = float(np.clip(model.predict(features)[0], 0, 100))
        predicted_pct = round(predicted_pct, 2)

        # Risk classification
        risk_status = "Normal" if predicted_pct >= 75 else "At Risk"

        # Generate suggestion
        suggestion = generate_suggestion(current_pct, predicted_pct, student.get("total", 0))

        results.append({
            "id": student.get("id"),
            "name": student.get("name"),
            "roll_no": student.get("roll_no"),
            "course": student.get("course"),
            "semester": student.get("semester"),
            "current_pct": current_pct,
            "predicted_pct": predicted_pct,
            "risk_status": risk_status,
            "suggestion": suggestion,
            "present": present,
            "absent": absent,
            "late": late,
            "total": student.get("total", 0),
        })

    return results
