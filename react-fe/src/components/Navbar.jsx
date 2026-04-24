import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav>
      <div className="container">
        <Link to="/" style={{ fontSize: 20, fontWeight: 700, marginLeft: 0 }}>JobPlatform</Link>
        <div>
          <Link to="/jobs">Jobs</Link>
          <Link to="/companies">Companies</Link>
          <Link to="/pricing">Pricing</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} style={{ marginLeft: 20 }}>
                Logout ({user.name})
              </a>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
