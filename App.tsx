
import React from 'react';
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
  const { user, currentPath } = useApp();

  if (!user) {
    return <Login />;
  }

  let content;
  if (currentPath === '/') {
    content = <Dashboard />;
  } else if (currentPath === '/courses') {
    content = <CourseList />;
  } else if (currentPath.startsWith('/courses/')) {
    content = <CourseDetail />;
  } else if (currentPath.startsWith('/people/')) {
    content = <PersonDetail />;
  } else if (currentPath === '/relationship-map') {
    content = <RelationshipMap />;
  } else if (currentPath === '/write') {
    content = <WriteLog />;
  } else if (currentPath === '/settings') {
    content = <Settings />;
  } else if (currentPath === '/admin-todos') {
    content = <AdminTodo />;
  } else if (currentPath === '/admin-dashboard') {
    content = <AdminDashboard />;
  } else {
    // Fallback
    content = <Dashboard />;
  }

  return (
    <Layout>
      {content}
    </Layout>
  );
};

export default App;
