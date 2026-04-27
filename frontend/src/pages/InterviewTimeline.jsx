import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/InterviewTimeline.css';

export default function InterviewTimeline() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const token = user?.token;
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get(
          `http://localhost:5000/api/interview/timeline/${applicationId}`,
          { headers }
        );
        setTimeline(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
    const interval = setInterval(fetchTimeline, 30000);
    return () => clearInterval(interval);
  }, [applicationId, token]);

  const downloadTimeline = async () => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `http://localhost:5000/api/interview/download/timeline/${applicationId}`,
        { headers }
      );
      
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-${applicationId}.html`;
      a.click();
    } catch (err) {
      setError('Error downloading timeline');
      console.error('Download failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="interview-timeline">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interview-timeline">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!timeline?.interview) {
    return (
      <div className="interview-timeline">
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <p>No interview data found</p>
        </div>
      </div>
    );
  }

  const interview = timeline.interview;
  const events = timeline.timeline || [];

  return (
    <div className="interview-timeline">
      {/* Header */}
      <div className="timeline-header">
        <div className="header-top">
          <h1>📋 Interview Timeline</h1>
          <button className="download-btn" onClick={downloadTimeline}>
            <span>📥</span> Download
          </button>
        </div>
        <p className="header-subtitle">Complete interview journey and status history</p>
      </div>

      {/* Info Cards */}
      <div className="info-grid">
        <InfoCard label="Student" value={interview.studentName} icon="👤" />
        <InfoCard label="Company" value={interview.companyName} icon="🏢" />
        <InfoCard label="Position" value={interview.internshipTitle} icon="💼" />
        <InfoCard label="Interview Date" value={interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleDateString() : 'N/A'} icon="📅" />
      </div>

      {/* Status Summary */}
      <div className="status-summary">
        <h2>Current Status</h2>
        <div className="summary-cards">
          <SummaryCard 
            label="Initial Status" 
            value={events[0]?.status || interview.status || 'Unknown'} 
            type="text"
          />
          <SummaryCard 
            label="Current Status" 
            value={interview.status} 
            type="badge"
          />
          <SummaryCard 
            label="Student Confirmation" 
            value={interview.studentConfirmation || 'Pending'} 
            type="badge"
          />
          <SummaryCard 
            label="Total Changes" 
            value={events.length} 
            type="text"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-section">
        <h2>Interview Journey</h2>
        {events.length > 0 ? (
          <div className="timeline-track">
            {events.map((event, idx) => (
              <TimelineEvent 
                key={idx} 
                event={event} 
                index={idx} 
                total={events.length}
              />
            ))}
          </div>
        ) : (
          <div className="empty-timeline">
            <p>No history events available</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="info-card">
      <div className="info-icon">{icon}</div>
      <div className="info-content">
        <p className="info-label">{label}</p>
        <h3 className="info-value">{value || 'N/A'}</h3>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, type }) {
  return (
    <div className="summary-card">
      <p className="summary-label">{label}</p>
      {type === 'badge' ? (
        <span className={`badge badge-${value?.toLowerCase() || 'unknown'}`}>
          {value || 'Unknown'}
        </span>
      ) : (
        <h3 className="summary-value">{value}</h3>
      )}
    </div>
  );
}

function TimelineEvent({ event, index, total }) {
  const isLast = index === total - 1;
  
  return (
    <div className="timeline-event">
      <div className="event-marker">
        <div className="marker-circle">{index + 1}</div>
        {!isLast && <div className="marker-line"></div>}
      </div>
      <div className="event-content">
        <div className="event-header">
          <span className={`event-status badge badge-${event.status?.toLowerCase() || 'unknown'}`}>
            {event.status || 'Unknown'}
          </span>
          <span className="event-time">
            {new Date(event.changedAt).toLocaleString()}
          </span>
        </div>
        {event.note && (
          <p className="event-note">💭 {event.note}</p>
        )}
      </div>
    </div>
  );
}
