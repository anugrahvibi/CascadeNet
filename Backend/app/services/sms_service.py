import asyncio
import logging
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Setup basic logging for the tactical gateway
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TacticalSMS")

# --- Load credentials from environment ---
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE = os.getenv("TWILIO_PHONE", "")


async def dispatch_tactical_sms(phone_number: str, message: str):
    """
    Sends a real SMS — tries Twilio first, then Fast2SMS, then simulation.
    Configure in Backend/.env
    """
    logger.info(f"[SMS GATEWAY] Initializing encrypted link for {phone_number}...")

    loop = asyncio.get_event_loop()

    # --- Priority 1: Twilio (reliable, free trial works with India) ---
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_PHONE:
        try:
            result = await loop.run_in_executor(
                None, lambda: _send_twilio(phone_number, message)
            )
            if result:
                logger.info(f"[SMS GATEWAY] ✅ TWILIO SMS SENT to {phone_number}")
                return
        except Exception as e:
            logger.error(f"[SMS GATEWAY] Twilio error: {e}")

    # --- Priority 2: Fast2SMS (India-specific, requires ₹100 recharge for API) ---
    if FAST2SMS_API_KEY and FAST2SMS_API_KEY != "YOUR_FAST2SMS_API_KEY_HERE":
        try:
            result = await loop.run_in_executor(
                None, lambda: _send_fast2sms(phone_number, message)
            )
            if result:
                logger.info(f"[SMS GATEWAY] ✅ FAST2SMS SMS SENT to {phone_number}")
                return
        except Exception as e:
            logger.error(f"[SMS GATEWAY] Fast2SMS error: {e}")

    # --- Fallback: Simulation Mode ---
    await asyncio.sleep(0.3)
    logger.warning(
        f"\n{'='*60}\n"
        f"[SMS GATEWAY] ⚠️  SIMULATION MODE\n"
        f"  ➤ Target  : {phone_number}\n"
        f"  ➤ Message : {message}\n"
        f"  To send REAL SMS, add credentials to Backend/.env\n"
        f"{'='*60}"
    )


def _send_twilio(phone_number: str, message: str) -> bool:
    """Send via Twilio REST API."""
    try:
        from twilio.rest import Client

        clean_number = phone_number.replace(" ", "").strip()
        # Ensure +91 prefix for India
        if not clean_number.startswith("+"):
            clean_number = f"+91{clean_number}"

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE,
            to=clean_number
        )
        logger.info(f"[SMS GATEWAY] Twilio SID: {msg.sid} | Status: {msg.status}")
        return msg.sid is not None
    except Exception as e:
        logger.error(f"[SMS GATEWAY] Twilio exception: {e}")
        return False


def _send_fast2sms(phone_number: str, message: str) -> bool:
    """Send via Fast2SMS API (requires ₹100 recharge on the account)."""
    try:
        clean_number = phone_number.replace("+91", "").replace(" ", "").strip()

        headers = {
            "authorization": FAST2SMS_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "route": "q",
            "message": message,
            "language": "english",
            "flash": 0,
            "numbers": clean_number
        }

        response = requests.post(
            "https://www.fast2sms.com/dev/bulkV2",
            json=payload,
            headers=headers,
            timeout=10
        )
        data = response.json()
        logger.info(f"[SMS GATEWAY] Fast2SMS Response: {data}")
        return data.get("return") is True
    except Exception as e:
        logger.error(f"[SMS GATEWAY] Fast2SMS exception: {e}")
        return False


def send_sms_background(phone_number: str, message: str):
    """Sync wrapper — not used directly."""
    pass
