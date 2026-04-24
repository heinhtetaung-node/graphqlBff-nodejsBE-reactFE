import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>Find Your Next Opportunity</h1>
      <p style={{ fontSize: 20, color: '#666', marginBottom: 40 }}>
        Connect talent hunters with job hunters. Post jobs, apply, and grow your career.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link to="/jobs" className="btn btn-primary" style={{ fontSize: 18, padding: '14px 32px' }}>
          Browse Jobs
        </Link>
        <Link to="/register" className="btn btn-secondary" style={{ fontSize: 18, padding: '14px 32px' }}>
          Get Started
        </Link>
      </div>

      <div className="grid grid-3" style={{ marginTop: 80, textAlign: 'left' }}>
        <div className="card">
          <h3>For Job Hunters</h3>
          <p>Browse thousands of jobs, apply with one click, and track your applications.</p>
          <p style={{ marginTop: 8, fontWeight: 600 }}>Free: 10 applies/month | Pro: $5/mo unlimited</p>
        </div>
        <div className="card">
          <h3>For Talent Hunters</h3>
          <p>Post jobs, review applications, and find the best talent for your team.</p>
          <p style={{ marginTop: 8, fontWeight: 600 }}>Free: 10 posts/month | Pro: $30/mo unlimited</p>
        </div>
        <div className="card">
          <h3>For Companies</h3>
          <p>Create your company profile, showcase your culture, and attract top talent.</p>
        </div>
      </div>
    </div>
  );
}
