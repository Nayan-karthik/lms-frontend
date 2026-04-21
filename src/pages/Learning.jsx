import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Learning = () => {
  const [courses, setCourses] = useState([]);
  const [courseProgress, setCourseProgress] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await api.get('/courses');
        const loadedCourses = response.data;
        setCourses(loadedCourses);

        const progressEntries = await Promise.all(
          loadedCourses.map(async (course) => {
            const modulesResponse = await api.get(`/modules/course/${course.id}`);
            const modules = modulesResponse.data;

            const moduleProgress = await Promise.all(
              modules.map(async (module) => {
                const progressResponse = await api.get(`/progress/module/${module.id}`);
                return progressResponse.data;
              })
            );

            const lessons = moduleProgress.flat();
            const completed = lessons.filter((lesson) => lesson.completed).length;
            const total = lessons.length;

            return [course.id, {
              completed,
              total,
              percent: total === 0 ? 0 : Math.round((completed / total) * 100),
            }];
          })
        );

        setCourseProgress(Object.fromEntries(progressEntries));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <h1>My Learning</h1>
            <p className="page-subtitle">
              Open courses, work through lessons, and track your completion progress.
            </p>
          </div>
        </div>

        {error && <div className="notice notice-error">{error}</div>}
        {loading && <div className="notice">Loading available courses...</div>}

        <section className="stack-layout">
          {!loading && courses.length === 0 && (
            <div className="notice">No courses are available yet.</div>
          )}

          {courses.map((course) => (
            <article className="card learning-course-card" key={course.id}>
              <div className="card-heading">
                <div>
                  <h2>{course.title}</h2>
                  <p>{course.description || 'No description provided.'}</p>
                </div>
                <span className="status-pill">{course.status || 'draft'}</span>
              </div>

              <div className="mini-progress">
                <div className="mini-progress-bar">
                  <div style={{ width: `${courseProgress[course.id]?.percent || 0}%` }} />
                </div>
                <div className="mini-progress-copy">
                  <strong>{courseProgress[course.id]?.percent || 0}% complete</strong>
                  <span>
                    {(courseProgress[course.id]?.completed || 0)} of {(courseProgress[course.id]?.total || 0)} lessons done
                  </span>
                </div>
              </div>

              <div className="meta-grid">
                <span>Role target: {course.role_target || 'Not set'}</span>
                <span>Validity: {course.validity_months || 0} months</span>
                <span>Pass score: {course.pass_score || 0}%</span>
              </div>

              <div className="action-row">
                <Link className="primary-button button-link" to={`/learning/${course.id}`}>
                  Open course
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
};

export default Learning;
