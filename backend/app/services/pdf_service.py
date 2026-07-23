"""
services/pdf_service.py
------------------------
Generates a PDF report for a user's credit assessment and investment plan.
Uses fpdf2 (FPDF2 library) -- pure Python, no system dependencies.

All text uses only Latin-1 compatible characters (Helvetica built-in font).
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fpdf import FPDF, XPos, YPos


# Characters not in Latin-1 that may appear in ML-generated text
_CHAR_MAP = str.maketrans({
    "\u20b9": "Rs.",   # ₹ Indian Rupee sign
    "\u2022": "-",     # • bullet
    "\u2014": "--",    # — em dash
    "\u2013": "-",     # – en dash
    "\u2018": "'",     # ' left single quote
    "\u2019": "'",     # ' right single quote
    "\u201c": '"',     # " left double quote
    "\u201d": '"',     # " right double quote
    "\u2026": "...",   # … ellipsis
})


def _safe(text: str) -> str:
    """Replace non-Latin-1 characters with ASCII equivalents."""
    return text.translate(_CHAR_MAP)


class ReportPDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_fill_color(15, 23, 42)  # dark navy
        self.set_text_color(255, 255, 255)
        self.cell(
            0, 14, "Vantage Credit Advisor - Personal Report",
            align="C", fill=True,
            new_x=XPos.LMARGIN, new_y=YPos.NEXT,
        )
        self.ln(4)
        self.set_text_color(0, 0, 0)

    def footer(self):
        self.set_y(-20)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.set_x(self.l_margin)
        self.multi_cell(
            0, 5,
            "DISCLAIMER: This application is for educational purposes only and does "
            "not provide regulated financial or investment advice.",
            align="C",
        )

    def section_header(self, title: str) -> None:
        """Renders a coloured section banner and resets cursor to left margin."""
        self.set_font("Helvetica", "B", 12)
        self.set_fill_color(30, 41, 59)    # slate-800
        self.set_text_color(99, 132, 255)  # indigo-ish (Latin-1 safe colour, text is ASCII)
        self.set_x(self.l_margin)
        self.cell(
            0, 10, f"  {title}",
            fill=True,
            new_x=XPos.LMARGIN, new_y=YPos.NEXT,
        )
        self.set_text_color(0, 0, 0)
        self.set_x(self.l_margin)
        self.ln(1)

    def body_line(self, text: str, height: float = 8.0, bold: bool = False) -> None:
        """Single-line cell that always resets to left margin after."""
        style = "B" if bold else ""
        self.set_font("Helvetica", style, 10 if not bold else 11)
        self.set_x(self.l_margin)
        self.cell(
            0, height, text,
            new_x=XPos.LMARGIN, new_y=YPos.NEXT,
        )

    def body_wrap(self, text: str, height: float = 7.0) -> None:
        """Multi-line wrapped cell; always resets to left margin."""
        self.set_font("Helvetica", "", 10)
        self.set_x(self.l_margin)
        self.multi_cell(0, height, text)
        self.set_x(self.l_margin)


def generate_pdf_report(
    username: str,
    credit_score: int,
    score_label: str,
    shap_top3: list[dict],
    suggestions: list[str],
    risk_level: str,
    allocation: dict[str, float],
    projections: dict,
    monthly_investment: float,
    coach_tips: Optional[list[str]] = None,
) -> bytes:
    """
    Returns PDF as bytes to be streamed to the client.
    coach_tips: optional list of plain-English coaching recommendations.
    All strings must be Latin-1 compatible (ASCII subset is fine).
    """
    pdf = ReportPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    now = datetime.now().strftime("%d %B %Y, %H:%M")

    # ── Cover block ─────────────────────────────────────────────────────────────
    pdf.body_line(f"Report for: {_safe(username)}", height=10.0, bold=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 8, f"Generated: {now}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # ── Credit Score ─────────────────────────────────────────────────────────────
    pdf.section_header("Credit Score")
    pdf.body_line(f"  Score: {credit_score}  ({_safe(score_label)})", height=9.0)

    pdf.body_line("  Top SHAP Contributions:", height=9.0, bold=True)
    pdf.set_font("Helvetica", "", 10)
    for item in shap_top3:
        if isinstance(item, dict):
            contribution = item.get("contribution", 0)
            feature = item.get("feature", "")
        else:
            contribution = getattr(item, "contribution", 0)
            feature = getattr(item, "feature", "")
        sign = "+" if contribution >= 0 else ""
        pdf.set_x(pdf.l_margin)
        pdf.cell(
            0, 8, f"    - {_safe(str(feature))}: {sign}{contribution:.2f}",
            new_x=XPos.LMARGIN, new_y=YPos.NEXT,
        )

    pdf.body_line("  Improvement Suggestions:", height=9.0, bold=True)
    for sug in suggestions:
        sug_clean = _safe(sug)
        sug_safe = (sug_clean[:120] + "...") if len(sug_clean) > 123 else sug_clean
        pdf.body_wrap(f"    - {sug_safe}")
    pdf.ln(4)

    # ── AI Coach Recommendations ─────────────────────────────────────────────────
    if coach_tips:
        pdf.section_header("AI Coach Recommendations")
        for tip in coach_tips:
            tip_clean = _safe(tip)
            tip_safe = (tip_clean[:120] + "...") if len(tip_clean) > 123 else tip_clean
            pdf.body_wrap(f"    - {tip_safe}")
        pdf.ln(4)

    # ── Risk Profile ─────────────────────────────────────────────────────────────
    pdf.section_header("Risk Profile")
    pdf.body_line(f"  Risk Level: {_safe(risk_level)}", height=9.0)
    pdf.ln(4)

    # ── Investment Allocation ────────────────────────────────────────────────────
    pdf.section_header("Investment Allocation")
    pdf.set_font("Helvetica", "", 10)
    for asset, pct in allocation.items():
        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 8, f"  - {_safe(str(asset))}: {pct}%", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # ── Growth Projections ───────────────────────────────────────────────────────
    pdf.section_header("Growth Projections (SIP)")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(pdf.l_margin)
    pdf.cell(
        0, 8, f"  Monthly SIP: Rs.{monthly_investment:,.0f}",
        new_x=XPos.LMARGIN, new_y=YPos.NEXT,
    )
    pdf.ln(2)

    # Table
    col_w = [25, 45, 45, 45]  # wider columns to avoid layout overflow
    headers = ["Period", "Worst Case", "Average Case", "Best Case"]
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(51, 65, 85)
    pdf.set_text_color(255, 255, 255)
    pdf.set_x(pdf.l_margin)
    for i, h in enumerate(headers):
        is_last = (i == len(headers) - 1)
        pdf.cell(
            col_w[i], 9, h, border=1, align="C", fill=True,
            new_x=XPos.LMARGIN if is_last else XPos.RIGHT,
            new_y=YPos.NEXT if is_last else YPos.TOP,
        )
    pdf.set_text_color(0, 0, 0)

    pdf.set_font("Helvetica", "", 10)
    for period, proj in projections.items():
        if isinstance(proj, dict):
            worst, avg, best = proj.get("worst", 0), proj.get("avg", 0), proj.get("best", 0)
        else:
            worst, avg, best = proj.worst, proj.avg, proj.best
        pdf.set_x(pdf.l_margin)
        pdf.cell(col_w[0], 8, period, border=1, align="C", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[1], 8, f"Rs.{worst:,.0f}", border=1, align="R", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[2], 8, f"Rs.{avg:,.0f}", border=1, align="R", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[3], 8, f"Rs.{best:,.0f}", border=1, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    return bytes(pdf.output())


def generate_financial_twin_pdf(username: str, twin) -> bytes:
    """
    Generate a Financial Twin PDF report.
    twin: FinancialTwin SQLAlchemy model instance.
    Returns PDF as bytes.
    """
    pdf = ReportPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=25)

    now = datetime.now().strftime("%d %B %Y, %H:%M")

    # ── Cover ────────────────────────────────────────────────────────────────
    pdf.body_line(f"Financial Twin Report — {_safe(username)}", height=10.0, bold=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 8, f"Generated: {now}  |  Twin ID: #{twin.id}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_x(pdf.l_margin)
    pdf.set_text_color(180, 130, 50)
    pdf.cell(0, 7, "For educational purposes only. Not regulated financial advice.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(4)

    # ── Today's Snapshot ─────────────────────────────────────────────────────
    pdf.section_header("Today's Financial Snapshot")
    pdf.set_font("Helvetica", "", 10)
    fields = [
        ("Credit Score", str(twin.current_credit_score)),
        ("Monthly Savings", f"Rs.{twin.current_savings_monthly:,.0f}"),
        ("Monthly Investment", f"Rs.{twin.current_investment_monthly:,.0f}"),
        ("Risk Profile", _safe(twin.current_risk_level)),
    ]
    for label, value in fields:
        pdf.set_x(pdf.l_margin)
        pdf.cell(80, 8, f"  {label}:", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(0, 8, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # ── Projections Table ─────────────────────────────────────────────────────
    pdf.section_header("Financial Twin Projections")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 7, "  Projections based on your current behavior and market historical averages.", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)

    col_w = [38, 30, 38, 38, 30]
    headers = ["Horizon", "Credit Score", "Savings/mo", "Investment", "Risk Level"]
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(51, 65, 85)
    pdf.set_text_color(255, 255, 255)
    pdf.set_x(pdf.l_margin)
    for i, h in enumerate(headers):
        is_last = (i == len(headers) - 1)
        pdf.cell(
            col_w[i], 9, h, border=1, align="C", fill=True,
            new_x=XPos.LMARGIN if is_last else XPos.RIGHT,
            new_y=YPos.NEXT if is_last else YPos.TOP,
        )
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 9)

    horizons = [
        ("1 Year",  twin.projections_1y),
        ("3 Years", twin.projections_3y),
        ("5 Years", twin.projections_5y),
    ]
    for label, proj in horizons:
        pdf.set_x(pdf.l_margin)
        pdf.cell(col_w[0], 8, label, border=1, align="C", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[1], 8, str(proj.get("credit_score", "—")), border=1, align="C", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[2], 8, f"Rs.{proj.get('savings', 0):,.0f}", border=1, align="R", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[3], 8, f"Rs.{proj.get('investment_value', 0):,.0f}", border=1, align="R", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(col_w[4], 8, _safe(proj.get("risk_level", "—")), border=1, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # Net Worth row
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_x(pdf.l_margin)
    pdf.cell(0, 8, "  Projected Net Worth:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", "", 9)
    for label, proj in horizons:
        nw = proj.get("net_worth", 0)
        pdf.set_x(pdf.l_margin)
        pdf.cell(0, 7, f"    {label}: Rs.{nw:,.0f}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # ── AI Coach Summary ──────────────────────────────────────────────────────
    pdf.section_header("AI Financial Coach Summary")
    summary_clean = _safe(twin.coach_summary)
    pdf.body_wrap(f"  {summary_clean}")
    pdf.ln(4)

    # ── Disclaimer ────────────────────────────────────────────────────────────
    pdf.section_header("Important Disclaimer")
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_x(pdf.l_margin)
    disclaimer = (
        "This Financial Twin simulation is for educational purposes only. "
        "Projections are based on historical market data and current financial behavior patterns. "
        "They do not constitute regulated financial or investment advice. "
        "Past performance is not indicative of future results. "
        "Consult a SEBI-registered financial advisor before making investment decisions."
    )
    pdf.multi_cell(0, 6, f"  {disclaimer}")

    return bytes(pdf.output())
