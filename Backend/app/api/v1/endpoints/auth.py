from fastapi import APIRouter, HTTPException, Body, BackgroundTasks
from pydantic import BaseModel
import random
import time
from ....services.sms_service import dispatch_tactical_sms

router = APIRouter()

# Simple in-memory store for demo (mocking a DB)
# In production, this would go into MongoDB
otp_store = {}

class OTPRequest(BaseModel):
    phone_number: str

class OTPVerify(BaseModel):
    phone_number: str
    otp: str
    role: str = "NDRF"

@router.post("/request-otp")
async def request_otp(payload: OTPRequest, background_tasks: BackgroundTasks):
    """Generates and 'sends' an OTP via SMS."""
    otp = str(random.randint(1000, 9999))
    # Store OTP with timestamp (valid for 5 mins)
    otp_store[payload.phone_number] = {
        "otp": otp,
        "expires": time.time() + 300
    }
    
    # Queue the SMS dispatch in the background
    background_tasks.add_task(
        dispatch_tactical_sms, 
        payload.phone_number, 
        f"Your CascadeNet Authorization Code is: {otp}. Valid for 5 minutes."
    )
    
    return {
        "success": True, 
        "message": f"Clearance code dispatched to {payload.phone_number}"
    }

@router.post("/verify-otp")
async def verify_otp(payload: OTPVerify):
    """Verifies the OTP and 'logs in' the user."""
    stored_data = otp_store.get(payload.phone_number)
    
    if not stored_data:
        raise HTTPException(status_code=400, detail="OTP not requested for this number")
    
    if time.time() > stored_data["expires"]:
        del otp_store[payload.phone_number]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if payload.otp != stored_data["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    # Success
    del otp_store[payload.phone_number]
    return {
        "success": True,
        "user": {
            "phone_number": payload.phone_number,
            "role": payload.role,
            "token": f"tactical_token_{payload.phone_number}"
        }
    }
