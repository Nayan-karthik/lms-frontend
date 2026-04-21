import { useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/Authcontext';
import { parseJwt } from '../utils/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token);
      const user = parseJwt(res.data.token);
      window.location.href = user?.role === 'admin' ? '/dashboard' : '/learning';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-hero">
        <div className="login-badge">Logistics Training Portal</div>
        <h1>Keep warehouse teams certified, current, and audit-ready.</h1>
        <p>
          Manage compliance courses, lesson content, and employee progress from one
          place built for day-to-day operations.
        </p>

        <div className="login-highlights">
          <div className="highlight-card">
            <strong>Courses</strong>
            <span>Build training paths with modules and lessons.</span>
          </div>
          <div className="highlight-card">
            <strong>Compliance</strong>
            <span>Track expiries, overdue training, and active readiness.</span>
          </div>
          <div className="highlight-card">
            <strong>Certificates</strong>
            <span>Support proof of completion when employees finish courses.</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-header">
            <p className="eyebrow">Sign In</p>
            <h2>Welcome back</h2>
            <p>Use your company credentials to access the LMS dashboard.</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <label>
            Email address
            <input
              autoComplete="email"
              placeholder="user@company.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Password
            <input
              autoComplete="current-password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <button className="login-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
