# Phone Number Verification Implementation

## Overview
This implementation adds **One-Time Password (OTP) based phone number verification** to your CV-Analyzer application. After users sign up with their email, they can optionally verify their phone number before logging in.

## Features

### ✅ What's Implemented
1. **Phone Number Collection**: Users can provide their phone number during signup (optional)
2. **OTP Generation**: System generates a 6-digit OTP valid for 10 minutes
3. **OTP Delivery**: OTP is sent to the user's phone number (demo: logs to console)
4. **OTP Verification**: Users enter OTP to verify their phone number
5. **Database Persistence**: Verified phone numbers and status saved to MongoDB
6. **User Experience**: Clean UI with phone verification screens

---

## How It Works

### **Signup Flow**
1. User fills signup form with: **Full Name**, **Email**, **Phone (optional)**, **Password**
2. Account is created in Firebase
3. Email verification link is sent
4. User is shown "Check Your Email" screen
5. If phone number was provided, **"Verify Phone Number"** option appears
6. User clicks "Send OTP" → OTP is sent to their phone
7. User enters the 6-digit OTP
8. Phone number is marked as verified in MongoDB
9. User is redirected to login

### **Database Fields Used**
```javascript
// In User model (MongoDB):
{
  phoneNumber: String,      // Stored phone number
  phoneVerified: Boolean,   // Verification status (default: false)
  provider: String          // Auth provider (phone, email, google, etc)
}
```

---

## API Endpoints

### 1. **Send OTP**
```
POST /api/auth/send-otp
Content-Type: application/json

Body:
{
  "phoneNumber": "+1234567890",
  "firebaseUid": "user_firebase_uid"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent to your phone number",
  "otp": "123456" // Only in development mode
}

Response (Error):
{
  "success": false,
  "message": "Invalid phone number format"
}
```

### 2. **Verify OTP**
```
POST /api/auth/verify-otp
Content-Type: application/json

Body:
{
  "otp": "123456",
  "firebaseUid": "user_firebase_uid"
}

Response (Success):
{
  "success": true,
  "message": "Phone number verified successfully!",
  "user": {
    "id": "mongodb_id",
    "phoneNumber": "+1234567890",
    "phoneVerified": true
  }
}

Response (Error):
{
  "success": false,
  "message": "Invalid OTP. 4 attempts remaining."
}
```

---

## Frontend Components Modified

### **Authmodals.tsx**
New state variables:
```typescript
const [showPhoneVerification, setShowPhoneVerification] = useState(false);
const [otpSent, setOtpSent] = useState(false);
const [otp, setOtp] = useState("");
const [phoneVerificationError, setPhoneVerificationError] = useState("");
const [phoneVerificationSuccess, setPhoneVerificationSuccess] = useState(false);
```

New functions:
```typescript
handleSendOTP()       // Sends OTP to phone number
handleVerifyOTP()     // Verifies OTP and saves to database
```

---

## Backend Changes

### **authController.js** - New Functions
1. **`sendPhoneOTP()`**
   - Validates phone number format
   - Generates 6-digit OTP
   - Stores in memory with 10-minute expiry
   - Returns OTP in development mode for testing

2. **`verifyPhoneOTP()`**
   - Validates OTP
   - Checks expiry (10 minutes)
   - Limits attempts to 5
   - Updates MongoDB user record
   - Clears OTP from memory

### **auth.js** - New Routes
```javascript
router.post("/send-otp", sendPhoneOTP);
router.post("/verify-otp", verifyPhoneOTP);
```

---

## Security Features

✅ **OTP Expiry**: 10 minutes  
✅ **Attempt Limit**: Maximum 5 failed attempts  
✅ **Phone Validation**: Regex validation (9-15 digits)  
✅ **User Verification**: Validates firebaseUid before processing  
✅ **Error Messages**: Generic messages to prevent user enumeration  

---

