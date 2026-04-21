import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Employees = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    api.get('/employees').then((res) => setEmployees(res.data));
  }, []);

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <h1>Employees</h1>
            <p className="page-subtitle">
              Open an employee to review assigned courses, progress, and compliance risk.
            </p>
          </div>
        </div>

        <section className="stack-layout">
          {employees.map((employee) => (
            <article className="card" key={employee.id}>
              <div className="card-heading">
                <div>
                  <h2>{employee.name}</h2>
                  <p>{employee.email}</p>
                </div>

                <span className="status-pill">{employee.role}</span>
              </div>

              <div className="action-row">
                <Link className="primary-button button-link" to={`/employees/${employee.id}`}>
                  View training status
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
};

export default Employees;
