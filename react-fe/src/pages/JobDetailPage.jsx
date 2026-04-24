import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'react-router-dom';
import { GET_JOB, APPLY_TO_JOB } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

export default function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState('');

  const { data, loading, error } = useQuery(GET_JOB, { variables: { id } });
  const [applyMutation, { loading: applying }] = useMutation(APPLY_TO_JOB, {
    onCompleted: () => setApplied(true),
    onError: (err) => setApplyError(err.message),
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  const job = data.job;

  return (
    <div style={{ maxWidth: 800, margin: '32px auto' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1>{job.title}</h1>
            <p style={{ color: '#666', fontSize: 18 }}>{job.company?.name}</p>
          </div>
          <span className="badge badge-blue" style={{ height: 'fit-content' }}>{job.jobType}</span>
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 24, color: '#555' }}>
          <span>📍 {job.location || 'Remote'}</span>
          <span>💰 {job.salaryRange || 'Competitive'}</span>
          <span>📊 {job.experienceLevel}</span>
        </div>

        {job.skills?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            {job.skills.map((s) => <span key={s} className="badge badge-green">{s}</span>)}
          </div>
        )}

        <h3 style={{ marginBottom: 8 }}>Description</h3>
        <p style={{ whiteSpace: 'pre-wrap', marginBottom: 32 }}>{job.description}</p>

        {job.company && (
          <>
            <h3 style={{ marginBottom: 8 }}>About {job.company.name}</h3>
            <p style={{ marginBottom: 32 }}>{job.company.description}</p>
          </>
        )}
      </div>

      {user?.role === 'JOB_HUNTER' && !applied && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Apply for this position</h3>
          {applyError && <p className="error">{applyError}</p>}
          <div className="form-group">
            <label>Cover Letter</label>
            <textarea rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Tell them why you're a great fit..." />
          </div>
          <button
            className="btn btn-primary"
            disabled={applying}
            onClick={() => applyMutation({ variables: { jobId: id, coverLetter } })}
          >
            {applying ? 'Applying...' : 'Submit Application'}
          </button>
        </div>
      )}
      {applied && (
        <div className="card" style={{ background: '#d4edda', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: '#155724' }}>Application submitted successfully!</p>
        </div>
      )}
    </div>
  );
}
