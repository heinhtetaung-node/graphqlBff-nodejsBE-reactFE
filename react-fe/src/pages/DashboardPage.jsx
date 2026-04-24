import { useQuery } from '@apollo/client';
import { Navigate, Link } from 'react-router-dom';
import { GET_ME, MY_APPLICATIONS } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { data: meData, loading: meLoading } = useQuery(GET_ME, { skip: !isAuthenticated });
  const { data: appsData } = useQuery(MY_APPLICATIONS, {
    variables: { page: 1, limit: 10 },
    skip: !isAuthenticated || user?.role !== 'JOB_HUNTER',
  });

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (meLoading) return <div className="loading">Loading...</div>;

  const me = meData?.me;
  const sub = me?.subscription;

  return (
    <div style={{ maxWidth: 800, margin: '32px auto' }}>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="card">
        <h3>Profile</h3>
        <p><strong>Name:</strong> {me?.name}</p>
        <p><strong>Email:</strong> {me?.email}</p>
        <p><strong>Role:</strong> {me?.role === 'TALENT_HUNTER' ? 'Talent Hunter' : 'Job Hunter'}</p>
        {me?.bio && <p><strong>Bio:</strong> {me.bio}</p>}
        {me?.skills?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <strong>Skills: </strong>
            {me.skills.map((s) => <span key={s} className="badge badge-green" style={{ marginRight: 4 }}>{s}</span>)}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Subscription</h3>
        {sub ? (
          <>
            <p><strong>Plan:</strong> {sub.plan.replace(/_/g, ' ')}</p>
            <p><strong>Price:</strong> {sub.price > 0 ? `$${sub.price}/month` : 'Free'}</p>
            <p><strong>Status:</strong> <span className={`badge ${sub.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>{sub.status}</span></p>
          </>
        ) : (
          <p>No active subscription. <Link to="/pricing">Choose a plan</Link></p>
        )}
        <div style={{ marginTop: 12 }}>
          <Link to="/pricing" className="btn btn-primary">Manage Plan</Link>
        </div>
      </div>

      {user?.role === 'TALENT_HUNTER' && (
        <div className="card">
          <h3>Quick Actions</h3>
          <Link to="/jobs/new" className="btn btn-primary" style={{ marginRight: 8 }}>Post a Job</Link>
          <Link to="/companies" className="btn btn-secondary">View Companies</Link>
        </div>
      )}

      {user?.role === 'JOB_HUNTER' && appsData?.myApplications && (
        <div className="card">
          <h3>My Applications ({appsData.myApplications.total})</h3>
          {appsData.myApplications.applications.length === 0 ? (
            <p>No applications yet. <Link to="/jobs">Browse jobs</Link></p>
          ) : (
            appsData.myApplications.applications.map((app) => (
              <div key={app.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{app.job?.title}</strong>
                    <span style={{ color: '#666', marginLeft: 8 }}>{app.job?.company?.name}</span>
                  </div>
                  <span className={`badge ${app.status === 'PENDING' ? 'badge-yellow' : app.status === 'ACCEPTED' ? 'badge-green' : 'badge-red'}`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
