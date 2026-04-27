# Integration Guide - Interview History Reporting

## Quick Start Integration

This guide walks you through integrating the new Interview History Reporting features into your app.

## Step 1: Add Routes to App.jsx

Open `frontend/src/App.jsx` and add the new route imports and routes:

```jsx
// Add imports at the top
import InterviewReports from './pages/InterviewReports';
import InterviewTimeline from './pages/InterviewTimeline';

// In your routes section (inside the main routing logic):
<Route path="/interview-reports" element={<InterviewReports />} />
<Route path="/interview-timeline/:applicationId" element={<InterviewTimeline />} />
```

## Step 2: Navigation Links

The navigation links are already added to the InterviewCenter sidebar. Just verify they appear:

- In the sidebar for company users: "Reports & Analytics" → `/interview-reports`
- In the sidebar for admin users: "Reports & Analytics" → `/interview-reports`

## Step 3: Backend Verification

The backend is already fully configured. Just verify:

1. **Check interviewController imports:**
   ```bash
   grep "interviewReportingService\|documentService" backend/controllers/interviewController.js
   ```

2. **Check routes are registered:**
   ```bash
   grep "report/summary\|download/history" backend/routes/interviewRoutes.js
   ```

## Step 4: Ensure Uploads Directory Exists

The documents are saved to `backend/uploads/documents/`. The code creates this automatically, but you can pre-create it:

```bash
mkdir -p backend/uploads/documents
chmod 755 backend/uploads/documents
```

## Step 5: Test the Implementation

### Test 1: Generate Report via API
```bash
curl -X GET "http://localhost:5000/api/interview/report/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 2: Access Frontend Dashboard
1. Login as company or admin user
2. Navigate to sidebar → "Reports & Analytics"
3. Should see the reports dashboard

### Test 3: Download Document
1. On the reports page
2. Adjust date range (optional)
3. Click "Download as HTML" button
4. File should download as HTML

### Test 4: View Interview Timeline
1. Login as student
2. Go to "My Applications"
3. Click on an application with an interview
4. Timeline should display all status changes

## Step 6: MongoDB Indexes (Optional but Recommended)

For better performance, add these indexes:

```javascript
// In MongoDB shell or compass
db.interviews.createIndex({ companyId: 1, scheduledAt: -1 })
db.interviews.createIndex({ studentId: 1, status: 1 })
db.interviews.createIndex({ applicationId: 1 })
```

## Step 7: Configure Real-Time Update Interval (Optional)

Edit in `frontend/src/pages/InterviewReports.jsx` (line ~50):

```javascript
// Default is 30 seconds - change as needed
const interval = setInterval(fetchRecentUpdates, 30000); // 30000ms = 30 seconds
```

## Verification Checklist

- [ ] Routes added to App.jsx
- [ ] Navigation links visible in sidebar
- [ ] Backend services imported in controller
- [ ] Uploads directory exists
- [ ] API endpoints accessible
- [ ] Frontend pages render without errors
- [ ] Date filtering works
- [ ] Real-time updates refresh
- [ ] Download generates valid HTML
- [ ] Authorization prevents unauthorized access

## File Reference

### New Backend Files
- `backend/utils/interviewReportingService.js` - Reporting logic
- `backend/utils/documentService.js` - Document generation

### Updated Backend Files
- `backend/controllers/interviewController.js` - Added 8 new endpoints
- `backend/routes/interviewRoutes.js` - Added new routes

### New Frontend Files
- `frontend/src/pages/InterviewReports.jsx` - Main reporting dashboard
- `frontend/src/pages/InterviewTimeline.jsx` - Application timeline view
- `frontend/src/styles/InterviewReports.css` - Dashboard styling
- `frontend/src/styles/InterviewTimeline.css` - Timeline styling

### Updated Frontend Files
- `frontend/src/pages/InterviewCenter.jsx` - Added navigation link

## Environment Variables

No new environment variables are required. The system uses:
- Existing JWT authentication
- Existing MongoDB connection
- Existing upload directory structure

## Troubleshooting

**Issue: 404 on report endpoints**
- Solution: Verify routes are correctly added to interviewRoutes.js
- Check: Routes are prefixed with `/api/interview/`

**Issue: Authorization errors (403)**
- Solution: Verify user has correct role (company, system_admin, or university_admin)
- Check: JWT token is valid and not expired

**Issue: Documents not generating**
- Solution: Create uploads/documents directory manually
- Check: File write permissions are correct (755)

**Issue: Frontend not displaying reports**
- Solution: Add routes to App.jsx
- Check: Component imports are correct

**Issue: Real-time updates not showing**
- Solution: Clear browser cache
- Check: Network requests in DevTools are successful

## API Testing with Postman

### Setup

1. Create Postman collection
2. Set base URL: `http://localhost:5000/api`
3. Add authorization header: `Bearer YOUR_JWT_TOKEN`

### Test Endpoints

**GET /interview/report/summary**
- Params: startDate, endDate (YYYY-MM-DD format)
- Returns: Comprehensive report with statistics

**GET /interview/report/recent-updates**
- Params: minutesAgo (default 60)
- Returns: Recent changes array

**GET /interview/download/history**
- Params: startDate, endDate
- Returns: HTML file download

**GET /interview/timeline/:applicationId**
- No params needed
- Returns: Timeline data for application

## Database Queries (MongoDB)

View interview statistics directly:

```javascript
// Count interviews by status
db.interviews.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 }
    }
  }
])

// Get recent interviews
db.interviews.find().sort({ updatedAt: -1 }).limit(10)

// Get company interviews
db.interviews.find({ companyId: ObjectId("...") }).count()
```

## Performance Notes

1. **For large datasets (1000+ interviews):**
   - Always use date range filtering
   - Keep date ranges to 30 days maximum
   - Add MongoDB indexes (see Step 6)

2. **Real-time updates:**
   - 30-second refresh is good balance
   - Can reduce to 10 seconds for very active interviews
   - Higher than 60 seconds may feel stale

3. **Document generation:**
   - First generation takes 1-2 seconds
   - Subsequent requests are faster
   - Consider caching for frequently accessed reports

## Next Steps

After integration:

1. **Test thoroughly** - Use verification checklist above
2. **Monitor logs** - Check server logs for errors
3. **Get user feedback** - Ensure UX meets expectations
4. **Scale gradually** - Add more features based on usage
5. **Consider enhancements** - PDF export, email delivery, WebSocket

## Support Resources

- Full documentation: `INTERVIEW_REPORTING_DOCUMENTATION.md`
- Implementation summary: `INTERVIEW_IMPLEMENTATION_SUMMARY.md`
- API examples: Available in both docs above

## Production Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] MongoDB indexes created
- [ ] Uploads directory exists with correct permissions
- [ ] API rate limiting configured (if needed)
- [ ] Error logging implemented
- [ ] Database backups configured
- [ ] CORS settings verified
- [ ] JWT expiration reasonable
- [ ] HTML reports tested in all browsers
- [ ] Mobile responsiveness verified

---

**Status:** Ready for Integration
**Estimated Integration Time:** 15-30 minutes
**Difficulty Level:** Easy to Medium
