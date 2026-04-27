# 📊 Interview Reporting System - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERVIEW REPORTING SYSTEM                          │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────┐
                         │   Frontend Browser      │
                         │  ┌───────────────────┐  │
                         │  │ InterviewReports  │  │
                         │  │  Dashboard (JSX)  │  │
                         │  └───────────────────┘  │
                         │  ┌───────────────────┐  │
                         │  │ InterviewTimeline │  │
                         │  │  View (JSX)       │  │
                         │  └───────────────────┘  │
                         └──────────────┬───────────┘
                                        │ HTTP/REST
                   ┌────────────────────┼────────────────────┐
                   │                    │                    │
          ┌────────▼─────────┐  ┌──────▼────────┐  ┌────────▼────────┐
          │   API Routes     │  │   Auth Check  │  │  Authorization  │
          └────────┬─────────┘  └──────┬────────┘  └────────┬────────┘
                   │                    │                    │
                   └────────────────────┼────────────────────┘
                                        │
                   ┌────────────────────▼────────────────────┐
                   │   Express Server (Node.js)             │
                   ├────────────────────────────────────────┤
                   │                                        │
                   │  ┌──────────────────────────────────┐  │
                   │  │  interviewController            │  │
                   │  │  ✓ getInterviewReport          │  │
                   │  │  ✓ getInterviewStats           │  │
                   │  │  ✓ getApplicationTimeline      │  │
                   │  │  ✓ getRecentUpdates            │  │
                   │  │  ✓ downloadHistoryDocument     │  │
                   │  │  ✓ downloadTimelineDocument    │  │
                   │  └──────────────────────────────────┘  │
                   │                                        │
                   │  ┌──────────────────────────────────┐  │
                   │  │  Utility Services               │  │
                   │  │  ├─ interviewReporting (utils)  │  │
                   │  │  └─ documentService (utils)     │  │
                   │  └──────────────────────────────────┘  │
                   │                                        │
                   └────────────────────┬───────────────────┘
                                        │
                   ┌────────────────────┼────────────────────┐
                   │                    │                    │
          ┌────────▼──────────┐  ┌──────▼────────┐  ┌────────▼───────┐
          │   MongoDB         │  │  File System  │  │   Application  │
          │   Interview DB    │  │  Documents    │  │   Database     │
          │                   │  │  (HTML)       │  │   (Users, Apps)│
          └───────────────────┘  └───────────────┘  └────────────────┘
```

## Data Flow Diagrams

### 1. Report Generation Flow

```
User Request (Company)
        │
        ▼
GET /api/interview/report/summary?startDate=...&endDate=...
        │
        ▼
┌─────────────────────────────┐
│  Authorization Check        │ → Verify role & ownership
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  getInterviewReport()       │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  generateCompanyReport()    │ → Query MongoDB
│                             │ → Calculate statistics
│                             │ → Group by status
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Return JSON Response       │
│  {                          │
│    statistics: {...},       │
│    byStatus: {...},         │
│    details: [...]           │
│  }                          │
└────────────┬────────────────┘
             │
             ▼
Browser receives data
        │
        ▼
React renders dashboard
        │
        ▼
Display statistics cards & tables
```

### 2. Auto-Document Generation Flow

```
Company Updates Interview Status
        │
        ▼
PUT /api/interview/:id/status
{status: "Completed"}
        │
        ▼
┌──────────────────────────────┐
│  updateInterviewStatus()     │ → Update MongoDB
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  generateApplication         │ → Generate HTML
│  InterviewDocument()         │ → Add styling
│                              │ → Include timeline
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  saveDocumentToFile()        │ → Save to
│                              │ → /uploads/documents/
│                              │ → interview_ID_TIMESTAMP.html
└────────────┬─────────────────┘
             │
             ▼
Document stored & available for download
        │
        ▼
Notify stakeholders
```

### 3. Real-Time Update Flow

```
Frontend: Auto-refresh every 30 seconds
        │
        ▼
GET /api/interview/report/recent-updates?minutesAgo=60
        │
        ▼
┌──────────────────────────────┐
│  getRecentUpdates()          │ → Query last 60 minutes
│                              │ → from MongoDB
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  Return [{                   │
│    _id: "...",               │
│    studentName: "Jane",      │
│    currentStatus: "Selected",│
│    lastUpdate: timestamp,    │
│    lastHistoryEntry: {...}   │
│  }]                          │
└────────────┬─────────────────┘
             │
             ▼
React updates Real-Time Updates tab
        │
        ▼
No page reload - seamless update
```

### 4. Authorization Flow

```
User Makes Request
        │
        ▼
┌───────────────────────────────┐
│  Check JWT Token              │ → Valid? Continue
│                               │ → Invalid? Return 401
└────────────┬──────────────────┘
             │
             ▼
┌───────────────────────────────┐
│  Extract User Role            │
│  ├─ "company"                 │
│  ├─ "student"                 │
│  └─ "system_admin"/"university_admin"
└────────────┬──────────────────┘
             │
             ▼
┌───────────────────────────────┐
│  Check Role Permission        │
│  Report endpoints:            │
│  ├─ company: Own data only   │
│  ├─ student: Own timeline    │
│  └─ admin: All data          │
└────────────┬──────────────────┘
             │
      ┌──────┴──────┐
      ▼             ▼
  Allowed      Forbidden
      │             │
      ▼             ▼
