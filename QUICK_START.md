# 🚀 Quick Start - Phone Number Verification

## What's New?
Users can now **optionally verify their phone number during signup** using OTP (One-Time Password).

---

## Quick Setup (5 Minutes)

### 1️⃣ **Configure Environment Variables**

**Frontend:** `Futuristic AI SaaS Website (Copy) (Copy)/.env`
```env
VITE_API_URL=http://localhost:4000/api
```

**Backend:** `server/.env`
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/cv-analyzer
```

### 2️⃣ **Start the Services**

```bash
# Terminal 1: Start Backend
cd server
npm start
# Server runs on http://localhost:4000

# Terminal 2: Start Frontend
cd "Futuristic AI SaaS Website (Copy) (Copy)"
npm run dev
# Frontend runs on http://localhost:5173
```

### 3️⃣ **Test Phone Verification**

1. Go to `http://localhost:5173`
2. Click **Sign Up**
3. Fill form: Name, Email, **Phone Number**, Password
4. Click **Sign Up**
5. See "Check Your Email" ✓
6. **New:** See "Verify Phone Number" option
7. Click **Send OTP**
8. **Check server console** → Look for: `📱 OTP for +1234567890: 123456`
9. Copy the OTP from console
10. Paste into app and click **Verify OTP**
11. ✅ **Phone Verified!** → Auto-redirect to Login

---

## What Changed?

### **New Files**
- `PHONE_VERIFICATION_GUIDE.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `.env.example` files - Configuration templates

### **Modified Files**
- `server/controllers/authController.js` - OTP logic
- `server/routes/auth.js` - OTP endpoints
- `src/app/components/Authmodals.tsx` - Phone verification UI

### **New API Endpoints**
```
POST /api/auth/send-otp    - Send OTP to phone
POST /api/auth/verify-otp  - Verify OTP & save to database
```

---

## How It Works (User View)

```
[Signup] → [Email Verification] → [Phone Verification (NEW)]
                                         ↓
                                 [Verify with OTP]
                                         ↓
                                [Phone Saved ✓]
                                         ↓
                                     [Login]
```

---

## Key Features

✅ **Optional** - Users can skip phone verification  
✅ **Secure** - OTP expires after 10 minutes  
✅ **Validated** - Phone number format checked  
✅ **Limited Attempts** - Max 5 failed attempts  
✅ **Persistent** - Phone saved to MongoDB after verification  
✅ **User Friendly** - Clear UI with error messages  

---

## Database Records

After phone verification, MongoDB will have:
```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "phoneNumber": "+1234567890",
  "phoneVerified": true,
  "emailVerified": true,
  "provider": "email"
}
```

---

## Testing OTP Values

Since OTP is logged to console in development:

**Server Console Output:**
```
📱 OTP for +1234567890: 123456 (Expires in 10 minutes)
```

Copy the **6-digit number** and paste into the app.

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| Can't see OTP | Check server console, ensure NODE_ENV=development |
| Phone field missing | Make sure you're on signup page |
| API not working | Verify server is running on port 4000 |
| DB not updating | Check MongoDB is running |
| "User not found" error | Clear Firebase auth data, try again |

---

## Files to Review

For more details, read these in order:

1. 📖 **IMPLEMENTATION_SUMMARY.md** - Overview & checklist
2. 📖 **PHONE_VERIFICATION_GUIDE.md** - Complete documentation
3. 💻 **Code** - Check the implementation:
   - Backend: `server/controllers/authController.js`
   - Frontend: `Futuristic.../components/Authmodals.tsx`
   - Routes: `server/routes/auth.js`

---

## Next Steps for Production

Before deploying to production:

1. **Replace In-Memory OTP** → Use Redis or database
2. **Setup Real SMS** → Integrate Twilio or AWS SNS
3. **Remove OTP from Response** → Don't return OTP in API
4. **Add Rate Limiting** → Prevent brute force attacks
5. **Setup Monitoring** → Log verification attempts
6. **Security Test** → Test all error cases

See **PHONE_VERIFICATION_GUIDE.md** for production setup.

---

## API Examples

### Send OTP
```bash
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "firebaseUid": "user_firebase_uid"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:4000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "otp": "123456",
    "firebaseUid": "user_firebase_uid"
  }'
```

---

## Support

- 📖 Read `PHONE_VERIFICATION_GUIDE.md` for complete docs
- 🐛 Check server/console logs for errors
- 💾 Verify MongoDB collections
- ⚙️ Check `.env` configuration

---

**Ready? Let's go! 🎉**

Start the server and frontend, then test the signup flow with phone verification!
