import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Courses from "./pages/Courses";
import CourseDetail from './pages/CourseDetail';
import Learning from './pages/Learning';
import LearningCourse from './pages/LearningCourse';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/Authcontext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate replace to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute><Employees /></ProtectedRoute>
          } />
          <Route path="/employees/:employeeId" element={
            <ProtectedRoute><EmployeeDetail /></ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute><Courses /></ProtectedRoute>
          } />
          <Route path="/courses/:courseId" element={
            <ProtectedRoute><CourseDetail /></ProtectedRoute>
          } />
          <Route path="/learning" element={
            <ProtectedRoute><Learning /></ProtectedRoute>
          } />
          <Route path="/learning/:courseId" element={
            <ProtectedRoute><LearningCourse /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
