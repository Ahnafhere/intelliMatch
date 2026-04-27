# Architecture: GitHub & Gmail Integration

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     IntelliMatch Platform                    │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────┐              ┌───────────────────────┐
│   FRONTEND (React)    │              │  BACKEND (Express)    │
│   Port 5173          │◄────────────►│  Port 5000            │
│                      │              │                        │
│ - Student Dashboard  │              │ - API Routes          │
│ - Profile Manager    │              │ - Controllers         │
│ - Notifications      │              │ - Business Logic      │
└───────────────────────┘              └───────────────────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
        ┌───────────▼────────────┐  ┌──────────▼────────────┐  ┌──────────▼────────────┐
        │   MongoDB (Database)   │  │   GitHub API          │  │   Gmail SMTP         │
        │   - Users              │  │   - Fetch repos       │  │   - Send emails      │
        │   - Profiles           │  │   - Extract skills    │  │   - Notifications    │
        │   - Applications       │  │   - Languages & topics│  │   - Status updates   │
        │   - Notifications      │  │                       │  │   - Reminders        │
        │   - Internships        │  │   Authentication:     │  │                       │
        │                        │  │   GitHub Token        │  │   Authentication:    │
        │                        │  │   (Personal Access)   │  │   Gmail App Password │
        └────────────────────────┘  └───────────────────────┘  └──────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Student Imports GitHub Skills

```
STUDENT
   │
   ├─ Enters GitHub username
   │
   ▼
FRONTEND
   │
   ├─ POST /api/student/github-skills/{username}
   │  (Header: Authorization: Bearer {token})
   │
   ▼
BACKEND (studentController.js)
   │
   ├─ importGitHubSkills() function called
   │
   ▼
GITHUB API (githubService.js)
   │
   ├─ authenticate with GITHUB_API_TOKEN
   ├─ fetch /users/{username}/repos
   ├─ analyze languages
   ├─ extract topics
   │
   ▼
RESPONSE:
   ├─ List of languages found
   ├─ List of topics (skills)
   ├─ Proficiency levels
   │
   ▼
BACKEND (studentController.js)
   │
   ├─ merge with existing skills
   ├─ update Student Profile
   ├─ save to MongoDB
   │
   ▼
FRONTEND
   │
   └─ Display: "5 new skills imported!"
      - C (Expert)
      - JavaScript (Advanced)
      - Linux (Intermediate)
```

### Flow 2: Application Status Change → Email Notification

```
COMPANY/ADMIN
   │
   ├─ Changes application status
   │  (Shortlist / Reject / Select)
   │
   ▼
FRONTEND
   │
   ├─ PUT /api/application/:id/status
   │  Body: { status: "Shortlisted" }
   │  (Header: Authorization: Bearer {token})
   │
   ▼
BACKEND (applicationController.js)
   │
   ├─ updateApplicationStatus() called
   ├─ validate status
   ├─ check authorization
   ├─ update application in MongoDB
   ├─ call notify() function
   │
   ▼
NOTIFICATION SERVICE (notificationService.js)
   │
   ├─ create database notification
   │
   ├─ PARALLEL: send email
   │  │
   │  ▼
   │  EMAIL SERVICE (emailService.js)
   │  │
   │  ├─ authenticate with GMAIL_USER + GMAIL_APP_PASSWORD
   │  ├─ connect to Gmail SMTP
   │  ├─ format HTML email
   │  │  (includes status, internship name, CTA)
   │  ├─ send via nodemailer
   │  │
   │  ▼
   │  GMAIL SERVERS
   │  │
   │  ├─ queue email
   │  ├─ send to student email
   │  │
   │  ▼
   │  STUDENT INBOX
   │  │
   │  └─ ✉️ Email arrives!
   │     "Your application is Shortlisted"
   │
   ▼
DATABASE
   │
   └─ notification record saved
      + email delivery logged
```

### Flow 3: Deadline Reminder Email

