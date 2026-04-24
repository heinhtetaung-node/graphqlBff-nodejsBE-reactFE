import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useNavigate, Link } from 'react-router-dom';
import { REGISTER } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: '', password: '', name: '', role: 'JOB_HUNTER', phone: '', bio: '',
  });
  const [error, setError] = useState('');

  const [registerMutation, { loading }] = useMutation(REGISTER, {
    onCompleted: (data) => {
      login(data.register.token, data.register.user);
      navigate('/dashboard');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    registerMutation({ variables: form });
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div style={{ maxWidth: 440, margin: '60px auto' }}>
      <div className="card">
        <h2 style={{ marginBottom: 24 }}>Register</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input required value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label>I am a...</label>
            <select value={form.role} onChange={set('role')}>
              <option value="JOB_HUNTER">Job Hunter (looking for work)</option>
              <option value="TALENT_HUNTER">Talent Hunter (hiring)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Phone (optional)</label>
            <input value={form.phone} onChange={set('phone')} />
          </div>
          <div className="form-group">
            <label>Bio (optional)</label>
            <textarea rows={3} value={form.bio} onChange={set('bio')} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
