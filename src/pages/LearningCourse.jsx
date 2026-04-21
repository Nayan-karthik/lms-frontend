import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const LearningCourse = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [progressByModule, setProgressByModule] = useState({});
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [certificateState, setCertificateState] = useState({
    loading: false,
    error: '',
    available: false,
  });
  const [completionState, setCompletionState] = useState({
    loading: false,
    message: '',
  });
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

      setCourse(courseResponse.data);
      setModules(modulesResponse.data);

      const progressEntries = await Promise.all(
        modulesResponse.data.map(async (module) => {
          const [progressResponse, lessonsResponse] = await Promise.all([
            api.get(`/progress/module/${module.id}`),
            api.get(`/lessons/module/${module.id}`),
          ]);

          const lessonsById = Object.fromEntries(
            lessonsResponse.data.map((lesson) => [lesson.id, lesson])
          );

          const mergedLessons = progressResponse.data.map((lesson) => ({
            ...lessonsById[lesson.id],
            ...lesson,
          }));

          return [module.id, mergedLessons];
        })
      );

      const nextProgress = Object.fromEntries(progressEntries);
      setProgressByModule(nextProgress);

      const flatLessons = progressEntries.flatMap(([, lessons]) => lessons);
      const nextLesson = flatLessons.find((lesson) => !lesson.completed) || flatLessons[0] || null;
      setActiveLessonId(nextLesson?.id || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load learning content.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const checkCertificate = useCallback(async () => {
    setCertificateState({
      loading: true,
      error: '',
      available: false,
    });

    try {
      await api.get(`/certificates/${courseId}`, { responseType: 'blob' });
      setCertificateState({
        loading: false,
        error: '',
        available: true,
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setCertificateState({
          loading: false,
          error: '',
          available: false,
        });
        return;
      }

      setCertificateState({
        loading: false,
        error: 'Could not check certificate status.',
        available: false,
      });
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    checkCertificate();
  }, [checkCertificate]);

  const allLessons = modules.flatMap((module) => progressByModule[module.id] || []);
  const completedLessons = allLessons.filter((lesson) => lesson.completed).length;
  const completionPercent = allLessons.length === 0
    ? 0
    : Math.round((completedLessons / allLessons.length) * 100);
  const activeLesson = allLessons.find((lesson) => lesson.id === activeLessonId) || null;
  const nextIncompleteLesson = allLessons.find(
    (lesson) => !lesson.completed && lesson.id !== activeLessonId
  ) || null;

  const markComplete = async (lessonId) => {
    setError('');
    setCompletionState({
      loading: true,
      message: '',
    });

    try {
      await api.post('/progress/complete', { lesson_id: lessonId });
      await loadCourse();
      await checkCertificate();
      setCompletionState({
        loading: false,
        message: 'Lesson marked complete.',
      });
    } catch (err) {
      setCompletionState({
        loading: false,
        message: '',
      });
      setError(err.response?.data?.error || 'Failed to mark lesson complete.');
    }
  };

  const downloadCertificate = async () => {
    setCertificateState((current) => ({
      ...current,
      loading: true,
      error: '',
    }));

    try {
      const response = await api.get(`/certificates/${courseId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${course?.title || 'certificate'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setCertificateState({
        loading: false,
        error: '',
        available: true,
      });
    } catch (err) {
      setCertificateState({
        loading: false,
        error: err.response?.data?.error || 'Certificate is not available yet.',
        available: false,
      });
    }
  };

  return (
    <>
      <Navbar />

      <main className="page-shell">
        <div className="page-header">
          <div>
            <Link className="back-link" to="/learning">
              Back to learning
            </Link>
            <h1>{course?.title || 'Course player'}</h1>
            <p className="page-subtitle">
              Work through lessons in order and mark each one complete when finished.
            </p>
          </div>

          <div className="progress-summary">
            <strong>{completionPercent}% complete</strong>
            <span>{completedLessons} of {allLessons.length} lessons done</span>
          </div>
        </div>

        {error && <div className="notice notice-error">{error}</div>}
        {loading && <div className="notice">Loading course player...</div>}

        {!loading && (
          <>
            <section className="card">
              <div className="course-progress-bar">
                <div style={{ width: `${completionPercent}%` }} />
              </div>

              <div className="action-row">
                <span className="status-pill">
                  {certificateState.available ? 'Certificate ready' : 'Certificate locked'}
                </span>
                <button
                  className="primary-button"
                  disabled={!certificateState.available || certificateState.loading}
                  onClick={downloadCertificate}
                  type="button"
                >
                  {certificateState.loading ? 'Preparing...' : 'Download certificate'}
                </button>
              </div>

              {certificateState.error && (
                <div className="notice notice-error inline-notice">{certificateState.error}</div>
              )}

              {completionState.message && (
                <div className="notice inline-notice">{completionState.message}</div>
              )}
            </section>

            <section className="learning-layout">
              <aside className="card learning-sidebar">
                <h2>Lessons</h2>

                <div className="module-stack">
                  {modules.map((module) => {
                    const moduleLessons = progressByModule[module.id] || [];
                    const doneCount = moduleLessons.filter((lesson) => lesson.completed).length;
                    const modulePercent = moduleLessons.length === 0
                      ? 0
                      : Math.round((doneCount / moduleLessons.length) * 100);

                    return (
                      <div className="module-block" key={module.id}>
                        <div className="module-block-header">
                          <div>
                            <strong>{module.order_index}. {module.title}</strong>
                            <div className="module-progress-copy">
                              <span>{doneCount}/{moduleLessons.length} done</span>
                              <span>{modulePercent}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="mini-progress-bar">
                          <div style={{ width: `${modulePercent}%` }} />
                        </div>

                        <div className="lesson-pill-list">
                          {moduleLessons.map((lesson) => (
                            <button
                              className={`lesson-pill ${lesson.id === activeLessonId ? 'lesson-pill-active' : ''}`}
                              key={lesson.id}
                              onClick={() => setActiveLessonId(lesson.id)}
                              type="button"
                            >
                              <span>{lesson.title}</span>
                              <small>{lesson.completed ? 'Completed' : 'Pending'}</small>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </aside>

              <section className="card lesson-player">
                {activeLesson ? (
                  <>
                    <div className="section-title-row">
                      <div>
                        <h2>{activeLesson.title}</h2>
                        <p>
                          {activeLesson.completed
                            ? 'This lesson is already completed.'
                            : 'Open the lesson material below, then mark it complete when you finish.'}
                        </p>
                      </div>

                      <span className={`status-pill ${activeLesson.completed ? 'status-pill-success' : ''}`}>
                        {activeLesson.completed ? 'Completed' : 'In progress'}
                      </span>
                    </div>

                    {activeLesson.content_url && (
                      <a
                        className="primary-button button-link"
                        href={activeLesson.content_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open lesson material
                      </a>
                    )}

                    <div className="lesson-actions-panel">
                      {nextIncompleteLesson && (
                        <button
                          className="secondary-button"
                          onClick={() => setActiveLessonId(nextIncompleteLesson.id)}
                          type="button"
                        >
                          {activeLesson.completed ? 'Open next lesson' : 'Skip to next pending'}
                        </button>
                      )}

                      <button
                        className="primary-button"
                        disabled={activeLesson.completed || completionState.loading}
                        onClick={() => markComplete(activeLesson.id)}
                        type="button"
                      >
                        {activeLesson.completed
                          ? 'Already completed'
                          : completionState.loading
                            ? 'Saving progress...'
                            : 'Mark lesson complete'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="notice">No lessons are available in this course yet.</div>
                )}
              </section>
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default LearningCourse;
