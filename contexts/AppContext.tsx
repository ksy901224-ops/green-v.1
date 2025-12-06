
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LogEntry, Department, GolfCourse, UserProfile, UserRole, UserStatus, Person, CareerRecord, ExternalEvent, AffinityLevel } from '../types';
import { MOCK_LOGS, MOCK_COURSES, MOCK_PEOPLE, MOCK_EXTERNAL_EVENTS } from '../constants';

interface AppContextType {
  user: UserProfile | null;
  allUsers: UserProfile[];
  login: (email: string) => Promise<string | void>;
  register: (name: string, email: string, department: Department) => Promise<void>;
  logout: () => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  logs: LogEntry[];
  courses: GolfCourse[];
  people: Person[];
  externalEvents: ExternalEvent[];
  addLog: (log: LogEntry) => void;
  updateLog: (log: LogEntry) => void;
  deleteLog: (id: string) => void;
  addCourse: (course: GolfCourse) => void;
  updateCourse: (course: GolfCourse) => void;
  deleteCourse: (id: string) => void; 
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  addExternalEvent: (event: ExternalEvent) => void;
  refreshLogs: () => void;
  isSimulatedLive: boolean;
  // Permission Helpers
  canUseAI: boolean;
  canViewFullData: boolean;
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Admin for bootstrapping
const DEFAULT_ADMIN: UserProfile = {
  id: 'admin-01',
  name: '김관리 (System)',
  email: 'admin@greenmaster.com',
  role: UserRole.SENIOR, // Default to Senior/Admin
  department: Department.MANAGEMENT,
  avatar: 'https://ui-avatars.com/api/?name=Admin+Kim&background=0D9488&color=fff',
  status: 'APPROVED'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Authentication State ---
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('greenmaster_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const savedAllUsers = localStorage.getItem('greenmaster_all_users');
    return savedAllUsers ? JSON.parse(savedAllUsers) : [DEFAULT_ADMIN];
  });

  useEffect(() => {
    localStorage.setItem('greenmaster_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  const login = async (email: string): Promise<string | void> => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!foundUser) return '등록된 이메일이 아닙니다. 회원가입을 진행해주세요.';
    if (foundUser.status === 'PENDING') return '계정이 승인 대기 중입니다. 관리자 승인 후 로그인 가능합니다.';
    if (foundUser.status === 'REJECTED') return '승인이 거절된 계정입니다. 관리자에게 문의하세요.';

    setUser(foundUser);
    localStorage.setItem('greenmaster_user', JSON.stringify(foundUser));
  };

  const register = async (name: string, email: string, department: Department) => {
    if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('이미 등록된 이메일입니다.');
    }
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: UserRole.INTERMEDIATE, // Default to Intermediate
      department,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      status: 'PENDING'
    };
    setAllUsers(prev => [...prev, newUser]);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('greenmaster_user');
  };

