# wsgi.py — WSGI entry point for Gunicorn on Render.
# Creates the Flask app instance using the factory function.

from app import create_app

application = create_app()
