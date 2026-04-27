# Interview History Reporting & Real-Time Document Updates

## Overview

This document describes the new Interview History Reporting and Real-Time Document Generation features added to the Interview Scheduling & Tracking System. These features enable comprehensive tracking, analysis, and documentation of all interview activities with real-time updates.

## Features Implemented

### 1. Interview History Reporting

#### Overview Statistics
- **Total Interviews**: Count of all interviews in the selected period
- **Status Breakdown**: 
  - Scheduled - Upcoming interviews
  - Completed - Finished interviews
  - Selected - Candidates who passed
  - Rejected - Candidates who didn't pass
- **Student Confirmation Metrics**:
  - Confirmed - Students who confirmed attendance
  - Pending - Awaiting student confirmation
  - Declined - Students who declined the interview
- **Performance Rates**:
  - Confirmation Rate - % of confirmed interviews
  - Selection Rate - % of candidates selected after completion
  - Decline Rate - % of students who declined

#### Detailed Interview Records
Each interview record includes:
- Student name and email
- Company name
- Internship title
- Scheduled date and time
- Interview mode (Online/Onsite/Phone)
- Duration and meeting link
- Current status
- Student confirmation status
- Match score (skill match %)
- Complete history of all status changes

### 2. Real-Time Document Generation

#### Document Types

**Interview History Report (HTML)**
- Comprehensive report with all statistics and interview details
- Professional styling with status badges and color coding
- Grouped data by status and confirmation status
- Print-friendly format
- Automatic generation on status updates

**Application Interview Timeline (HTML)**
- Individual interview timeline for a specific application
- Visual timeline with numbered events
- Status change history with timestamps
- Interview details and meeting information
- Real-time updates when status changes

#### Auto-Generation Trigger
Documents are automatically generated when:
- Interview status is updated (Scheduled → Completed → Selected/Rejected)
- Status changes are saved in a timestamped file format
- Accessible for download via browser

### 3. Real-Time Updates

#### Recent Interview Updates
- Last 60 minutes of interview activity (configurable)
- Real-time status changes with timestamps
- Student confirmation updates
- Company actions

#### Auto-Refresh
- Frontend automatically refreshes every 30 seconds
- Updates are fetched without page reload
- Live indication of ongoing interviews

## API Endpoints

### Reporting Endpoints

#### 1. Get Interview Report Summary
```
GET /api/interview/report/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Authorization: Bearer {token}
Roles: company, system_admin, university_admin
```

**Response:**
```json
{
  "generatedAt": "2024-01-15T10:30:00Z",
  "reportPeriod": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-15"
  },
  "statistics": {
    "total": 45,
    "scheduled": 5,
    "completed": 32,
    "selected": 12,
    "rejected": 20,
    "selectionRate": 37.5,
    "confirmationRate": 95.6,
    "declineRate": 2.2
  },
  "byStatus": {
    "scheduled": [...],
    "completed": [...],
    "selected": [...],
    "rejected": [...]
  },
  "interviewDetails": [...]
}
```

#### 2. Get Interview Statistics
```
GET /api/interview/report/statistics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Authorization: Bearer {token}
Roles: company, system_admin, university_admin
```

**Response:**
```json
{
  "total": 45,
  "scheduled": 5,
  "completed": 32,
  "selected": 12,
  "rejected": 20,
  "studentConfirmed": 43,
  "studentPending": 1,
  "studentDeclined": 1,
  "selectionRate": "37.5",
  "confirmationRate": "95.56",
  "declineRate": "2.22"
}
```

#### 3. Get Interview History (Raw Data)
```
GET /api/interview/report/history?companyId=...&studentId=...&startDate=...&endDate=...
Authorization: Bearer {token}
Roles: student (own), company (own), system_admin, university_admin
```

**Response:**
```json
[
  {
    "_id": "...",
    "internshipTitle": "Software Engineer Intern",
    "companyName": "Tech Corp",
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "scheduledDate": "2024-01-15T14:00:00Z",
    "duration": 45,
    "mode": "Online",
    "meetingLink": "https://zoom.us/...",
    "currentStatus": "Completed",
    "studentConfirmation": "Confirmed",
    "matchScore": 0.85,
    "fullHistory": [...]
  }
]
```

#### 4. Get Application Interview Timeline
```
GET /api/interview/timeline/{applicationId}
Authorization: Bearer {token}
Roles: student (own), system_admin, university_admin
```