```
STUDENT (waiting for deadline)
   │
   └─ (no action, automatic)

BACKEND (scheduled or on request)
   │
   ├─ processDeadlineRemindersForStudent()
   │
   ▼
NOTIFICATION SERVICE
   │
   ├─ find applications with upcoming deadlines
   ├─ check if reminder already sent
   ├─ create notifications
   ├─ call sendDeadlineReminderEmail()
   │
   ▼
EMAIL SERVICE
   │
   ├─ format deadline reminder email
   ├─ include:
   │  - Internship title
   │  - Deadline date
   │  - Call to action
   │
   ▼
GMAIL SMTP → STUDENT INBOX
   │
   └─ ⏰ "Deadline reminder: Apply by April 30, 2026"
```

---

## Integration Points with Existing Features

### 1. Registration & Login System
```
Current: ✅ User registration, email, password hashing
New: 📧 Can send confirmation email on registration
New: 🔗 Can link GitHub profile during setup
```

### 2. Student Profile & Skill Management  
```
Current: ✅ Manual skill entry
Current: ✅ CV upload and parsing with Affinda API
New: 🔄 AUTO-FILL from GitHub (automatic)
New: 📊 Skills ranked by frequency/proficiency
New: 🔗 GitHub profile link stored
```

### 3. AI-Based Skill Matching
```
Current: ✅ Match Score calculation
New: 🎯 Uses GitHub-imported skills
New: 📈 Better coverage of student skills
   (combines manual + GitHub + CV parsing)
```

### 4. Dashboard & Analytics
```
Current: ✅ Department placement ratios
Current: ✅ Top in-demand skills
New: 📊 Can show email delivery stats
New: 📈 Track notification engagement
New: 🔍 Analyze most common GitHub skills
```

### 5. Notification System
```
Current: ✅ Database notifications
Current: ✅ Deadline/Interview reminders
New: 📧 EMAILS sent automatically
New: 🎨 HTML formatted emails
New: 📬 Status update emails
New: 🔔 System-wide email support
```

---

## Data Model Changes

### StudentProfile Model (Added field)
```javascript
{
  userId: ObjectId,
  name: String,
  cgpa: Number,
  department: String,
  skills: [
    {
      name: String,
      proficiency: String,  // "Beginner", "Intermediate", "Advanced", "Expert"
      endorsements: Number,
      addedAt: Date
    }
  ],
  // NEW FIELDS:
  githubProfile: {
    username: String,
    profileUrl: String,
    repoCount: Number,
    lastImported: Date
  }
}
```

### Notification Model (No change needed)
```javascript
// Already supports emails through notificationService
{
  userId: ObjectId,
  type: String,  // APPLICATION_SUBMITTED, STATUS_UPDATED, etc.
  title: String,
  message: String,
  metadata: Object,
  isRead: Boolean,
  readAt: Date,
  createdAt: Date
}
```

---

## API Endpoints Summary

### GitHub Integration Endpoint
```
POST /api/student/github-skills/:githubUsername
Authorization: Bearer {jwt_token}

Request:
  Params: { githubUsername: "torvalds" }

Response: 200 OK
{
  message: "Skills imported from GitHub successfully",
  importedCount: 5,
  totalSkills: 12,
  profile: { /* updated profile */ },
  githubData: {
    username: "torvalds",
    languages: [
      { name: "C", proficiency: "Expert", frequency: 45 },
      { name: "Shell", proficiency: "Advanced", frequency: 23 }
    ],
    topics: ["linux", "kernel", "git"],
    repoCount: 50,
    profileUrl: "https://github.com/torvalds",
    lastUpdated: "2024-04-26T10:30:00Z"
  }
}

Error: 400 Bad Request
{
  message: "Failed to import GitHub skills",
  error: "GitHub user not found"
}
```

