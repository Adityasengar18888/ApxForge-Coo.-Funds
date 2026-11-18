from apscheduler.schedulers.background import BackgroundScheduler
from backend.app.core.logging import logger

scheduler = BackgroundScheduler()

def sample_background_job():
    logger.info("Executing scheduled market accuracy tracking & data check...")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(sample_background_job, 'interval', minutes=30, id='market_check', replace_existing=True)
        scheduler.start()
        logger.info("APScheduler background service started successfully.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler background service shutdown.")

