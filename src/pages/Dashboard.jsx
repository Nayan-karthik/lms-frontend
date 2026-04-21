import { useEffect, useState } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    api.get('/dashboard/compliance')
      .then(res => setData(res.data));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const downloadCSV = async () => {
  try {
    const response = await api.get('/reports/compliance', {
      responseType: 'blob', // IMPORTANT
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'compliance_report.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (err) {
    alert('Failed to download CSV');
  }
};

  return (
  <>
    <Navbar />

    <div style={{
      padding: '40px',
      fontFamily: 'Arial'
    }}>
      <h2>Compliance Dashboard</h2>

      <div style={{ marginBottom: '20px' }}>
        <p>Total Employees: {data.totalEmployees}</p>
        <p>Compliant: {data.compliant}</p>
        <p>Overdue: {data.overdue}</p>
        <p>Expiring Soon: {data.expiringSoon}</p>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={downloadCSV}
          style={{
            padding: '10px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Download Compliance CSV
        </button>

        <button
          onClick={logout}
          style={{
            padding: '10px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  </>
);
};

export default Dashboard;