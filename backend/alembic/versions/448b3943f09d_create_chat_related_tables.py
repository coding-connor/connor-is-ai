"""Create chat related  tables

Revision ID: 448b3943f09d
Revises:
Create Date: 2024-10-29 12:54:06.946504

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "448b3943f09d"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "user",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.PrimaryKeyConstraint("user_id"),
    )
    op.create_index(op.f("ix_user_user_id"), "user", ["user_id"], unique=False)
    op.create_table(
        "chatsession",
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.user_id"],
        ),
        sa.PrimaryKeyConstraint("session_id"),
    )
    op.create_index(
        op.f("ix_chatsession_session_id"), "chatsession", ["session_id"], unique=False
    )
    op.create_index(
        op.f("ix_chatsession_user_id"), "chatsession", ["user_id"], unique=False
    )
    op.create_table(
        "chatmessage",
        sa.Column("message_id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.Uuid(), nullable=False),
        sa.Column("sender", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("model", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("content", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["session_id"],
            ["chatsession.session_id"],
        ),
        sa.PrimaryKeyConstraint("message_id"),
    )
    op.create_index(
        op.f("ix_chatmessage_message_id"), "chatmessage", ["message_id"], unique=False
    )
    op.create_index(
        op.f("ix_chatmessage_sender"), "chatmessage", ["sender"], unique=False
    )
    op.create_index(
        op.f("ix_chatmessage_session_id"), "chatmessage", ["session_id"], unique=False
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f("ix_chatmessage_session_id"), table_name="chatmessage")
    op.drop_index(op.f("ix_chatmessage_sender"), table_name="chatmessage")
    op.drop_index(op.f("ix_chatmessage_message_id"), table_name="chatmessage")
    op.drop_table("chatmessage")
    op.drop_index(op.f("ix_chatsession_user_id"), table_name="chatsession")
    op.drop_index(op.f("ix_chatsession_session_id"), table_name="chatsession")
    op.drop_table("chatsession")
    op.drop_index(op.f("ix_user_user_id"), table_name="user")
    op.drop_table("user")
    # ### end Alembic commands ###
