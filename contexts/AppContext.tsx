
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LogEntry, Department, GolfCourse, UserProfile, UserRole, UserStatus, Person, CareerRecord, ExternalEvent, AffinityLevel } from '../types';
import { MOCK_LOGS, MOCK_COURSES, MOCK_PEOPLE, MOCK_EXTERNAL_EVENTS } from '../constants';
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
  
  // Auth state also synced from Firestore 'users' collection
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('greenmaster_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- Firestore Subscriptions ---
  useEffect(() => {
    // 1. Logs
    const unsubLogs = subscribeToCollection('logs', (data) => {
      if (data.length === 0) { 
        // Auto-seed if empty to match "screen I see now"
        seedCollection('logs', MOCK_LOGS); 
      } else { 
        setLogs(data as LogEntry[]); 
      }
    });

    // 2. Courses
    const unsubCourses = subscribeToCollection('courses', (data) => {
      if (data.length === 0) { 
        seedCollection('courses', MOCK_COURSES); 
      } else { 
        setCourses(data as GolfCourse[]); 
      }
    });

    // 3. People
    const unsubPeople = subscribeToCollection('people', (data) => {
      if (data.length === 0) { 
        seedCollection('people', MOCK_PEOPLE); 
      } else { 
        setPeople(data as Person[]); 
      }
    });

    // 4. Events
    const unsubEvents = subscribeToCollection('external_events', (data) => {
      if (data.length === 0) { 
        seedCollection('external_events', MOCK_EXTERNAL_EVENTS); 
      } else { 
        setExternalEvents(data as ExternalEvent[]); 
      }
    });

    // 5. Users
    const unsubUsers = subscribeToCollection('users', (data) => {
      if (data.length === 0) { 
        seedCollection('users', [DEFAULT_ADMIN]); 
      } else { 
        const fetchedUsers = data as UserProfile[];
        setAllUsers(fetchedUsers);
        
        // Real-time update of current user permission
        if (user) {
            const updatedSelf = fetchedUsers.find(u => u.id === user.id);
            if (updatedSelf) {
                // Check if critical fields changed before updating state/localStorage to avoid loops
                if(JSON.stringify(updatedSelf) !== JSON.stringify(user)) {
                    setUser(updatedSelf);
                    localStorage.setItem('greenmaster_user', JSON.stringify(updatedSelf));
                }
            } else {
                // User deleted from DB?
                // Optional: Force logout if user no longer exists in DB
            }
        }
      }
    });

    return () => {
      unsubLogs(); unsubCourses(); unsubPeople(); unsubEvents(); unsubUsers();
    };
  }, [user?.id]); // Depend on user.id to ensure self-update logic works

  // --- Auth Actions ---
  const login = async (email: string): Promise<string | void> => {
    // Force a fresh check against allUsers state which is kept in sync
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (!foundUser) return '등록된 이메일이 아닙니다. 회원가입을 진행해주세요.';
    
    if (foundUser.status === 'PENDING') {
        return '현재 관리자 승인 대기 중입니다. 승인이 완료되면 이메일로 알림이 발송됩니다.';
    }
    
    if (foundUser.status === 'REJECTED') {
        return '가입 요청이 거절되었거나 계정이 차단되었습니다. 관리자에게 문의하세요.';
    }

    setUser(foundUser);
    localStorage.setItem('greenmaster_user', JSON.stringify(foundUser));
  };

  const register = async (name: string, email: string, department: Department) => {
    // Check local state first for immediate feedback
    if (allUsers.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new Error('이미 등록된 이메일입니다. 로그인해주세요.');
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      name,
      email: email.trim(),
      role: UserRole.INTERMEDIATE, // Default Role
      department,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      status: 'PENDING'
    };
    
    // Save to Firestore
    await saveDocument('users', newUser);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('greenmaster_user');
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    await updateDocument('users', userId, { status });
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    await updateDocument('users', userId, { role });
  };

  const updateUserDepartment = async (userId: string, department: Department) => {
    await updateDocument('users', userId, { department });
  };

  // --- CRUD Actions (Now using Firestore) ---
  const addLog = (log: LogEntry) => saveDocument('logs', log);
  const updateLog = (log: LogEntry) => updateDocument('logs', log.id, log);
  const deleteLog = (id: string) => deleteDocument('logs', id);

  const addCourse = (course: GolfCourse) => saveDocument('courses', course);
  const updateCourse = (course: GolfCourse) => updateDocument('courses', course.id, course);
  const deleteCourse = (id: string) => deleteDocument('courses', id);

  // Smart Person Add (Deduplication Logic preserved but async)
  const addPerson = async (newPerson: Person) => {
    const normalize = (s: string) => s.trim().replace(/\s+/g, '').toLowerCase();
    // Use current 'people' state which is synced from DB
    const existing = people.find(p => normalize(p.name) === normalize(newPerson.name));

    if (existing) {
        let updatedCareers = [...existing.careers];
        const isRoleChanged = newPerson.currentCourseId && (newPerson.currentCourseId !== existing.currentCourseId);
        
        if (isRoleChanged && existing.currentCourseId) {
             const oldCourse = courses.find(c => c.id === existing.currentCourseId);
             updatedCareers.push({
                 courseId: existing.currentCourseId,
                 courseName: oldCourse?.name || 'Unknown Course',
                 role: existing.currentRole,
                 startDate: existing.currentRoleStartDate || '',
                 endDate: new Date().toISOString().split('T')[0],
                 description: 'Auto-archived upon merge with new data'
             });
        }

        const merged: Person = {
            ...existing,
            phone: newPerson.phone || existing.phone,
            currentRole: newPerson.currentRole || existing.currentRole,
            currentCourseId: newPerson.currentCourseId || existing.currentCourseId,
            currentRoleStartDate: newPerson.currentRoleStartDate || existing.currentRoleStartDate,
            affinity: newPerson.affinity !== 0 ? newPerson.affinity : existing.affinity,
            notes: existing.notes + (newPerson.notes ? `\n\n[Merged Info]: ${newPerson.notes}` : ''),
            careers: updatedCareers
        };
        await updateDocument('people', existing.id, merged);
    } else {
        await saveDocument('people', newPerson);
    }
  };

  const updatePerson = (person: Person) => updateDocument('people', person.id, person);
  const addExternalEvent = (event: ExternalEvent) => saveDocument('external_events', event);
  const refreshLogs = () => {}; // No-op, sync is automatic

  const isSimulatedLive = true;
  const canUseAI = user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN;
  const canViewFullData = user?.role === UserRole.SENIOR || user?.role === UserRole.INTERMEDIATE || user?.role === UserRole.ADMIN;
  const isAdmin = user?.role === UserRole.SENIOR || user?.role === UserRole.ADMIN;

  const value = {
    user, allUsers, login, register, logout, updateUserStatus, updateUserRole, updateUserDepartment,
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
