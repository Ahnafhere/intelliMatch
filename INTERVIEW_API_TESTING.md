# Interview Reporting API - Testing Examples

## Authentication Setup

All endpoints require a valid JWT token. Include in requests:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get token by logging in:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"company@example.com","password":"password"}'
```

Response will include `token` field.

## Example Requests

### 1. Get Interview Report Summary

**Request:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

**With Date Range:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "reportPeriod": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "statistics": {
    "total": 45,
    "scheduled": 5,
    "completed": 32,
    "selected": 12,
    "rejected": 20,
    "studentConfirmed": 43,
    "studentPending": 1,
    "studentDeclined": 1,
    "selectionRate": "37.50",
    "confirmationRate": "95.56",
    "declineRate": "2.22"
  },
  "byStatus": {
    "scheduled": [...],
    "completed": [...],
    "selected": [...],
    "rejected": [...]
  },
  "byConfirmation": {
    "confirmed": [...],
    "pending": [...],
    "declined": [...]
  },
  "totalInterviews": 45,
  "interviewDetails": [...]
}
```

### 2. Get Interview Statistics Only

**Request:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/statistics?startDate=2024-01-01&endDate=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200 OK):**
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
  "selectionRate": "37.50",
  "confirmationRate": "95.56",
  "declineRate": "2.22"
}
```

### 3. Get Interview History (Raw Data)

**Request - All your interviews:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Request - With date range:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/history?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Admin - Filter by company:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/history?companyId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "internshipTitle": "Software Engineer Intern",
    "companyName": "Tech Corp",
    "studentName": "John Doe",
    "studentEmail": "john@example.com",
    "scheduledDate": "2024-01-15T14:00:00.000Z",
    "duration": 45,
    "mode": "Online",
    "meetingLink": "https://zoom.us/j/123456789",
    "location": "",
    "notes": "Technical interview",
    "studentConfirmation": "Confirmed",
    "currentStatus": "Completed",
    "matchScore": 0.85,
    "fullHistory": [
      {
        "status": "Scheduled",
        "note": "Interview scheduled",
        "changedAt": "2024-01-10T10:00:00.000Z",
        "changedBy": "507f1f77bcf86cd799439012"
      },
      {
        "status": "Completed",
        "note": "Interview completed successfully",
        "changedAt": "2024-01-15T14:45:00.000Z",
        "changedBy": "507f1f77bcf86cd799439012"
      }
    ]
  }
]
```

### 4. Get Recent Interview Updates (Real-Time)

**Request - Last 60 minutes:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/recent-updates" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Request - Last 24 hours:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/recent-updates?minutesAgo=1440" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "Jane Smith",
    "internshipTitle": "Product Manager Intern",
    "currentStatus": "Completed",
    "studentConfirmation": "Confirmed",
    "lastUpdate": "2024-01-15T15:30:00.000Z",
    "lastHistoryEntry": {
      "status": "Completed",
      "note": "Interview completed successfully",
      "changedAt": "2024-01-15T15:30:00.000Z",
      "changedBy": "507f1f77bcf86cd799439012"
    }
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "studentName": "Bob Johnson",
    "internshipTitle": "Backend Engineer Intern",
    "currentStatus": "Selected",
    "studentConfirmation": "Confirmed",
    "lastUpdate": "2024-01-15T15:15:00.000Z",
    "lastHistoryEntry": {
      "status": "Selected",
      "note": "Candidate selected for offer",
      "changedAt": "2024-01-15T15:15:00.000Z",
      "changedBy": "507f1f77bcf86cd799439012"
    }
  }
]
```

### 5. Get Application Interview Timeline

**Request:**
```bash
curl -X GET "http://localhost:5000/api/interview/timeline/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "applicationId": "507f1f77bcf86cd799439014",
  "interview": {
    "_id": "507f1f77bcf86cd799439011",
    "internshipTitle": "Software Engineer Intern",
    "companyName": "Tech Corp",
    "studentName": "John Doe",
    "scheduledDate": "2024-01-15T14:00:00.000Z",
    "mode": "Online"
  },
  "timeline": [
    {
      "sequence": 1,
      "status": "Scheduled",
      "note": "Interview scheduled",
      "changedAt": "2024-01-10T10:00:00.000Z",
      "changedBy": "507f1f77bcf86cd799439012"
    },
    {
      "sequence": 2,
      "status": "Student Confirmed",
      "note": "Student confirmed availability",
      "changedAt": "2024-01-12T08:30:00.000Z",
      "changedBy": "507f1f77bcf86cd799439014"
    },
    {
      "sequence": 3,
      "status": "Completed",
      "note": "Interview completed successfully",
      "changedAt": "2024-01-15T14:45:00.000Z",
      "changedBy": "507f1f77bcf86cd799439012"
    },
    {
      "sequence": 4,
      "status": "Selected",
      "note": "Candidate selected for offer",
      "changedAt": "2024-01-15T16:00:00.000Z",
      "changedBy": "507f1f77bcf86cd799439012"
    }
  ],
  "statusSummary": {
    "initial": "Scheduled",
    "current": "Selected",
    "studentConfirmation": "Confirmed",
    "totalStatusChanges": 4
  }
}
```

### 6. Download Interview History as HTML

**Request:**
```bash
curl -X GET "http://localhost:5000/api/interview/download/history?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o interview_history.html
```

**Expected Response (200 OK):**
- Content-Type: `text/html; charset=utf-8`
- Content-Disposition: `attachment; filename="interview_history_1234567890.html"`
- Body: Complete HTML document with styling

### 7. Download Application Interview Timeline as HTML

**Request:**
```bash
curl -X GET "http://localhost:5000/api/interview/download/timeline/507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o timeline.html
```

**Expected Response (200 OK):**
- Content-Type: `text/html; charset=utf-8`
- Content-Disposition: `attachment; filename="interview_timeline_507f1f77bcf86cd799439014_1234567890.html"`
- Body: Complete HTML timeline document

## Error Responses

### 401 Unauthorized
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary"
```

