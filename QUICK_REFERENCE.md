# Quick Reference Card - API Integration Setup

## Copy & Paste URLs

### GitHub Token
```
https://github.com/settings/tokens
```

### Gmail App Password
```
https://myaccount.google.com/apppasswords
```

---

## .env File Template

```env
# Existing keys (don't change)
MONGO_URI=mongodb://...
JWT_SECRET=super_secret_jwt_key_here
AFFINDA_API_KEY=aff_...
OPENAI_API_KEY=mock
AFFINDA_WORKSPACE_ID=YjHedqJD

# NEW: Add these three lines
GITHUB_API_TOKEN=                    # Paste: ghp_xxxxx
GMAIL_USER=                          # Paste: your-email@gmail.com
GMAIL_APP_PASSWORD=                  # Paste: xxxxxxxxxxxxxxxx
GMAIL_FROM_NAME=IntelliMatch Notifications
```

---

## Command Line Copy-Paste

### Install nodemailer
```powershell
npm install nodemailer
```

### Start backend
```powershell
npm run dev
```

### Navigate to backend folder
```powershell
cd "e:\project471\final CSE471 PROJECT\CSE471 PROJECT\backend"
```

---

## API Endpoints Added

### GitHub Skills Import
```
POST /api/student/github-skills/{githubUsername}
Authorization: Bearer {jwt_token}
```

**Example:**
```
POST /api/student/github-skills/torvalds
```

**Response:**
```json
{
  "message": "Skills imported from GitHub successfully",
  "importedCount": 5,
  "totalSkills": 12,
  "profile": { ... },
  "githubData": { ... }
}
```

---

## Email Events

### Automatic Emails Sent For:

1. **Application Submitted**
   - To: Company/Admin
   - Content: New application notification

2. **Status: Shortlisted**
   - To: Student
   - Subject: "Application Status Updated - Shortlisted"

3. **Status: Rejected**
   - To: Student  
   - Subject: "Application Status Updated - Rejected"

4. **Status: Selected**
   - To: Student
   - Subject: "Application Status Updated - Selected"

5. **Deadline Reminder**
   - To: Student
   - Subject: "Upcoming Deadline for [Position]"

6. **Interview Scheduled**
   - To: Student
   - Subject: "Interview Scheduled for [Position]"

---

## Files Modified/Created

### New Files (2)
```
backend/utils/emailService.js
backend/utils/githubService.js
```

### Updated Files (5)
```
backend/controllers/studentController.js
backend/controllers/applicationController.js
backend/routes/studentRoutes.js
backend/utils/notificationService.js
backend/.env
```

### Documentation (5 guides)
```
QUICK_START.md
API_INTEGRATION_GUIDE.md
ARCHITECTURE_API_INTEGRATION.md
INTEGRATION_COMPLETE.md
SETUP_ACTION_PLAN.md
```

---

## Step 1: GitHub Token (2 min)

1. Open: https://github.com/settings/tokens
2. Click: "Generate new token (classic)"
3. **Token name:** IntelliMatch-API
4. **Expiration:** 90 days
5. **Scopes:** Check these:
   - ☑ repo
   - ☑ user
   - ☑ read:user
   - ☑ public_repo