**Response:**
```json
{
  "applicationId": "...",
  "interview": {
    "_id": "...",
    "internshipTitle": "Software Engineer Intern",
    "companyName": "Tech Corp",
    "studentName": "John Doe",
    "scheduledDate": "2024-01-15T14:00:00Z",
    "mode": "Online"
  },
  "timeline": [
    {
      "sequence": 1,
      "status": "Scheduled",
      "note": "Interview scheduled",
      "changedAt": "2024-01-10T10:00:00Z",
      "changedBy": "..."
    },
    {
      "sequence": 2,
      "status": "Completed",
      "note": "Interview completed successfully",
      "changedAt": "2024-01-15T14:45:00Z",
      "changedBy": "..."
    }
  ],
  "statusSummary": {
    "initial": "Scheduled",
    "current": "Completed",
    "studentConfirmation": "Confirmed",
    "totalStatusChanges": 2
  }
}
```

#### 5. Get Recent Interview Updates
```
GET /api/interview/report/recent-updates?minutesAgo=60
Authorization: Bearer {token}
Roles: company, system_admin, university_admin
```

**Response:**
```json
[
  {
    "_id": "...",
    "studentName": "Jane Smith",
    "internshipTitle": "Product Manager Intern",
    "currentStatus": "Completed",
    "studentConfirmation": "Confirmed",
    "lastUpdate": "2024-01-15T15:30:00Z",
    "lastHistoryEntry": {
      "status": "Completed",
      "note": "Interview completed"
    }
  }
]
```

### Document Download Endpoints

#### 1. Download Interview History Document
```
GET /api/interview/download/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Authorization: Bearer {token}
Roles: company, system_admin, university_admin
Content-Type: text/html
```

Returns HTML document with styling for printing/viewing

#### 2. Download Application Interview Timeline Document
```
GET /api/interview/download/timeline/{applicationId}
Authorization: Bearer {token}
Roles: student (own), system_admin, university_admin
Content-Type: text/html
```

Returns HTML document with styled timeline

## Frontend Components

### 1. InterviewReports Component
**File:** `frontend/src/pages/InterviewReports.jsx`

**Features:**
- Date range filtering for custom reports
- Three tabs:
  - **Overview**: Statistics dashboard with visual cards
  - **Interview Details**: Detailed table of all interviews
  - **Real-Time Updates**: Live feed of recent changes
- Auto-refresh every 30 seconds for real-time data
- Download reports as HTML documents
- Status and confirmation badges with color coding

**Usage:**
```jsx
import InterviewReports from './pages/InterviewReports';

// In routing configuration
<Route path="/interview-reports" element={<InterviewReports />} />
```

### 2. InterviewTimeline Component
**File:** `frontend/src/pages/InterviewTimeline.jsx`

**Features:**
- Application-specific interview timeline
- Visual timeline with numbered events
- Current status summary
- Download timeline as HTML
- Auto-refresh every 30 seconds
- Responsive design

**Usage:**
```jsx
import InterviewTimeline from './pages/InterviewTimeline';

// In routing configuration
<Route path="/interview-timeline/:applicationId" element={<InterviewTimeline />} />
```

### 3. Styling
**Files:**
- `frontend/src/styles/InterviewReports.css`
- `frontend/src/styles/InterviewTimeline.css`

## Utilities

### Backend Services

#### 1. interviewReportingService.js
**Location:** `backend/utils/interviewReportingService.js`

**Functions:**
- `generateInterviewHistory(filters)` - Get interview history with filtering
- `getInterviewStatistics(companyId, startDate, endDate)` - Calculate statistics
- `getApplicationInterviewTimeline(applicationId)` - Get timeline for an application
- `generateCompanyInterviewReport(companyId, startDate, endDate)` - Generate comprehensive report
- `getRecentInterviewUpdates(companyId, minutesAgo)` - Get recent changes

#### 2. documentService.js
**Location:** `backend/utils/documentService.js`

**Functions:**
- `generateInterviewHistoryDocument(companyId, startDate, endDate)` - Generate HTML report
- `generateApplicationInterviewDocument(applicationId)` - Generate timeline HTML
- `saveDocumentToFile(content, filename)` - Save HTML to file system

## Data Flow

### Real-Time Document Generation Flow

