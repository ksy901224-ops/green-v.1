
export enum Department {
  SALES = '영업',
  RESEARCH = '연구소', // 임상시험 등
  CONSTRUCTION = '건설사업', // 견적, 공사
  CONSULTING = '컨설팅',
  MANAGEMENT = '관리', // 인사 이동 등
}

export enum UserRole {
  SENIOR = '상급자 (Senior)',       // 모든 권한 + AI 사용
  INTERMEDIATE = '중급자 (Intermediate)', // 데이터 조회/등록 가능, AI 불가
  JUNIOR = '하급자 (Junior)',       // 골프장 이슈만 조회 가능
  ADMIN = '시스템 관리자 (Admin)',   // (Legacy compatibility, acts as Senior)
}

export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  avatar?: string;
  status: UserStatus; // New field for approval workflow
}

export enum CourseType {
  MEMBER = '회원제',
  PUBLIC = '대중제',
}

export enum GrassType {
  ZOYSIA = '한국잔디',
  BENTGRASS = '벤트그라스',
  KENTUCKY = '캔터키블루그라스',
  MIXED = '혼합',
}

export interface GolfCourse {
  id: string;
  name: string;
  holes: number;
  type: CourseType;
  openYear: string;
  address: string;
  grassType: GrassType;
  area: string; // e.g., "30만평"
  description: string; // Basic spec info
  lat?: number;
  lng?: number;
  issues?: string[]; // Added: History of major issues derived from logs
}

export interface CareerRecord {
  courseId: string;
  courseName: string;
  role: string;
  startDate: string;
  endDate?: string; // If undefined, currently employed
  description?: string; // Key achievements or issues
}

export enum AffinityLevel {
  HOSTILE = -2, // 적대적
  UNFRIENDLY = -1,
  NEUTRAL = 0,
  FRIENDLY = 1,
  ALLY = 2, // 매우 우호적
}

export interface Person {
  id: string;
  name: string;
  phone: string;
  currentRole: string;
  currentRoleStartDate?: string; // When they started this specific role
  currentCourseId?: string; // If currently working at a known course
  careers: CareerRecord[];
  affinity: AffinityLevel;
  notes: string; // Relationship details, personality, etc.
}

export interface LogEntry {
  id: string;
  date: string;
  author: string;
  department: Department;
  courseId: string; // Link to GolfCourse
  courseName: string; // Denormalized for easier display
  title: string;
  content: string;
  imageUrls?: string[];
  tags?: string[]; // e.g., "issue", "urgent", "contract"
  contactPerson?: string; // Added to help tracking people
  createdAt?: number; // Added: Creation Timestamp
  updatedAt?: number; // Added: Last Modification Timestamp
}

export interface ExternalEvent {
  id: string;
  title: string;
  date: string;
  source: 'Google' | 'Outlook' | 'Manual'; // Added Manual
  time?: string;
  location?: string;
}