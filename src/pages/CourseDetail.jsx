import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const emptyModuleForm = {
  title: '',
  description: '',
  order_index: '',
};

const emptyLessonForm = {
  title: '',
  content_type: '',
  content_url: '',
  duration_minutes: '',
  order_index: '',
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessonsByModule, setLessonsByModule] = useState({});
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [lessonForms, setLessonForms] = useState({});
  const [editingLessonIds, setEditingLessonIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [courseResponse, modulesResponse] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/modules/course/${courseId}`),
      ]);

      const loadedModules = modulesResponse.data;

      setCourse(courseResponse.data);
      setModules(loadedModules);

      const lessonEntries = await Promise.all(
        loadedModules.map(async (module) => {
          const response = await api.get(`/lessons/module/${module.id}`);
          return [module.id, response.data];
        })
      );

      setLessonsByModule(Object.fromEntries(lessonEntries));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load course details.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const resetModuleForm = () => {
    setModuleForm(emptyModuleForm);
    setEditingModuleId(null);
  };

  const handleModuleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const payload = {
      course_id: Number(courseId),
      title: moduleForm.title,
      description: moduleForm.description,
      order_index: Number(moduleForm.order_index),
    };

    try {
      if (editingModuleId) {
        await api.put(`/modules/${editingModuleId}`, payload);
      } else {
        await api.post('/modules', payload);
      }

      resetModuleForm();
      await loadCourse();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save module.');
    }
  };

  const startEditingModule = (module) => {
    setEditingModuleId(module.id);
    setModuleForm({
      title: module.title || '',
      description: module.description || '',
      order_index: String(module.order_index ?? ''),
    });
  };

  const deleteModule = async (moduleId) => {
    const confirmed = window.confirm('Delete this module and its lessons?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await api.delete(`/modules/${moduleId}`);
      if (editingModuleId === moduleId) {
        resetModuleForm();
      }
      await loadCourse();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete module.');
    }
  };

  const setLessonFormValue = (moduleId, updater) => {
    setLessonForms((current) => ({
      ...current,
      [moduleId]: updater(current[moduleId] || emptyLessonForm),
    }));
  };

  const resetLessonForm = (moduleId) => {
    setLessonForms((current) => ({
      ...current,
      [moduleId]: emptyLessonForm,
    }));

    setEditingLessonIds((current) => ({
      ...current,
      [moduleId]: null,
    }));
  };

  const handleLessonSubmit = async (event, moduleId) => {
    event.preventDefault();
    setError('');

    const form = lessonForms[moduleId] || emptyLessonForm;
    const payload = {
      module_id: moduleId,
      title: form.title,
      content_type: form.content_type,
      content_url: form.content_url,
      duration_minutes: Number(form.duration_minutes),
      order_index: Number(form.order_index),
    };

    try {
      const editingLessonId = editingLessonIds[moduleId];

      if (editingLessonId) {
        await api.put(`/lessons/${editingLessonId}`, payload);
      } else {
        await api.post('/lessons', payload);
      }

      resetLessonForm(moduleId);
      await loadCourse();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save lesson.');
    }
  };

  const startEditingLesson = (moduleId, lesson) => {
    setLessonForms((current) => ({
      ...current,
      [moduleId]: {
        title: lesson.title || '',
        content_type: lesson.content_type || '',
        content_url: lesson.content_url || '',
        duration_minutes: String(lesson.duration_minutes ?? ''),
        order_index: String(lesson.order_index ?? ''),
      },
    }));

    setEditingLessonIds((current) => ({
      ...current,
      [moduleId]: lesson.id,
    }));
  };

  const deleteLesson = async (moduleId, lessonId) => {
    const confirmed = window.confirm('Delete this lesson?');
    if (!confirmed) {
      return;
    }

    setError('');

    try {
      await api.delete(`/lessons/${lessonId}`);
      if (editingLessonIds[moduleId] === lessonId) {
        resetLessonForm(moduleId);
      }
      await loadCourse();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete lesson.');
    }
  };

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <Link className="back-link" to="/courses">
              Back to courses
            </Link>
            <h1>{course?.title || 'Course details'}</h1>
            <p className="page-subtitle">
              Build the module and lesson structure for this course.
            </p>
          </div>
        </div>

        {error && <div className="notice notice-error">{error}</div>}
        {loading && <div className="notice">Loading course content...</div>}

        {!loading && course && (
          <>
            <section className="card">
              <div className="card-heading">
                <div>
                  <h2>Course overview</h2>
                  <p>{course.description || 'No description added yet.'}</p>
                </div>
                <div className="meta-grid">
                  <span>Status: {course.status || 'draft'}</span>
                  <span>Role target: {course.role_target || 'Not set'}</span>
                  <span>Validity: {course.validity_months || 0} months</span>
                  <span>Pass score: {course.pass_score || 0}%</span>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="section-title-row">
                <div>
                  <h2>{editingModuleId ? 'Edit module' : 'Add module'}</h2>
                  <p>Create the chapters inside this course.</p>
                </div>
              </div>

              <form className="grid-form" onSubmit={handleModuleSubmit}>
                <label>
                  Module title
                  <input
                    required
                    value={moduleForm.title}
                    onChange={(event) => setModuleForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))}
                  />
                </label>

                <label>
                  Order
                  <input
                    min="1"
                    required
                    type="number"
                    value={moduleForm.order_index}
                    onChange={(event) => setModuleForm((current) => ({
                      ...current,
                      order_index: event.target.value,
                    }))}
                  />
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    rows="3"
                    value={moduleForm.description}
                    onChange={(event) => setModuleForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))}
                  />
                </label>

                <div className="action-row full-width">
                  <button className="primary-button" type="submit">
                    {editingModuleId ? 'Update module' : 'Create module'}
                  </button>

                  {editingModuleId && (
                    <button
                      className="secondary-button"
                      onClick={resetModuleForm}
                      type="button"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            <section className="stack-layout">
              {modules.length === 0 && (
                <div className="notice">No modules yet. Add the first one above.</div>
              )}

              {modules.map((module) => {
                const moduleLessons = lessonsByModule[module.id] || [];
                const lessonForm = lessonForms[module.id] || emptyLessonForm;
                const editingLessonId = editingLessonIds[module.id];

                return (
                  <article className="card" key={module.id}>
                    <div className="card-heading">
                      <div>
                        <h2>
                          {module.order_index}. {module.title}
                        </h2>
                        <p>{module.description || 'No module description yet.'}</p>
                      </div>

                      <div className="action-row">
                        <button
                          className="secondary-button"
                          onClick={() => startEditingModule(module)}
                          type="button"
                        >
                          Edit module
                        </button>
                        <button
                          className="danger-button"
                          onClick={() => deleteModule(module.id)}
                          type="button"
                        >
                          Delete module
                        </button>
                      </div>
                    </div>

                    <div className="lesson-list">
                      {moduleLessons.length === 0 && (
                        <div className="notice">No lessons in this module yet.</div>
                      )}

                      {moduleLessons.map((lesson) => (
                        <div className="lesson-row" key={lesson.id}>
                          <div>
                            <strong>
                              {lesson.order_index}. {lesson.title}
                            </strong>
                            <p>
                              {lesson.content_type || 'content'} • {lesson.duration_minutes || 0} mins
                            </p>
                            <a href={lesson.content_url} rel="noreferrer" target="_blank">
                              {lesson.content_url}
                            </a>
                          </div>

                          <div className="action-row">
                            <button
                              className="secondary-button"
                              onClick={() => startEditingLesson(module.id, lesson)}
                              type="button"
                            >
                              Edit lesson
                            </button>
                            <button
                              className="danger-button"
                              onClick={() => deleteLesson(module.id, lesson.id)}
                              type="button"
                            >
                              Delete lesson
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      className="grid-form lesson-form"
                      onSubmit={(event) => handleLessonSubmit(event, module.id)}
                    >
                      <div className="section-title-row">
                        <div>
                          <h3>{editingLessonId ? 'Edit lesson' : 'Add lesson'}</h3>
                          <p>Lessons are fetched from the backend by module.</p>
                        </div>
                      </div>

                      <label>
                        Lesson title
                        <input
                          required
                          value={lessonForm.title}
                          onChange={(event) => setLessonFormValue(module.id, (current) => ({
                            ...current,
                            title: event.target.value,
                          }))}
                        />
                      </label>

                      <label>
                        Content type
                        <input
                          placeholder="video, pdf, quiz"
                          required
                          value={lessonForm.content_type}
                          onChange={(event) => setLessonFormValue(module.id, (current) => ({
                            ...current,
                            content_type: event.target.value,
                          }))}
                        />
                      </label>

                      <label>
                        Duration (mins)
                        <input
                          min="1"
                          required
                          type="number"
                          value={lessonForm.duration_minutes}
                          onChange={(event) => setLessonFormValue(module.id, (current) => ({
                            ...current,
                            duration_minutes: event.target.value,
                          }))}
                        />
                      </label>

                      <label>
                        Order
                        <input
                          min="1"
                          required
                          type="number"
                          value={lessonForm.order_index}
                          onChange={(event) => setLessonFormValue(module.id, (current) => ({
                            ...current,
                            order_index: event.target.value,
                          }))}
                        />
                      </label>

                      <label className="full-width">
                        Content URL
                        <input
                          required
                          value={lessonForm.content_url}
                          onChange={(event) => setLessonFormValue(module.id, (current) => ({
                            ...current,
                            content_url: event.target.value,
                          }))}
                        />
                      </label>

                      <div className="action-row full-width">
                        <button className="primary-button" type="submit">
                          {editingLessonId ? 'Update lesson' : 'Create lesson'}
                        </button>

                        {editingLessonId && (
                          <button
                            className="secondary-button"
                            onClick={() => resetLessonForm(module.id)}
                            type="button"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
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

export default CourseDetail;
