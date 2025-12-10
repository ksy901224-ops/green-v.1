
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LogEntry, Department, GolfCourse, UserProfile, UserRole, UserStatus, Person, CareerRecord, ExternalEvent, AffinityLevel, SystemLog, FinancialRecord, MaterialRecord } from '../types';
import { MOCK_LOGS, MOCK_COURSES, MOCK_PEOPLE, MOCK_EXTERNAL_EVENTS, MOCK_FINANCIALS, MOCK_MATERIALS } from '../constants';
import { subscribeToCollection, saveDocument, updateDocument, deleteDocument, seedCollection } from '../services/firestoreService';

interface AppContextType {
  user: UserProfile | null;
  allUsers: UserProfile[];
  login: (email: string) => Promise<string | void>;
  register: (name: string, email: string, department: Department) => Promise<void>;
  logout: () => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserDepartment: (userId: string, department: Department) => void;
  updateUser: (userId: string, data: Partial<UserProfile>) => Promise<void>;
  
  logs: LogEntry[];
  courses: GolfCourse[];
  people: Person[];
  externalEvents: ExternalEvent[];
  systemLogs: SystemLog[];
  financials: FinancialRecord[];
  materials: MaterialRecord[];

  addLog: (log: LogEntry) => void;
  updateLog: (log: LogEntry) => void;
  deleteLog: (id: string) => void;
  addCourse: (course: GolfCourse) => void;
  updateCourse: (course: GolfCourse) => void;
  deleteCourse: (id: string) => void; 
  addPerson: (person: Person) => void;
  updatePerson: (person: Person) => void;
  deletePerson: (id: string) => void;
  addExternalEvent: (event: ExternalEvent) => void;
  
  // New CRUD for Financials & Materials
  addFinancial: (record: FinancialRecord) => void;
  updateFinancial: (record: FinancialRecord) => void;
  deleteFinancial: (id: string) => void;
  addMaterial: (record: MaterialRecord) => void;
  updateMaterial: (record: MaterialRecord) => void;
  deleteMaterial: (id: string) => void;

