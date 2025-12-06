import { GolfCourse, CourseType, GrassType, Person, AffinityLevel, LogEntry, Department, ExternalEvent } from './types';

export const MOCK_COURSES: GolfCourse[] = [
  {
    id: 'c1',
    name: '스카이뷰 CC',
    holes: 18,
    type: CourseType.PUBLIC,
    openYear: '2015',
    address: '경기 여주시 북내면',
    grassType: GrassType.ZOYSIA,
    area: '42만평',
    description: '난이도가 높은 산악형 코스. 최근 그린 스피드 이슈 있음.',
  },
  {
    id: 'c2',
    name: '레이크사이드',
    holes: 54,
    type: CourseType.MEMBER,
    openYear: '1990',
    address: '경기 용인시 처인구',
    grassType: GrassType.BENTGRASS,
    area: '120만평',
    description: '전통적인 명문 구장. 배수 불량 구간 공사 예정.',
  },
  {
    id: 'c3',
    name: '오션비치 골프앤리조트',
    holes: 27,
    type: CourseType.PUBLIC,
    openYear: '2006',
    address: '경북 영덕군',
    grassType: GrassType.MIXED,
    area: '50만평',
    description: '바다가 보이는 링크스 코스. 해풍으로 인한 잔디 관리 어려움.',
  },
];

export const MOCK_PEOPLE: Person[] = [
  {
    id: 'p1',
    name: '김철수',
    phone: '010-1234-5678',
    currentRole: '코스팀장',
    currentCourseId: 'c1',
    affinity: AffinityLevel.ALLY,
    notes: '전 직장(레이크사이드) 때부터 우리 제품을 선호함. 기술적 조언을 구하는 편.',
    careers: [
      { courseId: 'c2', courseName: '레이크사이드', role: '대리', startDate: '2010-03', endDate: '2018-02', description: '그린 보수 공사 총괄' },
      { courseId: 'c1', courseName: '스카이뷰 CC', role: '팀장', startDate: '2018-03' },
    ],
  },
  {
    id: 'p2',
    name: '이영희',
    phone: '010-9876-5432',
    currentRole: '총지배인',
    currentCourseId: 'c2',
    affinity: AffinityLevel.UNFRIENDLY,
    notes: '예산 절감을 최우선으로 함. 경쟁사(A사) 제품 선호 경향.',
    careers: [
      { courseId: 'c3', courseName: '오션비치', role: '운영팀장', startDate: '2015-01', endDate: '2020-12' },
      { courseId: 'c2', courseName: '레이크사이드', role: '총지배인', startDate: '2021-01' },
    ],
  },
];

export const MOCK_LOGS: LogEntry[] = [
  {
    id: 'l1',
    date: '2024-05-20',
    author: '박영업',
    department: Department.SALES,
    courseId: 'c1',
    courseName: '스카이뷰 CC',
    title: '하반기 비료 납품 계약 미팅',
    content: '김철수 팀장과 미팅 진행. 경쟁사 대비 단가 이슈가 있었으나, 기술지원 서비스(드론 촬영 등) 포함하여 계약 유력.',
    tags: ['계약', '영업'],
    createdAt: Date.now() - 3600000 * 2, // 2 hours ago
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'l2',
    date: '2024-05-18',
    author: '최연구',
    department: Department.RESEARCH,
    courseId: 'c1',
    courseName: '스카이뷰 CC',
    title: '신규 제초제 약효 시험 3차',
    content: '14번 홀 페어웨이 우측 러프 지역 살포. 3일차 관찰 결과 잡초 변색 시작됨. 사진 첨부함.',
    imageUrls: ['https://picsum.photos/400/300'],
    tags: ['임상', '제초제'],
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'l3',
    date: '2024-05-15',
    author: '정건설',
    department: Department.CONSTRUCTION,
    courseId: 'c2',
    courseName: '레이크사이드',
    title: '동코스 5번홀 배수공사 견적 제출',
    content: '현장 실사 완료. 암반 지형이라 굴착 비용이 추가될 것으로 보임. 1차 견적서 제출 완료.',
    tags: ['견적', '공사'],
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'l4',
    date: '2024-05-10',
    author: '장부사장',
    department: Department.CONSULTING,
    courseId: 'c3',
    courseName: '오션비치',
    title: '경영 효율화 컨설팅 착수',
    content: '객단가 상승을 위한 코스 리뉴얼 제안. 야간 라운드 활성화를 위한 조명 교체 필요성 언급.',
    tags: ['경영', '컨설팅'],
    createdAt: Date.now() - 86400000 * 10, // 10 days ago
    updatedAt: Date.now() - 86400000 * 10,
  },
];

export const MOCK_EXTERNAL_EVENTS: ExternalEvent[] = [
  {
    id: 'e1',
    title: '골프장 경영 협회 세미나',
    date: '2024-05-22',
    source: 'Google',
    time: '14:00',
    location: '서울 코엑스'
  },
  {
    id: 'e2',
    title: '본사 2분기 전략 회의',
    date: '2024-05-27',
    source: 'Outlook',
    time: '09:00',
    location: '본사 대회의실'
  },
  {
    id: 'e3',
    title: 'CEO 오찬 미팅',
    date: '2024-05-10',
    source: 'Google',
    time: '12:00',
    location: '강남구'
  },
  {
    id: 'e4',
    title: '산업 안전 교육',
    date: '2024-05-02',
    source: 'Outlook',
    time: '10:00',
  }
];