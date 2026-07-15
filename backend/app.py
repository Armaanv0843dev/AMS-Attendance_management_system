"""
app.py — Flask application entry point.
Registers all route blueprints and enables CORS.
"""

from flask import Flask
from flask_cors import CORS
from routes.students import students_bp
from routes.attendance import attendance_bp
from routes.analytics import analytics_bp
from routes.prediction import prediction_bp
from routes.reports import reports_bp
from routes.sections import sections_bp
import os

def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")

    # Allow requests from the React dev server (and any origin in dev mode)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Disable response caching so clients always get fresh data
    @app.after_request
    def no_cache(response):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    # Register all blueprints (route modules)
    app.register_blueprint(students_bp, url_prefix="/students")
    app.register_blueprint(attendance_bp, url_prefix="/attendance")
    app.register_blueprint(analytics_bp, url_prefix="/analytics")
    app.register_blueprint(prediction_bp, url_prefix="/prediction")
    app.register_blueprint(reports_bp, url_prefix="/report")
    app.register_blueprint(sections_bp, url_prefix="/sections")

    @app.route("/")
    def health():
        return {"status": "ok", "message": "AMS Backend is running ✅"}

    @app.route("/health")
    def health_check():
        """Check Supabase connection."""
        from config import supabase
        try:
            if not supabase:
                return {"status": "error", "message": "Supabase not initialized"}, 503
            response = supabase.table("students").select("*", count="exact").execute()
            return {
                "status": "ok",
                "supabase_connected": True,
                "message": f"Connected. Found {len(response.data)} students",
            }
        except Exception as e:
            return {
                "status": "error",
                "supabase_connected": False,
                "error": str(e),
            }, 503

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