  refreshLogs: () => void;
  isSimulatedLive: boolean;
  canUseAI: boolean;
  canViewFullData: boolean;
  isAdmin: boolean;
  // Routing
  currentPath: string;
  navigate: (path: string, state?: any) => void;
  routeParams: { id?: string };
  locationState: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Admin for bootstrapping
const DEFAULT_ADMIN: UserProfile = {
  id: 'admin-01',
  name: '김관리 (System)',
  email: 'admin@greenmaster.com',
  role: UserRole.SENIOR, 
  department: Department.MANAGEMENT,
  avatar: 'https://ui-avatars.com/api/?name=Admin+Kim&background=0D9488&color=fff',
  status: 'APPROVED'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Data State (Now driven by Firestore) ---
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [financials, setFinancials] = useState<FinancialRecord[]>([]);
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  
  // Auth state also synced from Firestore 'users' collection
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('greenmaster_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- Routing State ---
  const [currentPath, setCurrentPath] = useState(window.location.hash.slice(1) || '/');
  const [locationState, setLocationState] = useState<any>(null);
  const [routeParams, setRouteParams] = useState<{ id?: string }>({});

  const parsePath = (path: string) => {
    const courseMatch = path.match(/^\/courses\/([^/]+)$/);
    if (courseMatch) return { id: courseMatch[1] };
    const personMatch = path.match(/^\/people\/([^/]+)$/);
    if (personMatch) return { id: personMatch[1] };
    return {};
  };

  const navigate = (path: string, state?: any) => {
    setLocationState(state || null);
    window.location.hash = path;
    setCurrentPath(path);
    setRouteParams(parsePath(path));
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.slice(1) || '/';
      setCurrentPath(path);
      setRouteParams(parsePath(path));
    };
    window.addEventListener('hashchange', handleHashChange);
    // Initial parsing
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // --- Helper to record system activity ---
  const logActivity = (
      actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'APPROVE' | 'REJECT', 
      targetType: 'LOG' | 'COURSE' | 'PERSON' | 'USER' | 'FINANCE' | 'MATERIAL', 
      targetName: string,
      details?: string
  ) => {
      if (!user) return; // Only log authenticated actions
      const newLog: SystemLog = {
          id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: Date.now(),
          userId: user.id,
          userName: user.name,
          actionType,
          targetType,
          targetName,
          details
      };
      saveDocument('system_logs', newLog);
  };

  // --- Firestore Subscriptions ---
  useEffect(() => {
    // 1. Logs
    const unsubLogs = subscribeToCollection('logs', (data) => {
      if (data.length === 0) { seedCollection('logs', MOCK_LOGS); } 
      else { setLogs(data as LogEntry[]); }
    });

    // 2. Courses
    const unsubCourses = subscribeToCollection('courses', (data) => {
      if (data.length === 0) { seedCollection('courses', MOCK_COURSES); } 
      else { setCourses(data as GolfCourse[]); }
    });

    // 3. People
    const unsubPeople = subscribeToCollection('people', (data) => {
      if (data.length === 0) { seedCollection('people', MOCK_PEOPLE); } 
      else { setPeople(data as Person[]); }
    });

    // 4. Events
    const unsubEvents = subscribeToCollection('external_events', (data) => {
      if (data.length === 0) { seedCollection('external_events', MOCK_EXTERNAL_EVENTS); } 
      else { setExternalEvents(data as ExternalEvent[]); }
    });

    // 5. Users
    const unsubUsers = subscribeToCollection('users', (data) => {
      if (data.length === 0) { seedCollection('users', [DEFAULT_ADMIN]); } 
      else { 
        const fetchedUsers = data as UserProfile[];
        setAllUsers(fetchedUsers);
        // Real-time update of current user permission
        if (user) {
            const updatedSelf = fetchedUsers.find(u => u.id === user.id);
            if (updatedSelf && JSON.stringify(updatedSelf) !== JSON.stringify(user)) {
                setUser(updatedSelf);
                localStorage.setItem('greenmaster_user', JSON.stringify(updatedSelf));
            }
        }
      }
    });

    // 6. System Logs (New)
    const unsubSystem = subscribeToCollection('system_logs', (data) => {
        // Sort client-side if needed, but Firestore queries usually handle it
        const sorted = (data as SystemLog[]).sort((a, b) => b.timestamp - a.timestamp);
        setSystemLogs(sorted);
    });

    // 7. Financials (New)
    const unsubFin = subscribeToCollection('financials', (data) => {
      if (data.length === 0) { seedCollection('financials', MOCK_FINANCIALS); }
      else { setFinancials(data as FinancialRecord[]); }
    });

    // 8. Materials (New)
    const unsubMat = subscribeToCollection('materials', (data) => {
      if (data.length === 0) { seedCollection('materials', MOCK_MATERIALS); }
      else { setMaterials(data as MaterialRecord[]); }
    });

    return () => {
      unsubLogs(); unsubCourses(); unsubPeople(); unsubEvents(); unsubUsers(); unsubSystem(); unsubFin(); unsubMat();
    };
  }, [user?.id]); // Depend on user.id to ensure self-update logic works

  // --- Auth Actions ---
  const login = async (email: string): Promise<string | void> => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (!foundUser) return '등록된 이메일이 아닙니다. 회원가입을 진행해주세요.';
    if (foundUser.status === 'PENDING') return '현재 관리자 승인 대기 중입니다.';
    if (foundUser.status === 'REJECTED') return '가입 요청이 거절되었거나 계정이 차단되었습니다.';

    setUser(foundUser);
    localStorage.setItem('greenmaster_user', JSON.stringify(foundUser));
    
    // Log Login Activity (Self-logged via firestore since user state updates slightly later, we pass manual info)
    const loginLog: SystemLog = {
        id: `sys-${Date.now()}`, timestamp: Date.now(), userId: foundUser.id, userName: foundUser.name,
        actionType: 'LOGIN', targetType: 'USER', targetName: 'System Login'
    };
    saveDocument('system_logs', loginLog);
  };

  const register = async (name: string, email: string, department: Department) => {
    if (allUsers.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new Error('이미 등록된 이메일입니다. 로그인해주세요.');
    }
    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name, email: email.trim(), role: UserRole.INTERMEDIATE, department,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      status: 'PENDING'
    };
    await saveDocument('users', newUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('greenmaster_user');
    navigate('/');
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    await updateDocument('users', userId, { status });
    const target = allUsers.find(u => u.id === userId);
    logActivity(status === 'APPROVED' ? 'APPROVE' : 'REJECT', 'USER', target?.name || 'Unknown User', `Status changed to ${status}`);
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    await updateDocument('users', userId, { role });
    const target = allUsers.find(u => u.id === userId);
    logActivity('UPDATE', 'USER', target?.name || 'Unknown User', `Role updated to ${role}`);
  };

  const updateUserDepartment = async (userId: string, department: Department) => {
    await updateDocument('users', userId, { department });
  };

  const updateUser = async (userId: string, data: Partial<UserProfile>) => {
    await updateDocument('users', userId, data);
    logActivity('UPDATE', 'USER', 'Profile', 'User updated own profile');
  };

  // --- CRUD Actions with Logging ---
  const addLog = (log: LogEntry) => {
      saveDocument('logs', log);
      logActivity('CREATE', 'LOG', log.title, `${log.courseName} - ${log.department}`);
  };
  const updateLog = (log: LogEntry) => {
      updateDocument('logs', log.id, log);
      logActivity('UPDATE', 'LOG', log.title);
  };
  const deleteLog = (id: string) => {
      const target = logs.find(l => l.id === id);
      deleteDocument('logs', id);
      logActivity('DELETE', 'LOG', target?.title || 'Unknown Log');
  };

  const addCourse = (course: GolfCourse) => {
      saveDocument('courses', course);
      logActivity('CREATE', 'COURSE', course.name);
  };
  const updateCourse = (course: GolfCourse) => {
      updateDocument('courses', course.id, course);
      logActivity('UPDATE', 'COURSE', course.name);
  };
  const deleteCourse = (id: string) => {
      const target = courses.find(c => c.id === id);
      deleteDocument('courses', id);
      logActivity('DELETE', 'COURSE', target?.name || 'Unknown Course');
  };

  const addPerson = async (newPerson: Person) => {
    const normalize = (s: string) => s.trim().replace(/\s+/g, '').toLowerCase();
    const existing = people.find(p => normalize(p.name) === normalize(newPerson.name));

    if (existing) {
        await updateDocument('people', existing.id, { ...existing }); 
        logActivity('UPDATE', 'PERSON', existing.name, 'Merged duplicate entry');
    } else {
        await saveDocument('people', newPerson);
        logActivity('CREATE', 'PERSON', newPerson.name);
    }
  };

  const updatePerson = (person: Person) => {
      updateDocument('people', person.id, person);
      logActivity('UPDATE', 'PERSON', person.name);
  };
  const deletePerson = (id: string) => {
      const target = people.find(p => p.id === id);
      deleteDocument('people', id);
      logActivity('DELETE', 'PERSON', target?.name || 'Unknown Person');
  };

  const addExternalEvent = (event: ExternalEvent) => saveDocument('external_events', event);
  
  // --- New CRUD ---
  const addFinancial = (record: FinancialRecord) => {
    saveDocument('financials', record);
    logActivity('CREATE', 'FINANCE', `${record.year} 매출`, `Course ID: ${record.courseId}`);
  };
  const updateFinancial = (record: FinancialRecord) => {
    updateDocument('financials', record.id, record);
    logActivity('UPDATE', 'FINANCE', `${record.year} 매출`);
  };
  const deleteFinancial = (id: string) => {
    deleteDocument('financials', id);
    logActivity('DELETE', 'FINANCE', '매출 기록');
  };

  const addMaterial = (record: MaterialRecord) => {
    saveDocument('materials', record);
    logActivity('CREATE', 'MATERIAL', record.name, `${record.category} - ${record.quantity}${record.unit}`);
  };
  const updateMaterial = (record: MaterialRecord) => {
    updateDocument('materials', record.id, record);
    logActivity('UPDATE', 'MATERIAL', record.name);
  };
  const deleteMaterial = (id: string) => {
    const target = materials.find(m => m.id === id);
    deleteDocument('materials', id);
    logActivity('DELETE', 'MATERIAL', target?.name || '자재');
  };

  const refreshLogs = () => {}; 

  const isSimulatedLive = true;
  const canUseAI = user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN;
  const canViewFullData = user?.role === UserRole.SENIOR || user?.role === UserRole.INTERMEDIATE || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN;

  const value = {
    user, allUsers, login, register, logout, updateUserStatus, updateUserRole, updateUserDepartment, updateUser,
    logs, courses, people, externalEvents, systemLogs, financials, materials,
    addLog, updateLog, deleteLog,
    addCourse, updateCourse, deleteCourse,
    addPerson, updatePerson, deletePerson,
    addExternalEvent,
    addFinancial, updateFinancial, deleteFinancial,
    addMaterial, updateMaterial, deleteMaterial,
    refreshLogs, isSimulatedLive,
    canUseAI, canViewFullData, isAdmin,
    currentPath, navigate, routeParams, locationState
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
