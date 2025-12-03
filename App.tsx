
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import PersonDetail from './pages/PersonDetail';
import RelationshipMap from './pages/RelationshipMap';
import WriteLog from './pages/WriteLog';
import Settings from './pages/Settings';
import AdminTodo from './pages/AdminTodo';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import { useApp } from './contexts/AppContext';

const App: React.FC = () => {
  const { user } = useApp();

  return (
    <Router>
      {!user ? (
        <Login />
      ) : (
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/people/:id" element={<PersonDetail />} />
            <Route path="/relationship-map" element={<RelationshipMap />} />
            <Route path="/write" element={<WriteLog />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-todos" element={<AdminTodo />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
};

export default App;
