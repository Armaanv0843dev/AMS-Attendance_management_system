"""
services/pdf.py — PDF report generation using ReportLab.
Generates a formatted PDF with student attendance data, predictions, and suggestions.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from io import BytesIO
from datetime import datetime


# --- Color palette matching the dark UI theme ---
PRIMARY = colors.HexColor("#4F46E5")
SUCCESS = colors.HexColor("#10B981")
WARNING = colors.HexColor("#F59E0B")
DANGER = colors.HexColor("#EF4444")
DARK = colors.HexColor("#1E1E1E")
LIGHT_GRAY = colors.HexColor("#F3F4F6")
WHITE = colors.white


def get_status_color(status: str) -> colors.Color:
    mapping = {"Good": SUCCESS, "Warning": WARNING, "Critical": DANGER, "Normal": SUCCESS, "At Risk": DANGER}
    return mapping.get(status, colors.black)


def build_pdf_report(predictions: list) -> bytes:
    """
    Build a PDF attendance report.

    Args:
        predictions: List of prediction dicts (from ml/predict.py).

    Returns:
        PDF file bytes.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    elements = []

    # --- Title ---
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontSize=20,
        textColor=PRIMARY,
        spaceAfter=6,
        alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#6B7280"),
        spaceAfter=12,
        alignment=TA_CENTER,
    )
    elements.append(Paragraph("Attendance Management System", title_style))
    elements.append(Paragraph(f"Attendance Report — Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=PRIMARY))
    elements.append(Spacer(1, 0.5 * cm))

    if not predictions:
        elements.append(Paragraph("No student data available.", styles["Normal"]))
        doc.build(elements)
        return buffer.getvalue()

    # --- Summary cards (total counts) ---
    total = len(predictions)
    at_risk = sum(1 for p in predictions if p.get("risk_status") == "At Risk")
    normal = total - at_risk
    avg_pct = sum(p.get("current_pct", 0) for p in predictions) / total if total else 0

    summary_data = [
        ["Total Students", "Normal", "At Risk", "Avg Attendance %"],
        [str(total), str(normal), str(at_risk), f"{avg_pct:.1f}%"],
    ]
    summary_table = Table(summary_data, colWidths=[4.5 * cm] * 4)
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, 1), 16),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT_GRAY),
        ("ROWBACKGROUNDS", (0, 1), (-1, 1), [LIGHT_GRAY]),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#D1D5DB")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("ROWHEIGHT", (0, 0), (-1, -1), 28),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.6 * cm))

    # --- Detailed Table ---
    section_header = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=DARK,
        spaceAfter=6,
    )
    elements.append(Paragraph("Detailed Student Report", section_header))

    table_headers = ["Roll No", "Name", "Course", "Sem", "Present", "Absent", "Late", "Current %", "Predicted %", "Status", "Risk"]
    table_data = [table_headers]

    for p in sorted(predictions, key=lambda x: x.get("roll_no", "")):
        row = [
            p.get("roll_no", ""),
            p.get("name", ""),
            p.get("course", ""),
            p.get("semester", ""),
            str(p.get("present", 0)),
            str(p.get("absent", 0)),
            str(p.get("late", 0)),
            f"{p.get('current_pct', 0):.1f}%",
            f"{p.get('predicted_pct', 0):.1f}%",
            "Good" if p.get("current_pct", 0) >= 75 else ("Warning" if p.get("current_pct", 0) >= 60 else "Critical"),
            p.get("risk_status", ""),
        ]
        table_data.append(row)

    col_widths = [1.8*cm, 3.5*cm, 2.5*cm, 1*cm, 1.3*cm, 1.3*cm, 1*cm, 2*cm, 2.2*cm, 1.8*cm, 1.8*cm]
    detail_table = Table(table_data, colWidths=col_widths, repeatRows=1)

    # Base style
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ROWHEIGHT", (0, 0), (-1, -1), 20),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
    ]

    # Color-code Risk column (last column)
    for i, p in enumerate(predictions, start=1):
        risk = p.get("risk_status", "")
        color = SUCCESS if risk == "Normal" else DANGER
        style.append(("TEXTCOLOR", (10, i), (10, i), color))
        style.append(("FONTNAME", (10, i), (10, i), "Helvetica-Bold"))

    detail_table.setStyle(TableStyle(style))
    elements.append(detail_table)
    elements.append(Spacer(1, 0.6 * cm))

    # --- Suggestions Section ---
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB")))
    elements.append(Spacer(1, 0.3 * cm))
    elements.append(Paragraph("Suggestions & Recommendations", section_header))

    suggestion_style = ParagraphStyle(
        "Suggestion",
        parent=styles["Normal"],
        fontSize=9,
        spaceAfter=4,
        leftIndent=10,
    )
    name_style = ParagraphStyle(
        "SuggestionName",
        parent=styles["Normal"],
        fontSize=9,
        fontName="Helvetica-Bold",
        spaceBefore=8,
    )

    for p in sorted(predictions, key=lambda x: x.get("current_pct", 100)):
        elements.append(Paragraph(f"• {p.get('name', '')} ({p.get('roll_no', '')})", name_style))
        elements.append(Paragraph(p.get("suggestion", ""), suggestion_style))

    # Footer
    elements.append(Spacer(1, 1 * cm))
    elements.append(HRFlowable(width="100%", thickness=1, color=PRIMARY))
    footer_style = ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.gray, alignment=TA_CENTER)
    elements.append(Paragraph("Attendance Management System — Confidential Report", footer_style))

    doc.build(elements)
    return buffer.getvalue()