## Configuration

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:4000/api
```

### **Backend (.env)**
No special configuration needed. The OTP is currently stored in-memory.

---

## Production Deployment Notes

### ⚠️ Current Limitations (Development)
- OTP is **stored in-memory** (resets on server restart)
- OTP is **logged to console** (not sent via SMS)
- OTP is **returned in API response** (for testing)

### 🚀 For Production
1. **Use a persistent cache** (Redis) instead of in-memory storage:
```javascript
import redis from 'redis';
const client = redis.createClient();

// Store OTP in Redis
await client.setex(`otp_${firebaseUid}`, 600, JSON.stringify(otpData));
```

2. **Integrate SMS service** (Twilio, AWS SNS, etc):
```javascript
// Example: Twilio
import twilio from 'twilio';
const client = twilio(accountSid, authToken);

await client.messages.create({
  body: `Your CV-Analyzer OTP is: ${otp}`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phoneNumber
});
```

3. **Remove OTP from response** (security):
```javascript
// Remove this in production:
...(process.env.NODE_ENV === "development" && { otp })
```

4. **Add rate limiting** to prevent brute force:
```javascript
import rateLimit from 'express-rate-limit';
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3 // 3 requests per window
});
router.post("/send-otp", otpLimiter, sendPhoneOTP);
```

---

## Usage Examples

### **Test OTP Verification**
1. Start the server: `npm start` (server)
2. Start the frontend: `npm run dev` (frontend)
3. Sign up with a valid email and phone number
4. Check the **server console** for OTP (example: `📱 OTP for +1234567890: 123456`)
5. Enter the OTP in the UI
6. Phone number is verified ✅

### **Testing Invalid Cases**
- **Invalid Phone**: Try `abc` → Error message
- **Wrong OTP**: Try any 6 random digits → Error with attempts remaining
- **Expired OTP**: Wait 10+ minutes → "OTP has expired"
- **Too Many Attempts**: Fail 5+ times → "Too many failed attempts"

---

## Files Modified

```
✏️  server/controllers/authController.js  → Added sendPhoneOTP(), verifyPhoneOTP()
✏️  server/routes/auth.js                 → Added OTP endpoints
✏️  Futuristic.../Authmodals.tsx          → Added phone verification UI & logic
📄  server/.env.example                   → Created with required variables
📄  Frontend/.env.example                 → Created with required variables
```

---

## User Flow Diagram

```
┌─────────────┐
│   Signup    │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ Email Verification   │ ← User verifies email
└──────────┬───────────┘
           │
           ▼
    ┌──────────────┐
    │ Phone Given? │
    └──┬───────┬───┘
       │       │
      YES     NO
       │       │
       ▼       ▼
  ┌──────┐  ┌──────┐
  │ OTP  │  │Login │
  │Send  │  │      │
  └──┬───┘  └──────┘
     │
     ▼
┌──────────────┐
│  OTP Input   │ ← User enters OTP
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Verification    │
│  Successful      │
└──────┬───────────┘
       │
       ▼
   ┌──────┐
   │Login │
   └──────┘
```

---

## FAQ

**Q: Is phone verification mandatory?**  
A: No, it's optional. Users can skip it and login after email verification.

**Q: What if user doesn't receive OTP?**  
A: In production, ensure SMS service is properly configured. In development, check server console.

**Q: Can users update their phone number later?**  
A: Currently, this is only available during signup. You can extend this in the future.

**Q: What happens if Firebase UID is invalid?**  
A: API returns 404 error with "User not found" message.

**Q: How are OTPs stored securely?**  
A: Currently in-memory (for demo). Use Redis + hashing in production.

---

## Support & Troubleshooting

### **OTP Not Appearing?**
- Check server console logs: `📱 OTP for...`
- Ensure `NODE_ENV=development` in `.env`
- Verify `firebaseUid` is correct

### **Phone Verification UI Not Showing?**
- Make sure phone number was entered during signup
- Check console for any errors
- Verify API endpoint is accessible

### **Database Not Updating?**
- Check MongoDB connection
- Verify User model has `phoneNumber` and `phoneVerified` fields
- Check server logs for create/update errors

---

Generated: February 20, 2026  
Version: 1.0
