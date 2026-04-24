import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { CREATE_JOB, GET_COMPANIES } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    companyId: '', title: '', description: '', location: '', salaryRange: '',
    jobType: 'FULL_TIME', experienceLevel: 'MID', skills: '',
  });
  const [error, setError] = useState('');

  const { data: companiesData } = useQuery(GET_COMPANIES, { variables: { page: 1, limit: 100 } });

  const [createJob, { loading }] = useMutation(CREATE_JOB, {
    onCompleted: () => navigate('/jobs'),
    onError: (err) => setError(err.message),
  });

  if (!user || user.role !== 'TALENT_HUNTER') {
    return <div className="card" style={{ marginTop: 32 }}><p>Only Talent Hunters can post jobs.</p></div>;
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createJob({
      variables: {
        ...form,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()) : [],
      },
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '32px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: 24 }}>Post a New Job</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Company</label>
            <select required value={form.companyId} onChange={set('companyId')}>
              <option value="">Select a company</option>
              {companiesData?.companies?.companies?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Job Title</label>
            <input required value={form.title} onChange={set('title')} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={5} value={form.description} onChange={set('description')} />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input value={form.location} onChange={set('location')} placeholder="e.g., Remote, New York, Berlin" />
          </div>
          <div className="form-group">
            <label>Salary Range</label>
            <input value={form.salaryRange} onChange={set('salaryRange')} placeholder="e.g., $80k - $120k" />
          </div>
          <div className="form-group">
            <label>Job Type</label>
            <select value={form.jobType} onChange={set('jobType')}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="REMOTE">Remote</option>
            </select>
          </div>
          <div className="form-group">
            <label>Experience Level</label>
            <select value={form.experienceLevel} onChange={set('experienceLevel')}>
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="LEAD">Lead</option>
            </select>
          </div>
          <div className="form-group">
            <label>Skills (comma-separated)</label>
            <input value={form.skills} onChange={set('skills')} placeholder="e.g., React, Node.js, PostgreSQL" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
