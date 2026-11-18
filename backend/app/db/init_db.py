from sqlmodel import SQLModel, Session, select
from backend.app.db.session import engine
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash, verify_password
from backend.app.core.logging import logger
from backend.app.models.user import User

def init_db():
    SQLModel.metadata.create_all(engine)
    seed_admin()

def seed_admin():
    with Session(engine) as session:
        statement = select(User).where(User.username == settings.DEFAULT_ADMIN_USER)
        admin_user = session.exec(statement).first()

        if not admin_user:
            logger.info(f"Seeding default admin user '{settings.DEFAULT_ADMIN_USER}'...")
            admin_user = User(
                username=settings.DEFAULT_ADMIN_USER,
                email=settings.DEFAULT_ADMIN_EMAIL,
                full_name="System Administrator",
                role="admin",
                is_active=True,
                must_change_password=True,
                hashed_password=get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)
            )
            session.add(admin_user)
            session.commit()
            logger.warning(
                "====================================================================\n"
                "  SECURITY WARNING: Default admin account created with credentials:\n"
                f"  Username: {settings.DEFAULT_ADMIN_USER}\n"
                f"  Password: {settings.DEFAULT_ADMIN_PASSWORD}\n"
                "  Please change this password immediately via /api/v1/auth/change-password\n"
                "===================================================================="
            )
        else:
            # Check if default password is still active
            if verify_password(settings.DEFAULT_ADMIN_PASSWORD, admin_user.hashed_password):
                logger.warning(
                    "====================================================================\n"
                    "  SECURITY WARNING: Default admin password 'admin123' is STILL active!\n"
                    "  Change it immediately in the web interface or API!\n"
                    "===================================================================="
                )