```
Interview Status Update
        ↓
updateInterviewStatus() controller called
        ↓
Interview record updated in database
        ↓
Trigger generateApplicationInterviewDocument()
        ↓
Document saved to /uploads/documents/
        ↓
Timestamp recorded in interview history
        ↓
Notify stakeholders (student, company)
```

### Real-Time Updates Flow

```
Frontend periodically calls getRecentUpdates()
        ↓
Backend queries interviews updated in last N minutes
        ↓
Returns recent changes with latest history entries
        ↓
Frontend updates display with new data
        ↓
No page reload required
```

## Security & Authorization

### Role-Based Access Control

**Company Users:**
- View their own interview reports
- Download their own reports
- View real-time updates for their interviews
- Cannot view other companies' data

**Students:**
- View their own interview timeline
- View their own interview history
- Download their own timeline documents

**Admins:**
- View all interview reports
- View all timelines
- Access all real-time updates
- No company restrictions

### Data Privacy

- Company data is isolated per company
- Students can only access their own information
- Admin endpoints require authentication
- API validates authorization on every request

## Configuration

### Real-Time Update Frequency

**Frontend (InterviewReports.jsx):**
```javascript
const interval = setInterval(fetchRecentUpdates, 30000); // 30 seconds
```

**Modify:** Change `30000` to desired milliseconds

**API Query Parameter (minutesAgo):**
```
GET /api/interview/report/recent-updates?minutesAgo=60
```

Default: 60 minutes. Adjust for desired window.

### Document Storage

**Location:** `backend/uploads/documents/`

**Auto-creation:** Directory is created automatically if it doesn't exist

**Filename Format:** `interview_{interviewId}_{timestamp}.html`

## Testing

### Test Generate Interview Report
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Download Document
```bash
curl -X GET "http://localhost:5000/api/interview/download/history?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.html
```

### Test Real-Time Updates
```bash
curl -X GET "http://localhost:5000/api/interview/report/recent-updates?minutesAgo=60" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

### Common Errors

**401 Unauthorized:**
```json
{ "message": "Unauthorized" }
```
Solution: Check token validity and role permissions

**403 Forbidden:**
```json
{ "message": "Unauthorized to view reports" }
```
Solution: User doesn't have permission to access this resource

**404 Not Found:**
```json
{ "message": "Application not found" }
```
Solution: ApplicationId doesn't exist or user doesn't have access

**500 Server Error:**
```json
{ "message": "Failed to generate interview report", "error": "..." }
```
Solution: Check server logs, ensure database connection

## Performance Considerations

### Optimization Tips

1. **Date Range Filtering:**
   - Always use date ranges for large datasets
   - Reduces database query time

2. **Pagination (Future Enhancement):**
   - Consider implementing pagination for interview details
   - Reduces response payload

3. **Caching:**
   - Reports can be cached for 5-10 minutes
   - Reduces database load

4. **Indexing:**
   - Ensure MongoDB indexes on:
     - `companyId` + `scheduledAt`
     - `studentId` + `status`
     - `applicationId`

## Future Enhancements

1. **Export Formats:**
   - PDF export (using html2pdf library)
   - Excel export (using xlsx library)
   - CSV export for data analysis

2. **Advanced Analytics:**
   - Interview scheduling patterns
   - Average time-to-hire metrics
   - Rejection reasons analysis
   - Student feedback integration

3. **Notifications:**
   - Email digest of daily interviews
   - SMS alerts for status changes
   - Scheduled report delivery

4. **WebSocket Real-Time:**
   - Replace polling with WebSocket connections
   - True real-time updates without polling
   - Better performance for multiple users

5. **Audit Trail:**
   - Document change history
   - Who modified what and when
   - Compliance reporting

## Troubleshooting

### Documents Not Generating

**Issue:** Documents folder error
```
Failed to save document
```

**Solution:**
```bash
# Ensure uploads/documents directory exists
mkdir -p backend/uploads/documents
```

### Real-Time Updates Not Showing

**Issue:** Stale data or network issue

**Solution:**
1. Check browser network tab for API calls
2. Verify token is valid
3. Reload page and check again
4. Check server logs for errors

### Performance Issues

**Issue:** Slow report generation for large date ranges

**Solution:**
1. Reduce date range
2. Add database indexes on `companyId` and `scheduledAt`
3. Consider archiving old interviews
