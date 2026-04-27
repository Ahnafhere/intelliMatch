const fs = require('fs');
const path = require('path');
const { generateCompanyInterviewReport, getApplicationInterviewTimeline } = require('./interviewReportingService');

/**
 * Generate HTML document for interview history
 */
const generateInterviewHistoryDocument = async (companyId, startDate = null, endDate = null) => {
  try {
    const report = await generateCompanyInterviewReport(companyId, startDate, endDate);

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview History Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            color: #007bff;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        .report-period {
            background: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        .statistics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card.scheduled { background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); }
        .stat-card.completed { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
        .stat-card.selected { background: linear-gradient(135deg, #17a2b8 0%, #0c5460 100%); }
        .stat-card.rejected { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 20px;
        }
        .section h3 {
            color: #555;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 16px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table thead {
            background-color: #f0f0f0;
            border-bottom: 2px solid #ddd;
        }
        table th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #333;
        }
        table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        table tbody tr:hover {
            background-color: #f9f9f9;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-scheduled { background: #fff3cd; color: #856404; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-selected { background: #d1ecf1; color: #0c5460; }
        .status-rejected { background: #f8d7da; color: #721c24; }
        .confirmation-confirmed { background: #d4edda; color: #155724; }
        .confirmation-pending { background: #fff3cd; color: #856404; }
        .confirmation-declined { background: #f8d7da; color: #721c24; }
        .timeline {
            border-left: 3px solid #007bff;
            padding-left: 20px;
            margin-left: 10px;
        }
        .timeline-item {
            position: relative;
            margin-bottom: 20px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        .timeline-item:before {
            content: '';
            position: absolute;
            left: -23px;
            top: 20px;
            width: 15px;
            height: 15px;
            background: #007bff;
            border: 3px solid white;
            border-radius: 50%;
        }
        .timeline-date {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .timeline-status {
            font-weight: 600;
            color: #007bff;
        }
        .timeline-note {
            font-size: 13px;
            color: #555;
            margin-top: 5px;
        }
        .no-data {
            text-align: center;
            padding: 30px;
            color: #999;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        @media print {
            body { background: white; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview History Report</h1>
            <p>Comprehensive interview management and tracking report</p>
        </div>

        <div class="report-period">
            <strong>Report Period:</strong> ${report.reportPeriod.startDate} to ${report.reportPeriod.endDate}
            <br><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}
        </div>

        <div class="section">
            <h2>Overview Statistics</h2>
            <div class="statistics">
                <div class="stat-card">
                    <div class="stat-label">Total Interviews</div>
                    <div class="stat-value">${report.statistics.total}</div>
                </div>
                <div class="stat-card scheduled">
                    <div class="stat-label">Scheduled</div>
                    <div class="stat-value">${report.statistics.scheduled}</div>
                </div>
                <div class="stat-card completed">
                    <div class="stat-label">Completed</div>
                    <div class="stat-value">${report.statistics.completed}</div>
                </div>
                <div class="stat-card selected">
                    <div class="stat-label">Selected</div>
                    <div class="stat-value">${report.statistics.selected}</div>
                </div>
                <div class="stat-card rejected">
                    <div class="stat-label">Rejected</div>
                    <div class="stat-value">${report.statistics.rejected}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Confirmation Rate</div>
                    <div class="stat-value">${report.statistics.confirmationRate}%</div>
                </div>
                <div class="stat-card scheduled">
                    <div class="stat-label">Selection Rate</div>
                    <div class="stat-value">${report.statistics.selectionRate}%</div>
                </div>
                <div class="stat-card rejected">
                    <div class="stat-label">Decline Rate</div>
                    <div class="stat-value">${report.statistics.declineRate}%</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Student Confirmations</h2>
            <p><strong>Confirmed:</strong> ${report.byConfirmation.confirmed.length} | 
               <strong>Pending:</strong> ${report.byConfirmation.pending.length} | 
               <strong>Declined:</strong> ${report.byConfirmation.declined.length}</p>
        </div>

        <div class="section">
            <h2>Interview Details</h2>
            ${report.interviewDetails.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Internship</th>
                        <th>Scheduled Date</th>
                        <th>Mode</th>
                        <th>Status</th>
                        <th>Confirmation</th>
                        <th>Match Score</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.interviewDetails.map(interview => `
                    <tr>
                        <td>${interview.studentName}</td>
                        <td>${interview.internshipTitle}</td>
                        <td>${new Date(interview.scheduledDate).toLocaleDateString()}</td>
                        <td>${interview.mode}</td>
                        <td><span class="status-badge status-${interview.currentStatus.toLowerCase()}">${interview.currentStatus}</span></td>
                        <td><span class="status-badge confirmation-${interview.studentConfirmation.toLowerCase()}">${interview.studentConfirmation}</span></td>
                        <td>${(interview.matchScore * 100).toFixed(1)}%</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<div class="no-data">No interviews found for the selected period.</div>'}
        </div>

        <div class="footer">
            <p>This report is automatically generated and is subject to change as new interview data is recorded.</p>
            <p>&copy; ${new Date().getFullYear()} Interview Tracking System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    return htmlContent;
  } catch (err) {
    throw new Error(`Failed to generate interview history document: ${err.message}`);
  }
};

/**
 * Generate HTML document for application interview timeline
 */
const generateApplicationInterviewDocument = async (applicationId) => {
  try {
    const timeline = await getApplicationInterviewTimeline(applicationId);

    if (!timeline) {
      throw new Error('No interview found for this application');
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Timeline</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header-info {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
            font-size: 14px;
        }
        .header-info-item {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 4px;
        }
        .header-info-label {
            font-weight: 600;
            color: #fff;
        }
        .header-info-value {
            color: #f0f0f0;
            margin-top: 5px;
        }
        .timeline-section {
            margin-bottom: 40px;
        }
        .timeline-section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .timeline {
            position: relative;
            padding: 20px 0;
        }
        .timeline:before {
            content: '';
            position: absolute;
            left: 30px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #ddd;
        }
        .timeline-item {
            margin-bottom: 30px;
            padding-left: 80px;
            position: relative;
        }
        .timeline-marker {
            position: absolute;
            left: 15px;
            top: 5px;
            width: 30px;
            height: 30px;
            background: #667eea;
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .timeline-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        .timeline-status {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 5px;
        }
        .timeline-date {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
        }
        .timeline-note {
            font-size: 14px;
            color: #555;
            line-height: 1.5;
        }
        .summary {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .summary h3 {
            margin-top: 0;
            color: #333;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
        }
        .summary-row:last-child {
            border-bottom: none;
        }
        .summary-label {
            font-weight: 600;
            color: #555;
        }
        .summary-value {
            color: #667eea;
            font-weight: 600;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-confirmed { background: #d4edda; color: #155724; }
        .badge-pending { background: #fff3cd; color: #856404; }
        .badge-declined { background: #f8d7da; color: #721c24; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview Timeline Report</h1>
            <div class="header-info">
                <div class="header-info-item">
                    <div class="header-info-label">Student</div>
                    <div class="header-info-value">${timeline.interview.studentName}</div>
                </div>
                <div class="header-info-item">
                    <div class="header-info-label">Company</div>
                    <div class="header-info-value">${timeline.interview.companyName}</div>
                </div>
                <div class="header-info-item">
                    <div class="header-info-label">Position</div>
                    <div class="header-info-value">${timeline.interview.internshipTitle}</div>
                </div>
                <div class="header-info-item">
                    <div class="header-info-label">Interview Date</div>
                    <div class="header-info-value">${new Date(timeline.interview.scheduledDate).toLocaleString()}</div>
                </div>
            </div>
        </div>

        <div class="summary">
            <h3>Current Status Summary</h3>
            <div class="summary-row">
                <span class="summary-label">Initial Status:</span>
                <span class="summary-value">${timeline.statusSummary.initial}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Current Status:</span>
                <span class="summary-value">${timeline.statusSummary.current}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Student Confirmation:</span>
                <span class="summary-value"><span class="badge badge-${timeline.statusSummary.studentConfirmation.toLowerCase()}">${timeline.statusSummary.studentConfirmation}</span></span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Total Status Changes:</span>
                <span class="summary-value">${timeline.statusSummary.totalStatusChanges}</span>
            </div>
        </div>

        <div class="timeline-section">
            <h2>Interview Status Timeline</h2>
            <div class="timeline">
                ${timeline.timeline.map((entry, idx) => `
                <div class="timeline-item">
                    <div class="timeline-marker">${entry.sequence}</div>
                    <div class="timeline-content">
                        <div class="timeline-status">${entry.status}</div>
                        <div class="timeline-date">${new Date(entry.changedAt).toLocaleString()}</div>
                        ${entry.note ? `<div class="timeline-note"><strong>Note:</strong> ${entry.note}</div>` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>This document contains real-time interview tracking information.</p>
        </div>
    </div>
</body>
</html>
    `;

    return htmlContent;
  } catch (err) {
    throw new Error(`Failed to generate application interview document: ${err.message}`);
  }
};

/**
 * Save document to file system
 */
const saveDocumentToFile = (content, filename) => {
  try {
    const docsDir = path.join(__dirname, '../uploads/documents');
    
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    const filepath = path.join(docsDir, filename);
    fs.writeFileSync(filepath, content);
    
    return filepath;
  } catch (err) {
    throw new Error(`Failed to save document: ${err.message}`);
  }
};

module.exports = {
  generateInterviewHistoryDocument,
  generateApplicationInterviewDocument,
  saveDocumentToFile,
};