  const updateUserStatus = (userId: string, status: UserStatus) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (user && user.id === userId) {
        const updatedSelf = { ...user, role };
        setUser(updatedSelf);
        localStorage.setItem('greenmaster_user', JSON.stringify(updatedSelf));
    }
  };

  // --- Data State ---
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const savedLogs = localStorage.getItem('greenmaster_logs');
    return savedLogs ? JSON.parse(savedLogs) : MOCK_LOGS;
  });

  const [courses, setCourses] = useState<GolfCourse[]>(() => {
    const savedCourses = localStorage.getItem('greenmaster_courses');
    return savedCourses ? JSON.parse(savedCourses) : MOCK_COURSES;
  });

  const [people, setPeople] = useState<Person[]>(() => {
    const savedPeople = localStorage.getItem('greenmaster_people');
    return savedPeople ? JSON.parse(savedPeople) : MOCK_PEOPLE;
  });

  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>(() => {
    const savedEvents = localStorage.getItem('greenmaster_events');
    return savedEvents ? JSON.parse(savedEvents) : MOCK_EXTERNAL_EVENTS;
  });
  
  const [isSimulatedLive] = useState(true);

  useEffect(() => { localStorage.setItem('greenmaster_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('greenmaster_courses', JSON.stringify(courses)); }, [courses]);
  useEffect(() => { localStorage.setItem('greenmaster_people', JSON.stringify(people)); }, [people]);
  useEffect(() => { localStorage.setItem('greenmaster_events', JSON.stringify(externalEvents)); }, [externalEvents]);

  const addLog = (log: LogEntry) => setLogs(prev => [log, ...prev]);
  const updateLog = (updatedLog: LogEntry) => setLogs(prev => prev.map(log => log.id === updatedLog.id ? updatedLog : log));
  const deleteLog = (id: string) => setLogs(prev => prev.filter(log => log.id !== id));

  const addCourse = (course: GolfCourse) => setCourses(prev => [...prev, course]);
  const updateCourse = (updatedCourse: GolfCourse) => setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  const deleteCourse = (id: string) => setCourses(prev => prev.filter(c => c.id !== id));

  // --- Smart Person Management with Deduplication ---
  const addPerson = (newPerson: Person) => {
    setPeople(prevPeople => {
      const normalize = (s: string) => s.trim().replace(/\s+/g, '').toLowerCase();
      const existingIndex = prevPeople.findIndex(p => normalize(p.name) === normalize(newPerson.name));

      if (existingIndex !== -1) {
        const existingPerson = prevPeople[existingIndex];
        
        let updatedCareers = [...existingPerson.careers];
        const isRoleChanged = newPerson.currentCourseId && (newPerson.currentCourseId !== existingPerson.currentCourseId);
        
        if (isRoleChanged && existingPerson.currentCourseId) {
             const oldCourse = courses.find(c => c.id === existingPerson.currentCourseId);
             updatedCareers.push({
                 courseId: existingPerson.currentCourseId,
                 courseName: oldCourse?.name || 'Unknown Course',
                 role: existingPerson.currentRole,
                 startDate: existingPerson.currentRoleStartDate || '',
                 endDate: new Date().toISOString().split('T')[0],
                 description: 'Auto-archived upon merge with new data'
             });
        }

        const merged: Person = {
            ...existingPerson,
            phone: newPerson.phone || existingPerson.phone,
            currentRole: newPerson.currentRole || existingPerson.currentRole,
            currentCourseId: newPerson.currentCourseId || existingPerson.currentCourseId,
            currentRoleStartDate: newPerson.currentRoleStartDate || existingPerson.currentRoleStartDate,
            affinity: newPerson.affinity !== 0 ? newPerson.affinity : existingPerson.affinity,
            notes: existingPerson.notes + (newPerson.notes ? `\n\n[Merged Info]: ${newPerson.notes}` : ''),
            careers: updatedCareers
        };

        const newPeopleList = [...prevPeople];
        newPeopleList[existingIndex] = merged;
        return newPeopleList;
      }
      return [...prevPeople, newPerson];
    });
  };

  const updatePerson = (updatedPerson: Person) => {
    setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
  };

  const addExternalEvent = (event: ExternalEvent) => setExternalEvents(prev => [...prev, event]);
  const refreshLogs = () => {};

  // --- Permission Logic ---
  const canUseAI = user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN;
  // Intermediate can view full data, but not use AI. Junior cannot view sensitive data (logs/people).
  const canViewFullData = user?.role === UserRole.SENIOR || user?.role === UserRole.INTERMEDIATE || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN;

  const value = {
    user, allUsers, login, register, logout, updateUserStatus, updateUserRole,
    logs, courses, people, externalEvents,
    addLog, updateLog, deleteLog,
    addCourse, updateCourse, deleteCourse,
    addPerson, updatePerson,
    addExternalEvent, refreshLogs, isSimulatedLive,
    canUseAI, canViewFullData, isAdmin
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};