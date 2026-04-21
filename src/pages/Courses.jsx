import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import api from "../services/api";
import Navbar from "../components/Navbar";
import { isAdminUser } from '../utils/auth';

const emptyCourseForm = {
  title: '',
  description: '',
  role_target: '',
  validity_months: '',
  pass_score: '',
  status: 'draft',
};

const Courses = () => {
  const isAdmin = isAdminUser();
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [error, setError] = useState('');

  const loadCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load courses.');
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const resetForm = () => {
    setCourseForm(emptyCourseForm);
    setEditingCourseId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      title: courseForm.title,
      description: courseForm.description,
      role_target: courseForm.role_target,
      validity_months: Number(courseForm.validity_months),
      pass_score: Number(courseForm.pass_score),
      status: courseForm.status,
    };

    try {
      if (editingCourseId) {
        await api.put(`/courses/${editingCourseId}`, payload);
      } else {
        await api.post('/courses', payload);
      }

      resetForm();
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save course.');
    }
  };

  const startEditing = (course) => {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      role_target: course.role_target || '',
      validity_months: String(course.validity_months ?? ''),
      pass_score: String(course.pass_score ?? ''),
      status: course.status || 'draft',
    });
  };

  const deleteCourse = async (courseId) => {
    const confirmed = window.confirm('Delete this course?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await api.delete(`/courses/${courseId}`);
      if (editingCourseId === courseId) {
        resetForm();
      }
      await loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete course.');
    }
  };

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <h1>Courses</h1>
            <p className="page-subtitle">
              {isAdmin
                ? 'Manage course records and open each course to build modules and lessons.'
                : 'Browse company courses and open them in the learning player.'}
            </p>
          </div>
        </div>

        {error && <div className="notice notice-error">{error}</div>}

        {isAdmin && (
        <section className="card">
          <div className="section-title-row">
            <div>
              <h2>{editingCourseId ? 'Edit course' : 'Create course'}</h2>
              <p>This maps directly to the backend course endpoints.</p>
            </div>
          </div>

          <form className="grid-form" onSubmit={handleSubmit}>
            <label>
              Title
              <input
                required
                value={courseForm.title}
                onChange={(event) => setCourseForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))}
              />
            </label>

            <label>
              Role target
              <input
                required
                value={courseForm.role_target}
                onChange={(event) => setCourseForm((current) => ({
                  ...current,
                  role_target: event.target.value,
                }))}
              />
            </label>

            <label>
              Validity months
              <input
                min="1"
                required
                type="number"
                value={courseForm.validity_months}
                onChange={(event) => setCourseForm((current) => ({
                  ...current,
                  validity_months: event.target.value,
                }))}
              />
            </label>

            <label>
              Pass score
              <input
                min="0"
                max="100"
                required
                type="number"
                value={courseForm.pass_score}
                onChange={(event) => setCourseForm((current) => ({
                  ...current,
                  pass_score: event.target.value,
                }))}
              />
            </label>

            <label className="full-width">
              Description
              <textarea
                rows="3"
                value={courseForm.description}
                onChange={(event) => setCourseForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))}
              />
            </label>

            <label>
              Status
              <select
                value={courseForm.status}
                onChange={(event) => setCourseForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <div className="action-row full-width">
              <button className="primary-button" type="submit">
                {editingCourseId ? 'Update course' : 'Create course'}
              </button>

              {editingCourseId && (
                <button
                  className="secondary-button"
                  onClick={resetForm}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
        )}

        <section className="stack-layout">
          {courses.length === 0 && (
            <div className="notice">No courses found yet.</div>
          )}

          {courses.map((course) => (
            <article className="card" key={course.id}>
              <div className="card-heading">
                <div>
                  <h2>{course.title}</h2>
                  <p>{course.description || 'No description provided.'}</p>
                </div>

                <span className="status-pill">{course.status || 'draft'}</span>
              </div>

              <div className="meta-grid">
                <span>Role target: {course.role_target || 'Not set'}</span>
                <span>Validity: {course.validity_months || 0} months</span>
                <span>Pass score: {course.pass_score || 0}%</span>
              </div>

              <div className="action-row">
                {isAdmin ? (
                  <>
                    <Link className="primary-button button-link" to={`/courses/${course.id}`}>
                      Manage modules
                    </Link>
                    <button
                      className="secondary-button"
                      onClick={() => startEditing(course)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => deleteCourse(course.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <Link className="primary-button button-link" to={`/learning/${course.id}`}>
                    Open in learning
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
};

export default Courses;
