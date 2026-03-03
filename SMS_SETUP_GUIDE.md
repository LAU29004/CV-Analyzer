# 📱 Phone OTP & SMS Setup Guide

## ❌ Current Issue

OTP is **NOT being sent to phone** - it's only being logged to the server console because **SMS service is not configured**.

## ✅ Solution: 3 Options

### **Option 1: Twilio (✅ RECOMMENDED - Industry Standard)**
- Real SMS delivery
- Free trial with $15 credit
- Easy setup (5 minutes)
- Works globally

### **Option 2: Firebase Phone Authentication**
- Built into Firebase
- No third-party service needed
- Slightly more complex setup

### **Option 3: AWS SNS**
- AWS SMS service
- Requires AWS account
- More complex billing

---

## 🚀 **Setup Option 1: Twilio (RECOMMENDED)**

### **Step 1: Create Twilio Account**

1. Go to https://www.twilio.com/try-twilio
2. Sign up (free account, get $15 credit)
3. Verify your email
4. Create a new project

### **Step 2: Get Your Credentials**

1. Go to Twilio Console: https://www.twilio.com/console
2. Copy these values:
   - **Account SID** (visible on main page)
   - **Auth Token** (click to reveal)
   - **Phone Number** (get it from Phone Numbers → Manage Numbers → Buy a Number)

**Example:**
```
Account SID:  AC123456789abcdef123456789abcdef1
Auth Token:   your_very_long_auth_token_here
Phone Number: +1234567890
```

### **Step 3: Install Twilio SDK**

```bash
cd server
npm install twilio
```

### **Step 4: Add to Your .env**

Create/update `server/.env`:
```dotenv
NODE_ENV=development
PORT=4000

# ... other config ...

# SMS Service
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC123456789abcdef123456789abcdef1
TWILIO_AUTH_TOKEN=your_very_long_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### **Step 5: Test It**

1. **Restart backend:**
   ```bash
   npm start
   ```

2. **Check server console:**
   - Should see: `✅ Twilio initialized`

3. **Sign up with phone number:**
   - Use your real phone number (in E.164 format: +1234567890)
   - Click "Send OTP"
   - **Check your phone for SMS** ✅

4. **Server logs:**
   - Should see: `✅ SMS sent successfully [SID: SM...]`

---

## 📱 **Phone Number Format**

Twilio requires **E.164 format:**

| Country | Example |
|---------|---------|
| USA | +1 (555) 123-4567 |
| India | +91 98765 43210 |
| UK | +44 20 7946 0958 |
| Germany | +49 30 123456 |
| Canada | +1 (555) 123-4567 |

**Format:** `+[country code][phone number without leading 0]`

### Valid Examples:
- ✅ `+14155552671` (USA)
- ✅ `+919876543210` (India)
- ✅ `+442071838750` (UK)

### Invalid Examples:
- ❌ `14155552671` (missing +)
- ❌ `+1 (415) 555-2671` (has spaces/parentheses)
- ❌ `0915555671` (leading 0)

---

## 🧪 **Testing Without Real SMS (Development)**

If you want to test without actually sending SMS:

**Solution:** Use Twilio's test credentials or keep API response OTP in development

```javascript
// In sendPhoneOTP function:
if (process.env.NODE_ENV === "development") {
  console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
  // Copy OTP from console and paste in app
}
```

---

## 🔥 **Common Issues**

### **Issue 1: "Twilio not initialized"**
```
⚠️ Twilio not initialized - OTP will only be logged to console
```
**Fix:**
- Check if `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are in `.env`
- Verify `.env` file is in the `server` folder
- Restart backend: `npm start`

### **Issue 2: "Invalid phone number"**
```
Invalid phone number format
```
**Fix:**
- Use E.164 format: `+1234567890`
- Include country code with `+` prefix
- No spaces, parentheses, or dashes

### **Issue 3: "Authentication failed"**
```
Twilio authentication failed
```
**Fix:**
- Double-check Account SID and Auth Token
- Make sure you copied the full token (it's long!
- No extra spaces in `.env`

### **Issue 4: "SMS not received"**
**Fix:**
- Check phone number format is E.164
- Verify phone number is not a test number
- Check Twilio console for message logs
- Verify Twilio account has sufficient credit ($0.0075 per SMS in USA)

---

## 💰 **Twilio Pricing**

- **Setup:** Free account with $15 credit
- **SMS Cost:** ~$0.0075 per message (USA)
- **Trial:** Requires verified phone to send to (your own number)
- **Production:** Can send to any number

---

## 🔒 **Firebase Auth - No Changes Needed**

Firebase Phone Authentication is **separate** from OTP SMS. We're using:

```
Firebase Email/Password Auth (for email signup)
     ↓
Phone OTP via Twilio (for phone verification)
     ↓
MongoDB (for storing user data)
```

**No Firebase auth changes required!** Your Firebase setup is fine as-is.

---

## 📋 **Implementation Summary**

### Files Created/Modified:

```
✏️  server/services/smsService.js
    → New SMS service abstraction
    → Supports Twilio, AWS SNS, etc.

✏️  server/controllers/authController.js
    → Updated sendPhoneOTP to use SMS service
    → Added SMS logging

✏️  server/server.js
    → Initialize Twilio on startup

✏️  server/.env.example
    → Added Twilio configuration

📦  package.json
    → Need to install: npm install twilio
```

---

## 🚀 **Quick Setup Checklist**

- [ ] Create Twilio account at https://www.twilio.com/try-twilio
- [ ] Get Account SID, Auth Token, and Phone Number
- [ ] Run: `npm install twilio` (in server folder)
- [ ] Add credentials to `server/.env`
- [ ] Restart backend: `npm start`
- [ ] Check console for `✅ Twilio initialized`
- [ ] Sign up with phone number in E.164 format
- [ ] Click "Send OTP"
- [ ] ✅ Receive SMS on phone!

---

## 🆘 **Still Not Working?**

1. **Check server logs:**
   ```
   ✅ Twilio initialized  // Good
   ❌ No such message    // Bad
   ```

2. **Verify .env file:**
   ```bash
   # Print current values (HIDE SENSITIVE DATA!)
   echo $TWILIO_ACCOUNT_SID
   ```

3. **Check Twilio Console:**
   - https://www.twilio.com/console
   - Go to Logs → Messages
   - See if message was sent/failed

4. **Test with Postman:**
   ```
   POST http://localhost:4000/api/auth/send-otp
   {
     "phoneNumber": "+1234567890",
     "firebaseUid": "test-uid-123"
   }
   ```

---

## 📞 **Need Help?**

- **Twilio Support:** https://support.twilio.com
- **GitHub Issues:** Document the error from server logs
- **Discord/Community:** Share the exact error message

---

**Version:** 1.0 | **Date:** February 20, 2026
