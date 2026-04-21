import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const EmployeeDetail = () => {
  const { employeeId } = useParams();
  const [employee, setEmployee] = useState(null);
  const [training, setTraining] = useState({ summary: null, courses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEmployee = async () => {
      setLoading(true);
      setError('');

      try {
        const [employeeResponse, trainingResponse] = await Promise.all([
          api.get(`/employees/${employeeId}`),
          api.get(`/employees/${employeeId}/training-summary`),
        ]);

        setEmployee(employeeResponse.data);
        setTraining(trainingResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load employee details.');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [employeeId]);

  const summary = training.summary || {
    assigned_courses: 0,
    completed_courses: 0,
    overdue_courses: 0,
    expiring_soon_courses: 0,
  };

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <Link className="back-link" to="/employees">
              Back to employees
            </Link>
            <h1>{employee?.name || 'Employee detail'}</h1>
            <p className="page-subtitle">
              Review assigned courses, progress, completion status, and upcoming expiry risk.
            </p>
          </div>
        </div>

        {error && <div className="notice notice-error">{error}</div>}
        {loading && <div className="notice">Loading employee training data...</div>}

        {!loading && employee && (
          <>
            <section className="card">
              <div className="card-heading">
                <div>
                  <h2>{employee.name}</h2>
                  <p>{employee.email}</p>
                </div>

                <span className="status-pill">{employee.role}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <strong>{summary.assigned_courses || 0}</strong>
                  <span>Assigned courses</span>
                </div>
                <div className="stat-card">
                  <strong>{summary.completed_courses || 0}</strong>
                  <span>Completed</span>
                </div>
                <div className="stat-card">
                  <strong>{summary.overdue_courses || 0}</strong>
                  <span>Overdue</span>
                </div>
                <div className="stat-card">
                  <strong>{summary.expiring_soon_courses || 0}</strong>
                  <span>Expiring soon</span>
                </div>
              </div>
            </section>

            <section className="stack-layout">
              {training.courses.length === 0 && (
                <div className="notice">No assigned courses were found for this employee.</div>
              )}

              {training.courses.map((course) => {
                const totalLessons = Number(course.total_lessons || 0);
                const completedLessons = Number(course.completed_lessons || 0);
                const percent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

                return (
                  <article className="card" key={course.id}>
                    <div className="card-heading">
                      <div>
                        <h2>{course.title}</h2>
                        <p>{course.description || 'No description provided.'}</p>
                      </div>

                      <span className={`status-pill ${
                        course.status === 'Completed'
                          ? 'status-pill-success'
                          : course.status === 'Overdue'
                            ? 'status-pill-danger'
                            : ''
                      }`}>
                        {course.status}
                      </span>
                    </div>

                    <div className="mini-progress">
                      <div className="mini-progress-bar">
                        <div style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mini-progress-copy">
                        <strong>{percent}% complete</strong>
                        <span>{completedLessons} of {totalLessons} lessons done</span>
                      </div>
                    </div>

                    <div className="meta-grid">
                      <span>Enrollment expiry: {course.expiry_date || 'Not set'}</span>
                      <span>Completed at: {course.completed_at || 'Not completed'}</span>
                      <span>Certificate expiry: {course.certificate_expiry_date || 'Not issued'}</span>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default EmployeeDetail;