Continue    Return 403 Error
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│                    Interviews Collection                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  _id: ObjectId                                               │
│  applicationId: ObjectId (Reference)                         │
│  internshipId: ObjectId (Reference)                          │
│  companyId: ObjectId (Reference)                             │
│  studentId: ObjectId (Reference)                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Interview Details                                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  scheduledAt: Date                                   │   │
│  │  durationMinutes: Number (default: 45)              │   │
│  │  mode: String (Online|Onsite|Phone)                 │   │
│  │  meetingLink: String                                │   │
│  │  location: String                                   │   │
│  │  notes: String                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Status Fields                                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  studentConfirmation: String                         │   │
│  │    (Pending|Confirmed|Declined)                      │   │
│  │  status: String                                      │   │
│  │    (Scheduled|Completed|Selected|Rejected)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  History Array - Track All Changes                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  history: [                                          │   │
│  │    {                                                 │   │
│  │      status: String (new status)                    │   │
│  │      note: String (reason for change)               │   │
│  │      changedAt: Date (when changed)                 │   │
│  │      changedBy: ObjectId (who changed it)           │   │
│  │    },                                                │   │
│  │    {                                                 │   │
│  │      status: "Completed"                            │   │
│  │      note: "Interview completed successfully"       │   │
│  │      changedAt: "2024-01-15T14:45:00Z"             │   │
│  │      changedBy: "507f1f77bcf86cd799439012"         │   │
│  │    },                                                │   │
│  │    ...                                               │   │
│  │  ]                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  timestamps:                                                 │
│  ├─ createdAt: Date                                         │
│  └─ updatedAt: Date                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App.jsx Router                                          │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Route: /interview-reports                              │  │
│  │    → <InterviewReports /> component                      │  │
│  │  Route: /interview-timeline/:applicationId              │  │
│  │    → <InterviewTimeline /> component                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  InterviewReports Component                              │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  State:                                                  │  │
│  │  ├─ reports (data)                                      │  │
│  │  ├─ stats (statistics)                                  │  │
│  │  ├─ recentUpdates (real-time)                           │  │
│  │  ├─ selectedTab (UI state)                              │  │
│  │  └─ dateRange (filters)                                 │  │
│  │                                                          │  │
│  │  Effects:                                                │  │
│  │  ├─ useEffect: fetchReports on mount                    │  │
│  │  ├─ useEffect: setInterval for auto-refresh (30s)       │  │
│  │  └─ cleanup: clearInterval                              │  │
│  │                                                          │  │
│  │  Render:                                                 │  │
│  │  ├─ Filters (date range input)                          │  │
│  │  ├─ Tabs (Overview|Details|Real-Time)                   │  │
│  │  └─ Tab Content (dynamic based on selectedTab)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  InterviewTimeline Component                             │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  State:                                                  │  │
│  │  ├─ timeline (data)                                     │  │
│  │  └─ loading (UI state)                                  │  │
│  │                                                          │  │
│  │  Effects:                                                │  │
│  │  ├─ useEffect: fetchTimeline on mount                   │  │
│  │  ├─ useEffect: setInterval for auto-refresh (30s)       │  │
│  │  └─ cleanup: clearInterval                              │  │
│  │                                                          │  │
│  │  Render:                                                 │  │
│  │  ├─ Header (interview info)                             │  │
│  │  ├─ Status Summary                                      │  │
│  │  └─ Timeline Events (mapped array)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Cycle

```
1. User Action (e.g., click "Generate Report")
        │
        ▼
2. React Event Handler
   fetchReports()
        │
        ▼
3. Axios HTTP Request
   GET /api/interview/report/summary
   Headers: {Authorization: "Bearer TOKEN"}
        │
        ▼
4. Express Router
   Matches route → Calls middleware
        │
        ▼
5. Auth Middleware
   Verifies JWT token
   Checks authorization
        │
        ▼
6. Controller Function
   getInterviewReport()
        │
        ├─→ Gets user ID from token
        ├─→ Calls reportingService functions
        ├─→ Queries MongoDB
        └─→ Aggregates results
        │
        ▼
7. Response JSON
   200 OK + {statistics, byStatus, details}
        │
        ▼
8. Axios Promise
   .then() handler processes response
        │
        ▼
9. React State Update
   setReports(data)
   setStats(data)
        │
        ▼
10. Component Re-render
    Displays statistics cards & tables
        │
        ▼
11. User sees results
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Production Server                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Node.js Server (Port 5000)                      │  │
│  │  ├─ Express.js                                  │  │
│  │  ├─ CORS Middleware                             │  │
│  │  ├─ Auth Middleware                             │  │
│  │  ├─ Routes & Controllers                        │  │
│  │  └─ Utility Services                            │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  File System (/uploads/documents/)               │  │
│  │  └─ Generated HTML files                         │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  MongoDB Connection                              │  │
│  │  └─ Interviews Collection                        │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
        ▲
        │ HTTP/HTTPS
        │
┌───────┴──────────────┐
│   Client Browser     │
│   ├─ InterviewReports│
│   └─ InterviewTimeline
└──────────────────────┘
```

---

This architecture provides:
- ✅ Scalability
- ✅ Real-time updates
- ✅ Security (JWT + role-based)
- ✅ Performance (indexed queries)
- ✅ Maintainability (separation of concerns)
- ✅ Reliability (error handling)