### Email Notification (Internal)
```
// Called automatically by notify() function
// No direct API endpoint

Example scenarios:
1. Application submitted
   → notify() sends email to company

2. Status changed to "Shortlisted"
   → notify() sends email to student
   → sendApplicationStatusEmail() sends formatted email

3. Deadline approaching
   → processDeadlineRemindersForStudent() called
   → sendDeadlineReminderEmail() sends email

4. Interview scheduled
   → sendInterviewReminderEmail() sends email
```

---

## Authentication & Security

### GitHub API Token
```
Type: Personal Access Token (Classic)
Scope: Limited to public data access
Expiration: Can be set to 90 days or no expiration
Storage: .env file (not committed to Git)
Risk: Low - read-only public data
Revocation: Easy - regenerate at https://github.com/settings/tokens
```

### Gmail App Password
```
Type: Application-Specific Password
Scope: SMTP email sending only
Uses: Separate from main Gmail password
Expiration: Can be revoked anytime
Storage: .env file (not committed to Git)
Risk: Low - separate from main account
Setup: Requires 2-Factor Authentication enabled
Revocation: Delete from https://myaccount.google.com/apppasswords
```

### JWT Token Flow
```
Student logs in
   ↓
Server creates JWT token
   ↓
Token stored in localStorage (frontend)
   ↓
Sent in Authorization header for each request
   ↓
Backend verifies token with JWT_SECRET
   ↓
Request authenticated ✅
```

---

## Error Handling

### GitHub Service Errors
```
- "GitHub user not found" (404)
  → Username doesn't exist
  → Check spelling

- "Invalid token" (401)
  → Token expired or revoked
  → Generate new token

- "Rate limit exceeded" (403)
  → Made too many requests
  → Wait 1 hour or use authenticated token

- "Invalid GitHub response"
  → API format changed
  → Check GitHub API status
```

### Gmail Service Errors
```
- "Gmail credentials not configured"
  → Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env
  → Add credentials and restart

- "Access denied" (Auth failed)
  → Wrong password or not an App Password
  → Use 16-char App Password from apppasswords page

- "SMTP connection error"
  → Gmail servers unreachable
  → Check internet connection

- "Email validation failed"
  → Invalid recipient email
  → Verify student email in database
```

---

## Performance Considerations

### GitHub API
- **Rate limit:** 5,000 requests/hour (with authentication)
- **Per endpoint:** ~50ms response time
- **Cached:** Student profile stores lastImported timestamp
- **Best practice:** Cache results, don't fetch on every load

### Gmail SMTP
- **Rate limit:** Depends on Gmail account, thousands/day
- **Latency:** ~100-300ms to send
- **Async:** Email sending is non-blocking
- **Fallback:** If email fails, notification still saved to DB

### Database
- **New indexes:** Consider indexing `githubProfile.username`
- **Query time:** Unchanged for existing queries
- **Storage:** ~100 bytes per GitHub profile record

---

## Testing the Integration

### Manual Testing Steps

```bash
# 1. Test GitHub Token
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user

# 2. Test Gmail Connection
# Send a test email through the API
POST http://localhost:5000/api/application/:id/status
{
  "status": "Shortlisted"
}
# Check student email inbox

# 3. Test GitHub Import
POST http://localhost:5000/api/student/github-skills/torvalds
Authorization: Bearer {your_jwt_token}

# 4. Verify Database
# Check MongoDB for:
# - Notification created
# - Student profile updated with githubProfile
```

---

## Future Enhancements

### Possible Additions
1. **LinkedIn Integration** - Import skills from LinkedIn
2. **Stack Overflow Integration** - Fetch reputation/tags
3. **Email Templates** - Allow customization of email designs
4. **Email Analytics** - Track open rates, clicks
5. **Scheduled Emails** - Queue emails for specific time
6. **Email Preferences** - Let students opt-in/out of emails
7. **Bulk Email** - Send to multiple students efficiently
8. **Email History** - Archive sent emails in database

---

**All integrations are complete and tested!** 🎉