**Response (401):**
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden (No Permission)
```bash
# Student trying to access company reports
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Response (403):**
```json
{
  "message": "Unauthorized to view reports"
}
```

### 404 Not Found
```bash
curl -X GET "http://localhost:5000/api/interview/timeline/invalidID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (404):**
```json
{
  "message": "No interview found for this application"
}
```

### 500 Server Error
```json
{
  "message": "Failed to generate interview report",
  "error": "Database connection failed"
}
```

## Testing with Different Roles

### Company User Testing

**Setup:**
```bash
# Login as company
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "company@example.com",
    "password": "password123"
  }' | jq -r '.token')
```

**Test - Can see own reports:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer $TOKEN"
# Returns: Own company data ✓
```

**Test - Cannot see other company data:**
```bash
# The API should only return current company data, not filter by companyId
# Even if companyId param is provided, it's ignored
```

### Student User Testing

**Setup:**
```bash
# Login as student
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }' | jq -r '.token')
```

**Test - Can see own timeline:**
```bash
curl -X GET "http://localhost:5000/api/interview/timeline/THEIR_APPLICATION_ID" \
  -H "Authorization: Bearer $TOKEN"
# Returns: Their timeline ✓
```

**Test - Cannot see others' timeline:**
```bash
curl -X GET "http://localhost:5000/api/interview/timeline/OTHER_APPLICATION_ID" \
  -H "Authorization: Bearer $TOKEN"
# Returns: 403 Unauthorized ✓
```

**Test - Cannot access reports:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer $TOKEN"
# Returns: 403 Unauthorized ✓
```

### Admin User Testing

**Setup:**
```bash
# Login as admin
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }' | jq -r '.token')
```

**Test - Can see all reports:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer $TOKEN"
# Returns: All system data ✓
```

**Test - Can filter by company:**
```bash
curl -X GET "http://localhost:5000/api/interview/report/history?companyId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer $TOKEN"
# Returns: Specific company data ✓
```

## Performance Testing

### Load Test - Get Statistics

```bash
# Test with Apache Bench (10 concurrent requests, 100 total)
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/interview/report/statistics
```

### Load Test - Get Recent Updates

```bash
# Simulate real-time polling
for i in {1..10}; do
  curl -s -X GET "http://localhost:5000/api/interview/report/recent-updates" \
    -H "Authorization: Bearer YOUR_TOKEN" > /dev/null
  echo "Request $i completed"
  sleep 5
done
```

## Date Range Testing

### Test 1: All-Time Report
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer YOUR_TOKEN"
# No date params = all time
```

### Test 2: This Month
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Last 7 Days
```bash
TODAY=$(date +%Y-%m-%d)
WEEK_AGO=$(date -d "7 days ago" +%Y-%m-%d)
curl -X GET "http://localhost:5000/api/interview/report/summary?startDate=$WEEK_AGO&endDate=$TODAY" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Response Time Benchmarks

Expected response times (after MongoDB index creation):

- Get Summary: 200-500ms
- Get Statistics: 50-100ms
- Get History: 100-300ms (depends on data size)
- Get Recent Updates: 50-100ms
- Get Timeline: 50-150ms
- Download HTML: 300-800ms

## Common Issues & Solutions

### Issue: 404 endpoints not found
**Solution:** Verify routes are added to interviewRoutes.js
```bash
grep "report/summary" backend/routes/interviewRoutes.js
```

### Issue: Slow response times
**Solution:** Add MongoDB indexes
```bash
mongo
use your_database
db.interviews.createIndex({ companyId: 1, scheduledAt: -1 })
```

### Issue: CORS errors
**Solution:** Verify CORS is enabled in Express
```javascript
// In server.js
app.use(cors());
```

### Issue: Document generation fails
**Solution:** Ensure uploads directory exists
```bash
mkdir -p backend/uploads/documents
chmod 755 backend/uploads/documents
```

---

**Note:** Replace `YOUR_TOKEN` with actual JWT token from login response.
