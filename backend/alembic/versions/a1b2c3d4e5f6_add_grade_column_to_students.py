"""Add grade column to students

Revision ID: a1b2c3d4e5f6
Revises: 4273146526df
Create Date: 2026-08-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '4273146526df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add kelas (grade) column ke tabel students."""
    with op.batch_alter_table('students', schema=None) as batch_op:
        batch_op.add_column(sa.Column('grade', sa.String(length=20), nullable=True))


def downgrade() -> None:
    """Hapus kolom grade."""
    with op.batch_alter_table('students', schema=None) as batch_op:
        batch_op.drop_column('grade')
