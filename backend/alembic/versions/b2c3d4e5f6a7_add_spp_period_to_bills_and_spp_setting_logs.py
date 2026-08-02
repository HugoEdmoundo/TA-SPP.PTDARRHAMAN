"""Add spp period to bills and spp_setting_logs table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Materialisasi tagihan SPP bulanan di tabel bills + tabel riwayat nominal SPP."""
    with op.batch_alter_table('bills', schema=None) as batch_op:
        batch_op.add_column(sa.Column('spp_month', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('spp_year', sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f('ix_bills_spp_month'), ['spp_month'], unique=False)
        batch_op.create_index(batch_op.f('ix_bills_spp_year'), ['spp_year'], unique=False)

    op.create_table(
        'spp_setting_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('spp_setting_id', sa.Integer(), sa.ForeignKey('spp_settings.id'), nullable=True),
        sa.Column('old_nominal', sa.Numeric(12, 2), nullable=True),
        sa.Column('new_nominal', sa.Numeric(12, 2), nullable=False),
        sa.Column('changed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('changed_at', sa.DateTime(), nullable=False),
        sa.Column('notes', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_spp_setting_logs_spp_setting_id', 'spp_setting_logs', ['spp_setting_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_spp_setting_logs_spp_setting_id', table_name='spp_setting_logs')
    op.drop_table('spp_setting_logs')

    with op.batch_alter_table('bills', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_bills_spp_year'))
        batch_op.drop_index(batch_op.f('ix_bills_spp_month'))
        batch_op.drop_column('spp_year')
        batch_op.drop_column('spp_month')
