"""
ml/train_model.py — Train and save the attendance prediction model.
Can be run standalone: python ml/train_model.py
Also called automatically by predict.py if no model file exists.
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), "attendance_model.pkl")


def generate_synthetic_data(n_samples: int = 500) -> pd.DataFrame:
    """
    Generate synthetic training data when real data is insufficient.
    This ensures the model can always be trained even with no Supabase data.
    """
    np.random.seed(42)
    present = np.random.randint(0, 50, n_samples)
    absent = np.random.randint(0, 20, n_samples)
    late = np.random.randint(0, 10, n_samples)
    total = present + absent + late + 1  # avoid division by zero

    current_pct = (present + 0.5 * late) / total * 100

    # Future attendance: slightly improved version of current (with some noise)
    improvement = np.random.uniform(-5, 10, n_samples)
    future_pct = np.clip(current_pct + improvement, 0, 100)

    return pd.DataFrame({
        "present_count": present,
        "absent_count": absent,
        "late_count": late,
        "current_pct": current_pct.round(2),
        "future_pct": future_pct.round(2),
    })


def train_model(real_data: list = None) -> RandomForestRegressor:
    """
    Train a RandomForestRegressor on attendance data.

    Args:
        real_data: Optional list of analytics dicts. If provided and has >= 10 records,
                   augment synthetic data with real patterns.

    Returns:
        Trained RandomForestRegressor model.
    """
    df = generate_synthetic_data(500)

    # If real data is available and sufficient, augment with it
    if real_data and len(real_data) >= 5:
        real_df = pd.DataFrame(real_data)
        real_df = real_df.rename(columns={"percentage": "current_pct"})
        # For real data, predict slightly better future (add random improvement)
        real_df["future_pct"] = np.clip(
            real_df["current_pct"] + np.random.uniform(0, 8, len(real_df)), 0, 100
        )
        real_df = real_df[["present", "absent", "late", "current_pct", "future_pct"]].rename(
            columns={"present": "present_count", "absent": "absent_count", "late": "late_count"}
        )
        df = pd.concat([df, real_df], ignore_index=True)

    # Features and target
    X = df[["present_count", "absent_count", "late_count", "current_pct"]]
    y = df["future_pct"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    score = model.score(X_test, y_test)
    print(f"Model trained. R-squared score on test set: {score:.4f}")

    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

    return model


if __name__ == "__main__":
    print("Training attendance prediction model...")
    train_model()
