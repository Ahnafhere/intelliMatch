import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/InterviewReports.css';

export default function InterviewReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const token = user?.token;

  const fetchReports = async () => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = { Authorization: `Bearer ${token}` };
      const params = `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      const reportRes = await axios.get(`http://localhost:5000/api/interview/report/summary?${params}`, { headers });
      
      // Extract data from report
      const reportData = reportRes.data;
      setReports({
        details: reportData.interviewDetails || []
      });
      setStats({
        total: reportData.statistics?.total || 0,
        scheduled: reportData.statistics?.scheduled || 0,
        completed: reportData.statistics?.completed || 0,
        selected: reportData.statistics?.selected || 0,
        rejected: reportData.statistics?.rejected || 0,
        confirmationRate: reportData.statistics?.confirmationRate || 0,
        selectionRate: reportData.statistics?.selectionRate || 0,
        studentConfirmations: reportData.statistics?.studentConfirmations || 0
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUpdates = async () => {
    if (!token) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`http://localhost:5000/api/interview/report/recent-updates?minutesAgo=120`, { headers });
      // API returns array directly, not {updates: []}
      setRecentUpdates(Array.isArray(res.data) ? res.data : res.data.updates || []);
    } catch (err) {
      console.error('Error fetching recent updates:', err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  useEffect(() => {
    fetchRecentUpdates();
    const interval = setInterval(fetchRecentUpdates, 30000);
    return () => clearInterval(interval);
  }, []);

  const downloadReport = async () => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const params = `startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      const res = await axios.get(`http://localhost:5000/api/interview/download/history?${params}`, { headers });
      
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-report-${new Date().getTime()}.html`;
      a.click();
    } catch (err) {
      setError('Error downloading report');
      console.error('Error downloading report:', err);
    }
  };

  if (loading) {
    return (
      <div className="interview-reports">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interview-reports">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchReports} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-reports">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <h1>📊 Interview Analytics</h1>
          <p>Track and analyze interview progress in real-time</p>
        </div>
        <button className="download-btn" onClick={downloadReport}>
          <span>📥</span> Download Report
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedTab('overview')}
          >
            <span className="tab-icon">📈</span>
            <span>Overview</span>
          </button>
          <button
            className={`tab-btn ${selectedTab === 'details' ? 'active' : ''}`}
            onClick={() => setSelectedTab('details')}
          >
            <span className="tab-icon">📋</span>
            <span>Details</span>
          </button>
          <button
            className={`tab-btn ${selectedTab === 'updates' ? 'active' : ''}`}
            onClick={() => setSelectedTab('updates')}
          >
            <span className="tab-icon">⚡</span>
            <span>Real-Time</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content-area">
        {selectedTab === 'overview' && stats && (
          <div className="overview-section">
            <div className="stats-grid">
              <StatCard label="Total Interviews" value={stats.total || 0} icon="📞" color="primary" />
              <StatCard label="Scheduled" value={stats.scheduled || 0} icon="📅" color="warning" />
              <StatCard label="Completed" value={stats.completed || 0} icon="✅" color="success" />
              <StatCard label="Selected" value={stats.selected || 0} icon="🎯" color="info" />
              <StatCard label="Rejected" value={stats.rejected || 0} icon="❌" color="danger" />
              <StatCard label="Confirmation Rate" value={`${stats.confirmationRate || 0}%`} icon="🔄" color="primary" />
            </div>
          </div>
        )}

        {selectedTab === 'details' && reports && (
          <div className="details-section">
            {reports.details && reports.details.length > 0 ? (
              <div className="table-wrapper">
                <table className="details-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Internship</th>
                      <th>Interview Date</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Confirmation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.details.map((interview, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="name-cell">
                          <div className="student-avatar">{interview.studentName?.[0]?.toUpperCase() || '?'}</div>
                          {interview.studentName || 'Unknown'}
                        </td>
                        <td>{interview.internshipTitle || 'N/A'}</td>
                        <td>{interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="mode-cell">{interview.mode || 'N/A'}</td>
                        <td>
                          <span className={`badge badge-status badge-${interview.currentStatus?.toLowerCase() || 'unknown'}`}>
                            {interview.currentStatus || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-confirmation badge-${interview.studentConfirmation?.toLowerCase() || 'pending'}`}>
                            {interview.studentConfirmation || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No interview data for the selected period</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'updates' && (
          <div className="updates-section">
            {recentUpdates.length > 0 ? (
              <div className="updates-grid">
                {recentUpdates.map((update, idx) => (
                  <div key={idx} className="update-card">
                    <div className="card-header">
                      <h4>{update.studentName || 'Unknown'}</h4>
                      <span className="time-ago">{formatTimeAgo(update.lastUpdate)}</span>
                    </div>
                    <p className="internship-name">{update.internshipTitle || 'N/A'}</p>
                    <div className="badges-group">
                      <span className={`badge badge-status badge-${update.currentStatus?.toLowerCase() || 'unknown'}`}>
                        {update.currentStatus || 'Unknown'}
                      </span>
                      {update.studentConfirmation && (
                        <span className={`badge badge-confirmation badge-${update.studentConfirmation?.toLowerCase()}`}>
                          {update.studentConfirmation}
                        </span>
                      )}
                    </div>
                    {update.lastHistoryEntry?.note && (
                      <p className="update-note">💭 {update.lastHistoryEntry.note}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔇</div>
                <p>No recent updates</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <p className="card-label">{label}</p>
        <h3 className="card-value">{value}</h3>
      </div>
    </div>
  );
}

function formatTimeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