6. Click "Generate token"
7. **Copy immediately** (won't see again)

**Looks like:** `ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`

---

## Step 2: Gmail App Password (2 min)

### First: Enable 2FA
1. Go: https://myaccount.google.com
2. Click: Security
3. Find: 2-Step Verification
4. Enable it (verify with phone)

### Then: Get App Password
1. Go: https://myaccount.google.com/apppasswords
2. App: **Mail**
3. Device: **Windows PC** (your device)
4. Click: Generate
5. **Copy password** (16 characters with spaces)
6. **Remove spaces** when pasting

**Looks like:** `xxxx xxxx xxxx xxxx` → `xxxxxxxxxxxxxxxx`

---

## Step 3: Update .env (1 min)

**File location:**
```
e:\project471\final CSE471 PROJECT\CSE471 PROJECT\backend\.env
```

**Find these lines:**
```
GITHUB_API_TOKEN=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

**Replace with:**
```
GITHUB_API_TOKEN=ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

**Save:** Ctrl+S

---

## Step 4: Install & Restart (2 min)

**Open PowerShell, run:**

```powershell
cd "e:\project471\final CSE471 PROJECT\CSE471 PROJECT\backend"
npm install nodemailer
npm run dev
```

**Look for:**
```
✅ Connected to MongoDB
🚀 Server running on port 5000
[emailService] Gmail SMTP initialized successfully
```

---

## Test Checklist

- [ ] GitHub token obtained
- [ ] Gmail app password obtained
- [ ] .env file updated
- [ ] nodemailer installed
- [ ] Backend restarted
- [ ] See "Gmail SMTP initialized" message
- [ ] Submit test application
- [ ] Check email inbox
- [ ] Change application status
- [ ] Receive status email

---

## Console Messages

### Success Messages
```
[emailService] Gmail SMTP initialized successfully
[githubService] Fetched skills for username
[notificationService] Notification created
[emailService] Email sent to student@email.com
```

### Error Messages
```
[emailService] Gmail credentials not configured
  → Add GMAIL_USER and GMAIL_APP_PASSWORD to .env

[githubService] GitHub user not found
  → Check username spelling

[emailService] Failed to send email
  → Check console for detailed error
```

---

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| Email won't send | Restart backend after updating .env |
| GitHub token invalid | Check token copied completely |
| Gmail app password not working | Use 16-char password, not regular password |
| "Cannot find module nodemailer" | Run: `npm install nodemailer` |
| Backend won't start | Check .env syntax, no extra spaces |

---

## Frontend Testing

### Test in Browser

```javascript
// In browser console or component

// Test 1: Import GitHub skills
const response = await fetch('/api/student/github-skills/torvalds', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
const data = await response.json();
console.log(data);

// Should show: { importedCount: 5, totalSkills: 12, ... }
```

---

## Email Template Example

```
Subject: Application Status Updated - Shortlisted

┌─────────────────────────────────────┐
│        IntelliMatch                 │
│     Internship Portal               │
├─────────────────────────────────────┤
│ Hi John,                            │
│                                     │
│ 🎉 Great news!                      │
│ You have been shortlisted!          │
│                                     │
│ Position: Software Engineer         │
│ Status: Shortlisted                 │
│                                     │
│ Log in to view more details         │
└─────────────────────────────────────┘
```

---

## Rate Limits

### GitHub API
- **Limit:** 5,000 requests/hour (authenticated)
- **Per user:** 60 requests/hour (unauthenticated)
- **Reset:** 1 hour

### Gmail SMTP
- **Limit:** ~Thousands per day
- **Per minute:** Not publicly specified
- **Recommendation:** Batch emails if needed

---

## API Key Security

### DO's ✅
- Keep keys in `.env` file
- Add `.env` to `.gitignore` (already done)
- Regenerate if exposed
- Use app-specific passwords

### DON'Ts ❌
- Don't share keys in chat
- Don't commit `.env` to Git
- Don't use regular Gmail password
- Don't put keys in frontend code

---

## Restart Commands

### Restart Backend
```powershell
npm run dev
```

### Restart Frontend
```powershell
npm run dev
```

(Run each in separate PowerShell window)

---

## Port Numbers

- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:5173
- **Database:** MongoDB Cloud (remote)

---

## After Setup

### Test Features
1. Submit application → Check email
2. Change status → Get email
3. Import GitHub skills → See skills added

### Monitor
1. Check console for logs
2. Verify database changes
3. Monitor email inbox

### Deploy
1. Update .env on production server
2. Restart backend on production
3. Test with real users

---

## Need Help?

### Check These Files (In Order)
1. `QUICK_START.md` - Quick reference
2. `API_INTEGRATION_GUIDE.md` - Detailed steps
3. `ARCHITECTURE_API_INTEGRATION.md` - Technical details
4. `INTEGRATION_COMPLETE.md` - Feature breakdown

### Check Console
```
Look for [emailService], [githubService], [notificationService] logs
```

### Check Backend Logs
```
Any [ERROR] messages will tell you exactly what's wrong
```

---

## Ready? Start Here ➡️ QUICK_START.md

