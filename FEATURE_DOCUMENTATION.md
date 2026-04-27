# CSE471 AI Skill Matching Engine - Feature Documentation

## Table of Contents
1. [Dashboard & Analytics System](#dashboard--analytics-system)
2. [Notification System](#notification-system)

---

## Dashboard & Analytics System

### 📌 Overview
The Dashboard & Analytics System provides real-time insights into internship placements, skill demands, and applicant performance. Different user roles (University Admins, Companies, Students) see different analytics tailored to their needs.

### 🎯 Features

#### **1. University Admin Dashboard**
- Total internship postings in the system
- Student placement ratio (Selected / Total Applications)
- Department-wise placement performance  
- Top in-demand skills in the market
- Department skill demand gaps
- Emerging skill trends

#### **2. Company Analytics Dashboard**
- Applicant statistics by status (Pending, Shortlisted, Selected, Rejected)
- Average match score per internship posting
- Skill coverage analysis for applicants
- Internship performance metrics

#### **3. Student Match Trends**
- Personal match trends over time
- Application status distribution
- Relevant skill recommendations

---

### 📂 Code File Structure

```
backend/
├── controllers/
│   └── analyticsController.js          ← Main analytics logic
├── routes/
│   └── analyticsRoutes.js               ← API endpoints
├── models/
│   ├── Internship.js                    ← Internship data
│   ├── Application.js                   ← Application data
│   └── StudentProfile.js                ← Student profile data
└── utils/
    └── matchingEngine.js                ← Skill matching logic

frontend/
├── pages/
│   ├── AdminDashboard.jsx               ← Admin dashboard UI
│   ├── CompanyDashboard.jsx             ← Company analytics UI
│   └── StudentDashboard.jsx             ← Student dashboard UI
```

---

### 🔧 Backend Implementation

#### **File: `backend/controllers/analyticsController.js`**

**Main Functions:**

1. **`getAdminDashboardAnalytics()`** - Lines 22-80
   - **What it does:** Collects all analytics data for university admins
   - **Step-by-step flow:**
     ```
     Step 1: Fetch all internships from database
     Step 2: Count total applications and selected applications
     Step 3: Get all student profiles
     Step 4: Create department mapping (total applications per dept)
     Step 5: Calculate department placement ratios
     Step 6: Build skill demand frequency map
     Step 7: Analyze skill gaps per department
     Step 8: Return compiled analytics object
     ```

   **Key Code Logic:**
   ```javascript
   // Example from the code (lines 35-45):
   const deptMap = new Map();
   for (const app of allApps) {
       const dept = profileMap.get(app.studentId.toString()) || 'Unknown';
       const entry = deptMap.get(dept) || { department: dept, total: 0, selected: 0, ratio: 0 };
       entry.total += 1;  // Count total applications
       deptMap.set(dept, entry);
   }
   ```

   **Returns:**
   ```json
   {
     "totalInternshipPostings": 15,
     "totalApplications": 120,
     "selectedApplications": 45,
     "studentPlacementRatio": 37.5,
     "departmentPlacement": [
       {
         "department": "Computer Science",
         "total": 80,
         "selected": 35,
         "ratio": 43.75
       }
     ],
     "topInDemandSkills": [
       { "skill": "React", "count": 12 },
       { "skill": "Node.js", "count": 10 }
     ]
   }
   ```

2. **`buildSkillDemand()`** - Lines 6-18
   - **What it does:** Creates a frequency map of all required skills across all internships
   - **Logic:**
     ```javascript
     const freq = new Map();
     for (const post of internships) {
       for (const req of post.requiredSkills || []) {
         // Count how many times each skill appears
         freq.set(key, (freq.get(key) || 0) + 1);
       }
     }
     // Return sorted by frequency (highest first)
     ```

3. **`getCompanyApplicantAnalytics()`** - Lines 82-130+
   - **What it does:** Provides company-specific analytics for their internship postings
   - **Step-by-step:**
     ```
     Step 1: Get all internships posted by this company
     Step 2: Get all applications for those internships
     Step 3: Group applications by status
     Step 4: Calculate average match score per internship
     Step 5: Show skill coverage analysis
     Step 6: Return company-specific analytics
     ```

#### **File: `backend/routes/analyticsRoutes.js`**

These are the API endpoints that the frontend calls:

```javascript
// Protected routes - require authentication
router.get('/admin/dashboard', protect, authorizeRoles('university_admin', 'system_admin'), getAdminDashboardAnalytics);
// Only university_admin or system_admin can access ↑

router.get('/company/applicants', protect, authorizeRoles('company'), getCompanyApplicantAnalytics);
// Only companies can view their applicant analytics ↑

router.get('/student/match-trends', protect, authorizeRoles('student'), getStudentMatchTrends);
// Only students can view their match trends ↑
```

---

### 💻 Frontend Implementation

#### **File: `frontend/src/pages/AdminDashboard.jsx`**

**Key Components & Logic:**

1. **State Management** - Lines 11-19
   ```javascript
   const [analytics, setAnalytics] = useState(null);           // Dashboard data
   const [pendingCompanies, setPendingCompanies] = useState([]);  // Pending approvals
   const [fraudulentAccounts, setFraudulentAccounts] = useState([]);  // Suspicious accounts
   const [studentsForVerification, setStudentsForVerification] = useState([]);  // For skill verification
   ```

2. **Load Function** - Lines 50-67
   ```javascript
   const load = async () => {
     try {
       const [a, p, fraud, students, w, logs] = await Promise.all([
         axios.get('/api/analytics/admin/dashboard'),  // Step 1: Get analytics
         axios.get('/api/admin/companies/pending'),    // Step 2: Get pending companies
         axios.get('/api/admin/users/fraudulent'),     // Step 3: Get fraudulent accounts
         axios.get('/api/admin/students/verification-candidates'),  // Step 4: Get students
         axios.get('/api/admin/algorithm-weights'),    // Step 5: Get ML weights
         axios.get('/api/admin/activity?limit=40'),    // Step 6: Get activity logs
       ]);
       // Set all state with returned data
       setAnalytics(a.data);
       setPendingCompanies(p.data || []);
       // ... etc
     }
   };
   ```

3. **Activity Filtering** - Lines 102-120
   ```javascript
   const filteredActivity = useMemo(() => {
     // Filters activity logs by:
     // - Type (MODERATION, INTERVIEW, AUTH, etc.)
     // - Search query
     return activity.filter((entry) => {
       const group = actionGroup(entry.action);
       if (activityTypeFilter !== 'ALL' && group !== activityTypeFilter) return false;
       // Search through action, email, role, entity type, etc.
     });
   }, [activity, activityQuery, activityTypeFilter]);
   ```

4. **Rendering Analytics** - The JSX displays:
   - Key metrics (cards showing totals)
   - Charts/graphs (using data from analytics state)
   - Department-wise placement table
   - Top skills demand list
   - Activity log with filtering

---

## Notification System

### 📌 Overview
The Notification System sends automated alerts to users for important events:
- Application submissions
- Status updates (Selected/Rejected)
- Deadline reminders (72 hours before deadline)
- Interview reminders (24 hours before scheduled interview)
- Interview invitations and updates

### 🎯 Notification Types

```
1. APPLICATION_SUBMITTED      → Student applied to an internship
2. STATUS_UPDATED             → Application status changed
3. DEADLINE_REMINDER          → Internship application deadline approaching
4. INTERVIEW_REMINDER         → Interview scheduled soon
5. INTERVIEW_INVITE           → Student invited for interview
6. INTERVIEW_STATUS           → Interview status updated
7. FEEDBACK_RECEIVED          → Student received interview feedback
8. SHORTLIST_ALERT            → Student shortlisted for position
9. SYSTEM                     → General system notifications
```

---

### 📂 Code File Structure

```
backend/
├── controllers/
│   └── notificationController.js     ← Notification logic
├── routes/
│   └── notificationRoutes.js          ← API endpoints
├── models/
│   ├── Notification.js                ← Database schema
│   └── Interview.js                   ← Interview data
└── utils/
    └── notificationService.js         ← Notification helper

frontend/
└── pages/
    └── NotificationsPage.jsx          ← Notifications UI
```

---

### 🔧 Backend Implementation

#### **File: `backend/models/Notification.js`**

**Database Schema:**
```javascript
const notificationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,  // Who receives it
  type: String,  // Enum: APPLICATION_SUBMITTED, STATUS_UPDATED, etc.
  title: String, // Short title shown in UI
  message: String, // Full message content
  metadata: Object, // Additional data (internshipId, applicationId, etc.)
  isRead: Boolean, // Has user read it?
  readAt: Date,    // When did user read it?
}, { timestamps: true });
```

**Example Notification in DB:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "type": "DEADLINE_REMINDER",
  "title": "Upcoming Internship Deadline",
  "message": "React Developer position has deadline on 2026-05-15",
  "metadata": {
    "internshipId": "507f1f77bcf86cd799439013",
    "applicationId": "507f1f77bcf86cd799439014"
  },
  "isRead": false,
  "createdAt": "2026-04-22T10:30:00Z"
}
```

---

#### **File: `backend/controllers/notificationController.js`**

**Main Functions:**

1. **`processDeadlineRemindersForStudent(userId)`** - Lines 6-63
   - **What it does:** Creates deadline reminders for applications closing within 72 hours
   - **Step-by-step logic:**
     ```
     Step 1: Get current date + 72 hours
     Step 2: Find all "active" applications (not Rejected/Selected)
     Step 3: For each application, check if deadline is within 72 hours
     Step 4: Avoid duplicate reminders (one per day per deadline)
     Step 5: Create and store notifications
     Step 6: Return count of reminders created
     ```

   **Key Code Example:**
   ```javascript
   const now = new Date();
   const soon = new Date(now.getTime() + 72 * 60 * 60 * 1000);  // +72 hours
   
   const apps = await Application.find({
     studentId: userId,
     status: { $nin: ['Rejected', 'Selected'] }  // Active only
   }).populate('internshipId', 'title deadline');
   
   // For each app, check if deadline is within window
   for (const app of apps) {
     const deadline = new Date(app.internshipId?.deadline);
     if (deadline > soon || deadline < now) continue;  // Skip if not in range
     
     // Create reminder notification
     candidates.push({
       userId,
       type: 'DEADLINE_REMINDER',
       title: 'Upcoming Internship Deadline',
       message: `${app.internshipId?.title} has deadline on ${deadline.toLocaleDateString()}`,
       metadata: { internshipId: app.internshipId?._id, applicationId: app._id }
     });
   }
   ```

2. **`processInterviewRemindersForStudent(userId)`** - Lines 65-110+
   - **What it does:** Reminds student about interviews scheduled within 24 hours
   - **Similar logic to deadline reminders but for scheduled interviews:**
     ```
     Step 1: Get interviews scheduled within 24 hours
     Step 2: Check if interview status is "Scheduled"
     Step 3: Avoid duplicate reminders
     Step 4: Create interview reminder notifications
     Step 5: Return count created
     ```

3. **`getMyNotifications()`** - Gets all notifications for logged-in user
4. **`markNotificationAsRead()`** - Marks single notification as read
5. **`markAllAsRead()`** - Marks all notifications as read

#### **File: `backend/utils/notificationService.js`**

Simple helper function to create notifications:

```javascript
const notify = async ({ userId, type, title, message, metadata = {} }) => {
  return Notification.create({
    userId,
    type,
    title,
    message,
    metadata,
  });
};
// Usage example:
// notify({ 
//   userId: student._id, 
//   type: 'APPLICATION_SUBMITTED',
//   title: 'Application Received',
//   message: 'Your application has been received'
// })
```

#### **File: `backend/routes/notificationRoutes.js`**

API endpoints for notifications:

```javascript
router.get('/my', protect, getMyNotifications);
// GET /api/notification/my
// Returns: { items: [...], unreadCount, total }

router.put('/:id/read', protect, markNotificationAsRead);
// PUT /api/notification/:id/read
// Marks notification as read

router.put('/read-all', protect, markAllAsRead);
// PUT /api/notification/read-all
// Marks all notifications as read

router.post('/deadline-reminders', protect, generateDeadlineReminders);
// POST /api/notification/deadline-reminders
// Creates deadline reminders (called by frontend)

router.post('/interview-reminders', protect, generateInterviewReminders);
// POST /api/notification/interview-reminders
// Creates interview reminders (called by frontend)
```

---

### 💻 Frontend Implementation

#### **File: `frontend/src/pages/NotificationsPage.jsx`**

**Key Components & Logic:**

1. **State Management** - Lines 33-38
   ```javascript
   const [items, setItems] = useState([]);  // All notifications
   const [loading, setLoading] = useState(true);
   const [summary, setSummary] = useState({ unreadCount: 0, total: 0 });  // Stats
   const [activeView, setActiveView] = useState('all');  // Filter view
   ```

2. **Load Function** - Lines 40-52
   ```javascript
   const load = async () => {
     try {
       const { data } = await axios.get('/api/notification/my');
       setItems(data.items || []);  // Get all notifications
       setSummary({ unreadCount: data.unreadCount || 0, total: data.total || 0 });
     } catch {
       setItems([]);
     }
   };
   ```

3. **Mark As Read** - Lines 54-58
   ```javascript
   const markRead = async (id) => {
     await axios.put(`/api/notification/${id}/read`);  // Update in DB
     load();  // Refresh list
   };
   ```

4. **Generate Reminders** - Lines 60-71
   ```javascript
   const generateReminders = async () => {
     // Manually trigger reminder generation
     await Promise.all([
       axios.post('/api/notification/deadline-reminders'),  // Create deadline reminders
       axios.post('/api/notification/interview-reminders'),  // Create interview reminders
     ]);
     setActiveView('deadline');  // Show deadline view
     load();  // Refresh notifications
   };
   ```

5. **Filter Notifications** - Lines 73-89
   ```javascript
   const visibleItems = items.filter((item) => {
     if (activeView === 'deadline') {
       return ['DEADLINE_REMINDER', 'INTERVIEW_REMINDER'].includes(item.type);
     }
     if (activeView === 'interview') {
       return ['INTERVIEW_INVITE', 'INTERVIEW_STATUS'].includes(item.type);
     }
     return true;  // Show all
   });
   ```

---

## 🔄 Complete Notification Flow Example

**Scenario: Student submits application**

### Step 1: Frontend (Student presses "Apply")
```javascript
// File: ApplicationController (assumed)
const applyForInternship = async (internshipId) => {
  await axios.post('/api/application', { internshipId });
  // Sends application to backend
};
```

### Step 2: Backend Receives Application
```javascript
// File: applicationController.js (assumed)
const createApplication = async (req, res) => {
  const app = await Application.create({
    studentId: req.user._id,
    internshipId: req.body.internshipId,
    status: 'Pending'
  });
  
  // 🔔 Send notification
  await notify({
    userId: req.user._id,
    type: 'APPLICATION_SUBMITTED',
    title: 'Application Received',
    message: `Your application for ${internship.title} has been submitted`
  });
};
```

### Step 3: Notification Stored in Database
```
Notification Collection:
{
  userId: "student_123",
  type: "APPLICATION_SUBMITTED",
  title: "Application Received",
  message: "Your application for React Developer...",
  isRead: false,
  createdAt: "2026-04-22T10:30:00Z"
}
```

### Step 4: Frontend Displays Notification
```javascript
// NotificationsPage.jsx
const load = async () => {
  const { data } = await axios.get('/api/notification/my');
  setItems(data.items);  // Notification appears in list
};

// In JSX:
{items.map(notif => (
  <NotificationCard
    title={notif.title}
    message={notif.message}
    type={notif.type}
    onRead={() => markRead(notif._id)}
  />
))}
```

### Step 5: Student Reads Notification
```javascript
const markRead = async (id) => {
  await axios.put(`/api/notification/${id}/read`);
  // Updates notification.isRead = true
  // Updates notification.readAt = now
};
```

---

## 🌐 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  AdminDashboard.jsx / CompanyDashboard.jsx / NotificationsPage  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ API Calls (axios)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API ROUTES                               │
│  /api/analytics/admin/dashboard                                │
│  /api/analytics/company/applicants                             │
│  /api/notification/my                                          │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Route matches
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLERS                               │
│  analyticsController.js (processes data)                       │
│  notificationController.js (creates notifications)             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Database queries
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MODELS                                   │
│  Internship.js / Application.js / StudentProfile.js            │
│  Notification.js / Interview.js                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Read/Write
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                   │
│  MongoDB (Atlas Cloud)                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 User Roles & Permissions

### **University Admin** ✅
- Access: Dashboard analytics (all students, all internships)
- Can view: Placement ratios, skill demands, department performance
- **Route:** `/api/analytics/admin/dashboard`

### **Company** ✅
- Access: Only their own internship analytics
- Can view: Applications to their postings, average match scores
- **Route:** `/api/analytics/company/applicants`

### **Student** ✅
- Access: Personal notifications and match trends
- Can view: Their applications, interview invitations
- **Route:** `/api/analytics/student/match-trends`

---

## 🎯 Key Features Implemented

### ✨ Analytics System
- **Real-time calculations** from database queries
- **Department-wise filtering** for placement analysis
- **Skill frequency analysis** to identify market demands
- **Skill gap analysis** per department

### 🔔 Notification System
- **Automatic reminders** 72 hours before deadline
- **Interview reminders** 24 hours before scheduled time
- **Duplicate prevention** to avoid multiple same reminders
- **Status tracking** (read/unread)
- **Type-based filtering** for different notification categories

---

## 🚀 How to Test

### Test Analytics:
1. Login as admin: `admin@university.edu / admin123`
2. Go to Admin Dashboard
3. See analytics cards with real data from database

### Test Notifications:
1. Login as student: `student@university.edu / student123`
2. Go to Notifications page
3. Click "Generate Reminders" button
4. Should see deadline reminders appear
5. Click on a notification to mark as read

---

## 📝 Summary

Both systems work together to provide:
- **Transparency** through analytics dashboards
- **Timely updates** via notifications
- **Data-driven insights** for decision making
- **Personalized experience** per user role

The notification system ensures no important deadlines or updates are missed, while the analytics system provides strategic insights for better decision-making across the platform.
