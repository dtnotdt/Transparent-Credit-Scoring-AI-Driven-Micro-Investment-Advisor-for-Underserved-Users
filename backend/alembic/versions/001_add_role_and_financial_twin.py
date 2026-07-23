"""
Migration: Add user role column and financial_twins table.

Revision ID: 001_add_role_and_financial_twin
Revises: (initial)
Create Date: 2026-07-22

Changes:
  1. users table: ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER'
  2. CREATE TABLE financial_twins
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "001_add_role_and_financial_twin"
down_revision = None
branch_labels = None
depends_on = None


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column already exists (idempotent migrations)."""
    conn = op.get_bind()
    insp = inspect(conn)
    columns = [col["name"] for col in insp.get_columns(table_name)]
    return column_name in columns


def table_exists(table_name: str) -> bool:
    """Check if a table already exists."""
    conn = op.get_bind()
    insp = inspect(conn)
    return table_name in insp.get_table_names()


def upgrade() -> None:
    # ── 1. Add role column to users ───────────────────────────────────────────
    if not column_exists("users", "role"):
        op.add_column(
            "users",
            sa.Column("role", sa.String(20), nullable=False, server_default="USER"),
        )
        # Seed existing users with 'USER' role (safety: if any exist)
        op.execute("UPDATE users SET role = 'USER' WHERE role IS NULL OR role = ''")

    # ── 2. Create financial_twins table ───────────────────────────────────────
    if not table_exists("financial_twins"):
        op.create_table(
            "financial_twins",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("current_credit_score", sa.Integer(), nullable=False),
            sa.Column("current_savings_monthly", sa.Float(), nullable=False),
            sa.Column("current_investment_monthly", sa.Float(), nullable=False),
            sa.Column("current_risk_level", sa.String(20), nullable=False),
            sa.Column("projections_1y", sa.JSON(), nullable=False),
            sa.Column("projections_3y", sa.JSON(), nullable=False),
            sa.Column("projections_5y", sa.JSON(), nullable=False),
            sa.Column("coach_summary", sa.Text(), nullable=False),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_financial_twins_id", "financial_twins", ["id"])
        op.create_index("ix_financial_twins_user_id", "financial_twins", ["user_id"])


def downgrade() -> None:
    # Drop financial_twins table
    if table_exists("financial_twins"):
        op.drop_index("ix_financial_twins_user_id", table_name="financial_twins")
        op.drop_index("ix_financial_twins_id", table_name="financial_twins")
        op.drop_table("financial_twins")

    # Remove role column from users
    if column_exists("users", "role"):
        op.drop_column("users", "role")
