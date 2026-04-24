import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { SUBSCRIBE } from '../graphql/queries';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'JOB_HUNTER_FREE',
    name: 'Job Hunter Free',
    price: 0,
    features: ['10 job applications per month', 'Basic profile', 'Job search'],
  },
  {
    id: 'JOB_HUNTER_PRO',
    name: 'Job Hunter Pro',
    price: 5,
    featured: true,
    features: ['Unlimited job applications', 'Priority profile visibility', 'Job search', 'Application tracking'],
  },
  {
    id: 'TALENT_HUNTER_FREE',
    name: 'Talent Hunter Free',
    price: 0,
    features: ['10 job posts per month', 'Basic company profile', 'Application review'],
  },
  {
    id: 'TALENT_HUNTER_PRO',
    name: 'Talent Hunter Pro',
    price: 30,
    featured: true,
    features: ['Unlimited job posts', 'Featured listings', 'Advanced candidate search', 'Application management'],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [subscribe, { loading, error }] = useMutation(SUBSCRIBE);
  const [success, setSuccess] = useState('');

  const handleSubscribe = async (planId) => {
    setSuccess('');
    try {
      await subscribe({ variables: { plan: planId } });
      setSuccess(`Subscribed to ${planId.replace(/_/g, ' ')}!`);
    } catch {}
  };

  // Filter plans based on user role
  const visiblePlans = user
    ? plans.filter((p) =>
        user.role === 'TALENT_HUNTER' ? p.id.startsWith('TALENT_HUNTER') : p.id.startsWith('JOB_HUNTER')
      )
    : plans;

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>Pricing</h1>
        <p style={{ color: '#666' }}>Choose the plan that fits your needs</p>
      </div>
      {success && <div className="card" style={{ background: '#d4edda', textAlign: 'center' }}><p style={{ color: '#155724', fontWeight: 600 }}>{success}</p></div>}
      {error && <p className="error" style={{ textAlign: 'center' }}>{error.message}</p>}
      <div className="grid grid-2">
        {visiblePlans.map((plan) => (
          <div className={`card pricing-card ${plan.featured ? 'featured' : ''}`} key={plan.id}>
            {plan.featured && <span className="badge badge-blue" style={{ marginBottom: 8 }}>Popular</span>}
            <h3>{plan.name}</h3>
            <div className="price">
              {plan.price === 0 ? 'Free' : `$${plan.price}`}
              {plan.price > 0 && <span>/month</span>}
            </div>
            <ul>
              {plan.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
            {user && (
              <button
                className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', marginTop: 16 }}
                disabled={loading}
                onClick={() => handleSubscribe(plan.id)}
              >
                {loading ? 'Processing...' : 'Subscribe'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
