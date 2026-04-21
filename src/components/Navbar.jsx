import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      backgroundColor: '#1f2937',
      color: 'white'
    }}>
      <h3>Logistics LMS</h3>

      <div style={{ display: 'flex', gap: '16px' }}>
        {isAdmin ? (
          <>
            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
              Dashboard
            </Link>

            <Link to="/employees" style={{ color: 'white', textDecoration: 'none' }}>
              Employees
            </Link>
            <Link to="/courses" style={{ color: "white", textDecoration: "none" }}>
              Courses
            </Link>
          </>
        ) : (
          <Link to="/learning" style={{ color: 'white', textDecoration: 'none' }}>
            My Learning
          </Link>
        )}

        <button
          onClick={logout}
          style={{
            background: '#dc2626',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
