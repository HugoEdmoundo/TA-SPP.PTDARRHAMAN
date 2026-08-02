"""Drop grade column from students

Revision ID: c1d2e3f4a5b6
Revises: b2c3d4e5f6a7
Create Date: 2026-08-02 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Hapus kolom kelas (grade) dari tabel students karena kelas tidak digunakan."""
    with op.batch_alter_table('students', schema=None) as batch_op:
        batch_op.drop_column('grade')


def downgrade() -> None:
    """Tambah kembali kolom grade."""
    with op.batch_alter_table('students', schema=None) as batch_op:
        batch_op.add_column(sa.Column('grade', sa.String(length=20), nullable=True))
