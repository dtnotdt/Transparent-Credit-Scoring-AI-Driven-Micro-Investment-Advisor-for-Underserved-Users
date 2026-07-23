"""
Migration: Add login history, activity logs, report history, and investment plans tables.

Revision ID: 002_add_history_and_investment_plans
Revises: 001_add_role_and_financial_twin
Create Date: 2026-07-22

Changes:
  1. CREATE TABLE login_history
  2. CREATE TABLE activity_logs
  3. CREATE TABLE report_history
  4. CREATE TABLE investment_plans
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "002_add_history_and_investment_plans"
down_revision = "001_add_role_and_financial_twin"
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    """Check if a table already exists."""
    conn = op.get_bind()
    insp = inspect(conn)
    return table_name in insp.get_table_names()


def upgrade() -> None:
    # ── 1. Create login_history table ───────────────────────────────────────
    if not table_exists("login_history"):
        op.create_table(
            "login_history",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("email_attempted", sa.String(255), nullable=True),
            sa.Column("success", sa.Boolean(), default=False, nullable=False),
            sa.Column("ip_address", sa.String(50), nullable=True),
            sa.Column(
                "timestamp",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_login_history_id", "login_history", ["id"])
        op.create_index("ix_login_history_user_id", "login_history", ["user_id"])

    # ── 2. Create activity_logs table ───────────────────────────────────────
    if not table_exists("activity_logs"):
        op.create_table(
            "activity_logs",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("event_type", sa.String(100), nullable=False),
            sa.Column("description", sa.String(500), nullable=True),
            sa.Column(
                "timestamp",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_activity_logs_id", "activity_logs", ["id"])
        op.create_index("ix_activity_logs_user_id", "activity_logs", ["user_id"])

    # ── 3. Create report_history table ───────────────────────────────────────
    if not table_exists("report_history"):
        op.create_table(
            "report_history",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("report_type", sa.String(100), nullable=False),
            sa.Column(
                "downloaded_at",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_report_history_id", "report_history", ["id"])
        op.create_index("ix_report_history_user_id", "report_history", ["user_id"])

    # ── 4. Create investment_plans table ───────────────────────────────────────
    if not table_exists("investment_plans"):
        op.create_table(
            "investment_plans",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("risk_level", sa.String(20), nullable=False),
            sa.Column("monthly_investment", sa.Float(), nullable=False),
            sa.Column("allocation", sa.JSON(), nullable=False),
            sa.Column("projections", sa.JSON(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_investment_plans_id", "investment_plans", ["id"])
        op.create_index("ix_investment_plans_user_id", "investment_plans", ["user_id"])


def downgrade() -> None:
    if table_exists("investment_plans"):
        op.drop_index("ix_investment_plans_user_id", table_name="investment_plans")
        op.drop_index("ix_investment_plans_id", table_name="investment_plans")
        op.drop_table("investment_plans")

    if table_exists("report_history"):
        op.drop_index("ix_report_history_user_id", table_name="report_history")
        op.drop_index("ix_report_history_id", table_name="report_history")
        op.drop_table("report_history")

    if table_exists("activity_logs"):
        op.drop_index("ix_activity_logs_user_id", table_name="activity_logs")
        op.drop_index("ix_activity_logs_id", table_name="activity_logs")
        op.drop_table("activity_logs")

    if table_exists("login_history"):
        op.drop_index("ix_login_history_user_id", table_name="login_history")
        op.drop_index("ix_login_history_id", table_name="login_history")
        op.drop_table("login_history")
