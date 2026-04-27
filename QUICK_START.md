# QUICK START: API Keys & Installation (5 Minutes)

## ⚡ Super Quick Summary

You need to:
1. **Get 2 API keys** (Free)
2. **Paste them in .env file**
3. **Run 1 npm command**
4. **Restart your server**

That's it! ✅

---

## Part A: GitHub Token (2 minutes)

### Step-by-Step

**1. Go to GitHub Settings**
- Visit: https://github.com/settings/tokens
- (Already logged in? Great! Not logged in? Click "Sign in" first)

**2. Create New Token**
- Click blue button: "Generate new token (classic)"

**3. Fill the Form**
```
Token name: IntelliMatch-API

Expiration: 90 days (or "No expiration")

Scopes (checkboxes):
  ☑ repo
  ☑ user  
  ☑ read:user
  ☑ public_repo
```

**4. Generate & Copy**
- Click green "Generate token" button
- **IMPORTANT:** Copy the token immediately (shown only once!)
- Looks like: `ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`

---

## Part B: Gmail App Password (2 minutes)

### Step 1: Enable 2-Factor Authentication (Required first!)

**Go to:** https://myaccount.google.com
- Click "Security" (left sidebar)
- Scroll to "2-Step Verification"
- Click it → Follow steps to enable 2FA with phone
- Verify and complete

### Step 2: Generate App Password

**Go to:** https://myaccount.google.com/apppasswords
- **App:** Choose "Mail"
- **Device:** Choose "Windows PC" (or your device type)
- Click "Generate"

**Copy the 16-character password**
- Looks like: `xxxx xxxx xxxx xxxx` (with spaces)
- **Remove spaces when pasting:** `xxxxxxxxxxxxxxxx`

---

## Part C: Add Keys to .env File (1 minute)

**Open file:** `backend/.env`

**Find these lines:**
```
GITHUB_API_TOKEN=
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

**Paste your values:**
```
GITHUB_API_TOKEN=ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
```

**Save the file!** (Ctrl+S)

---

## Part D: Install & Restart (1 minute)

**Open Terminal/PowerShell**

**Navigate to backend:**
```powershell
cd "e:\project471\final CSE471 PROJECT\CSE471 PROJECT\backend"
```

**Install nodemailer:**
```powershell
npm install nodemailer
```

**Restart backend:**
```powershell
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
[emailService] Gmail SMTP initialized successfully
```

---

## Part E: Verify It Works (1 minute)

### Test 1: Check GitHub in Console
```powershell
node -e "
const https = require('https');
const token = 'YOUR_GITHUB_TOKEN_HERE';

const options = {
  hostname: 'api.github.com',
  path: '/user',
  method: 'GET',
  headers: {
    'Authorization': 'token ' + token,
    'User-Agent': 'IntelliMatch'
  }
};

https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ GitHub Token Works!');
    } else {
      console.log('❌ GitHub Token Invalid');
    }
  });
}).end();
"
```

### Test 2: Check Gmail
When you:
- Submit an application
- Update application status (Reject/Shortlist/Select)

Look at your email inbox → You should get an email! ✅

---

## Where Did I Add These?

### GitHub Integration
- **File:** `backend/utils/githubService.js` (NEW)
- **What it does:** Analyzes your GitHub repos and extracts programming skills
- **Endpoint:** `POST /api/student/github-skills/{username}`

### Gmail Integration
- **File:** `backend/utils/emailService.js` (NEW)
- **What it does:** Sends beautiful HTML emails to students
- **Triggers:**
  - Application submitted ✉️
  - Application status changed ✉️
  - Deadline reminder ✉️
  - Interview reminder ✉️

### Updated Files
- `backend/controllers/studentController.js` - GitHub import feature
- `backend/controllers/applicationController.js` - Email on status change
- `backend/utils/notificationService.js` - Now sends emails too

---

## How to Use From Frontend

### Feature 1: Import GitHub Skills
```javascript
// When student enters their GitHub username
const response = await axios.post(
  '/api/student/github-skills/torvalds'
);

// Gets back:
{
  message: "Skills imported from GitHub successfully",
  importedCount: 5,  // New skills added
  totalSkills: 12,   // Total after import
  githubData: {
    languages: ["C", "Shell"],
    topics: ["linux", "kernel"]
  }
}
```

### Feature 2: Automatic Email Notifications
```javascript
// When status changes (automatic)
// PUT /api/application/:id/status
// With body: { status: "Shortlisted" }

// Student automatically gets email:
// Subject: "Application Status Updated - Shortlisted"
// With formatted HTML showing:
// - Position name
// - New status
// - Call to action
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "GitHub token not found" | Make sure you pasted it in `.env` file and restarted backend |
| "Gmail password not working" | Must use 16-char App Password, not your regular Gmail password |
| "Emails not sending" | Check console for errors, verify 2FA is enabled |
| "GitHub user not found" | Username is case-sensitive, user must have public repos |
| "TypeError: nodemailer is not defined" | Run `npm install nodemailer` and restart |

---

## ✅ Checklist

- [ ] Generated GitHub token
- [ ] Generated Gmail App Password
- [ ] Added both to `.env` file
- [ ] Ran `npm install nodemailer`
- [ ] Restarted backend (`npm run dev`)
- [ ] Saw "Gmail SMTP initialized" in console
- [ ] Tested by submitting application
- [ ] Received test email

---

## FAQ

**Q: Is this free?**
A: Yes! Both GitHub API and Gmail are free to use.

**Q: Will my keys be exposed?**
A: No, they're in `.env` which is NOT pushed to Git (in .gitignore).

**Q: What if I lose my GitHub token?**
A: Generate a new one at https://github.com/settings/tokens

**Q: Can I use my regular Gmail password?**
A: No, Gmail requires an App Password for third-party apps since 2022.

**Q: How many emails can I send?**
A: Gmail allows thousands per day (you'll never hit the limit).

**Q: Does this work with 2 terminals?**
A: Yes! Backend on port 5000, Frontend on 5173 - completely independent.

---

## Still Stuck?

Check the logs:

**Backend Logs** (shows email/GitHub errors):
```
[emailService] Email sent to student@email.com
[githubService] Fetched skills for torvalds
[notificationService] Notification created
```

**If you see errors**, copy them and:
1. Check spelling in `.env`
2. Check tokens are complete
3. Verify files exist: `backend/utils/emailService.js`
4. Restart backend

---

**That's it! You're all set. The code is ready, just add your API keys!** 🚀

