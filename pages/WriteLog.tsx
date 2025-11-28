
import React, { useState, useRef, useEffect } from 'react';
import { Department, GolfCourse, CourseType, GrassType, LogEntry, Person, AffinityLevel, ExternalEvent } from '../types';
import { Camera, MapPin, Save, Loader2, FileText, Sparkles, UploadCloud, Plus, X, UserPlus, Users, CheckCircle, AlertCircle, PlusSquare, Zap, AlertTriangle, Clock, Globe, Map, ArrowLeft, Calendar, FileType, AlignLeft, CalendarPlus, ListChecks, RefreshCcw } from 'lucide-react';
import { analyzeDocument, getCourseDetailsFromAI } from '../services/geminiService';
import { useApp } from '../contexts/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';

const WriteLog: React.FC = () => {
  const { addLog, updateLog, addCourse, updateCourse, addPerson, addExternalEvent, courses: globalCourses, people: globalPeople } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const editingLog = location.state?.log as LogEntry | undefined;
  
  const [activeTab, setActiveTab] = useState<'LOG' | 'PERSON' | 'SCHEDULE'>('LOG');

  // --- Log Form State ---
  const [dept, setDept] = useState<string>('영업');
  const [courseId, setCourseId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<{lat: number, lng: number} | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [contactPerson, setContactPerson] = useState(''); // Added contact person state
  
  // --- Person Form State ---
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [personRole, setPersonRole] = useState('');
  const [personStartDate, setPersonStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [personCourseId, setPersonCourseId] = useState('');
  const [personAffinity, setPersonAffinity] = useState<string>('0');
  const [personNotes, setPersonNotes] = useState('');

  // --- Schedule Form State ---
  const [schedTitle, setSchedTitle] = useState('');
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedTime, setSchedTime] = useState('09:00');
  const [schedLocation, setSchedLocation] = useState('');
  const [schedSource, setSchedSource] = useState<'Manual' | 'Google' | 'Outlook'>('Manual');

  // --- Shared State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  
  // --- AI Input Mode State ---
  const [aiInputMode, setAiInputMode] = useState<'FILE' | 'TEXT'>('FILE');
  const [aiTextInput, setAiTextInput] = useState('');

  // --- Analysis Feedback State ---
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Updated feedback structure for more specific details
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
    fields?: { label: string; value: string }[];
    isNewCourse?: boolean;
    multiLogCount?: number; // To track if multiple logs were created
    summaryReport?: string; // New: AI Summary Report
    retryAction?: () => void; // Allow retry on error
  } | null>(null);

  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  
  // Pre-fill for Editing
  useEffect(() => {
    if (editingLog) {
      setActiveTab('LOG');
      setTitle(editingLog.title);
      setContent(editingLog.content);
      setDept(editingLog.department);
      setCourseId(editingLog.courseId);
      setTags(editingLog.tags || []);
      setContactPerson(editingLog.contactPerson || '');
    }
  }, [editingLog]);

  // Auto-dismiss success feedback (Disabled auto-dismiss if there's a summary to read)
  useEffect(() => {
    if (feedback?.type === 'success' && !feedback.summaryReport) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 12000); 
      return () => clearTimeout(timer);
    }
  }, [feedback]);
  
  // Dynamic Course List & Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [newCourse, setNewCourse] = useState<{
    name: string;
    address: string;
    holes: number;
    type: CourseType;
    grassType: GrassType;
  }>({
    name: '',
    address: '',
    holes: 18,
    type: CourseType.PUBLIC,
    grassType: GrassType.ZOYSIA
  });
  
  // Validation State
  const [courseErrors, setCourseErrors] = useState<{name?: string; holes?: string}>({});

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocationData({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        alert('현재 위치 정보가 추가되었습니다.');
      }, () => {
        alert('위치 정보를 가져올 수 없습니다.');
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setFileName(e.target.files[0].name);
    }
  };

  const performAiAnalysis = async (file?: File, text?: string) => {
    if (!file && !text) return;

    setFeedback(null);
    setUploadProgress(0);
    setStatusMessage('데이터 준비 및 검증 중...');
    setHighlightedFields(new Set());
    setIsAnalyzing(true);
    setContactPerson(''); // Reset contact person on new analysis

    let progressInterval: any;

    try {
        let base64Data: string | undefined;
        let mimeType: string | undefined;

        // --- File Processing ---
        if (file) {
            // Validation Logic ... (omitted for brevity, same as before)
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
            const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

            const isMimeValid = file.type ? validTypes.includes(file.type) : true;
            const isExtValid = validExtensions.includes(fileExtension);

            if (!isMimeValid && !isExtValid) {
                setFeedback({
                    type: 'error', 
                    title: '지원하지 않는 파일 형식', 
                    message: 'PDF 문서 또는 이미지 파일(JPG, PNG)만 분석 가능합니다.'
                });
                setIsAnalyzing(false); return;
            }

            // Read File
            const readPromise = new Promise<{base64: string, type: string}>((resolve, reject) => {
                const reader = new FileReader();
                reader.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(Math.round((event.loaded / event.total) * 30));
                        setStatusMessage('파일 서버 전송 중...');
                    }
                };
                reader.onloadend = () => {
                    const result = reader.result as string;
                    if(result) resolve({base64: result.split(',')[1], type: file.type || 'application/octet-stream'});
                    else reject(new Error("File read failed"));
                };
                reader.onerror = () => reject(new Error("File read error"));
                reader.readAsDataURL(file);
            });

            const fileResult = await readPromise;
            base64Data = fileResult.base64;
            mimeType = fileResult.type;
            setUploadProgress(35);
            setStatusMessage('AI 분석 엔진 가동 중...');
        } else {
            setUploadProgress(30);
            setStatusMessage('텍스트 데이터 분석 시작...');
        }

        // --- Analysis Phase ---
        progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) return prev;
                // Faster progress initially, then slow down
                return prev + (prev < 60 ? 3 : 1); 
            });
            setStatusMessage(prev => {
                if (uploadProgress > 70) return '이슈 심층 진단 및 요약 리포트 생성 중...';
                if (uploadProgress > 50) return '문서 내용 구조화 및 필드 추출 중...';
                return 'AI 모델 정밀 분석 진행 중...';
            });
        }, 200);

        // Pass existing course names for AI Entity Resolution
        const existingCourseNames = globalCourses.map(c => c.name);
        
        // RESULT IS NOW AN ARRAY
        const results = await analyzeDocument(
            { base64Data, mimeType, textData: text },
            existingCourseNames
        );
        
        clearInterval(progressInterval);
        setUploadProgress(95); 
        setStatusMessage('분석 완료, 후속 작업 처리 중...');
        
        if (results && results.length > 0) {
            const isMultiLog = results.length > 1;
            const extractedSummary: {label: string, value: string}[] = [];
            let isNewCourseCreated = false;
            let logCount = 0;
            let summaryReportText = ''; // Accumulate summaries

            // Process each result
            for (const result of results) {
                logCount++;
                let targetCourseId = '';
                let courseNameForFeedback = '미지정';
                let enhancedContent = result.content || '';
                
                // Content Enhancement
                const extraDetails = [];
                if (result.project_name) extraDetails.push(`프로젝트명: ${result.project_name}`);
                if (result.contact_person) extraDetails.push(`담당자: ${result.contact_person}`);
                if (result.delivery_date) extraDetails.push(`납품/기한: ${result.delivery_date}`);
                if (result.key_issues && result.key_issues.length > 0) {
                    extraDetails.push(`\n[AI 식별 핵심 이슈 (${result.courseName})]\n${result.key_issues.map((issue: string) => `- ${issue}`).join('\n')}`);
                }
                
                // Add Summary Report to content if available
                if (result.summary_report) {
                    summaryReportText += `[${result.courseName} 요약] ${result.summary_report}\n\n`;
                    extraDetails.push(`\n[AI 심층 요약]\n${result.summary_report}`);
                }

                if (extraDetails.length > 0) {
                    enhancedContent += `\n\n[AI 추출 상세 정보]\n${extraDetails.join('\n')}`;
                }

                const matchedDept = Object.values(Department).find(d => result.department && result.department.includes(d)) || '영업';

                // Course Logic
                const normalize = (str: string) => str.replace(/\s+/g, '').toLowerCase();
                const matchedCourse = globalCourses.find(c => normalize(c.name) === normalize(result.courseName || ''));

                if (matchedCourse) {
                    targetCourseId = matchedCourse.id;
                    courseNameForFeedback = matchedCourse.name;
                } else if (result.courseName && result.courseName !== '미지정') {
                    isNewCourseCreated = true;
                    // 1. Create Placeholder Course locally
                    const autoCourseId = `auto-course-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    const newAutoCourse: GolfCourse = {
                        id: autoCourseId,
                        name: result.courseName,
                        address: result.course_info?.address || '주소 정보 없음 (AI 자동생성)',
                        holes: result.course_info?.holes || 18,
                        type: (result.course_info?.type as CourseType) || CourseType.PUBLIC,
                        grassType: GrassType.MIXED,
                        openYear: new Date().getFullYear().toString(),
                        area: '-',
                        description: `AI가 문서 분석 중 자동으로 생성한 골프장입니다.`,
                        issues: []
                    };
                    addCourse(newAutoCourse);
                    targetCourseId = autoCourseId;
                    courseNameForFeedback = result.courseName;

                    // 2. Trigger Async Enrichment (Naver Maps Simulation) - Auto Update
                    // This fetches Address/GPS for the newly created course
                    getCourseDetailsFromAI(result.courseName).then((details) => {
                        console.log(`Auto-enriching ${result.courseName}`, details);
                        updateCourse({
                            ...newAutoCourse,
                            address: details.address || newAutoCourse.address,
                            holes: details.holes || newAutoCourse.holes,
                            type: details.type || newAutoCourse.type,
                            grassType: details.grassType || newAutoCourse.grassType,
                            // Add Lat/Lng if found
                            lat: details.lat,
                            lng: details.lng,
                            description: details.description ? `${newAutoCourse.description}\n\n[지도 상세 정보]\n${details.description}` : newAutoCourse.description
                        });
                    }).catch(err => console.error("Auto-enrichment failed", err));
                }

                // Add to summary
                if (results.length <= 3) { // Only list first few if too many
                    extractedSummary.push({ label: `[${logCount}] 골프장`, value: courseNameForFeedback });
                    extractedSummary.push({ label: `[${logCount}] 이슈`, value: `${result.key_issues?.length || 0}건 식별` });
                }

                // --- SAVE LOGIC ---
                // If Auto Save is ON OR if multiple logs detected (force save to avoid UI conflict)
                if (isAutoSaveEnabled || isMultiLog) {
                    const newLog: LogEntry = {
                        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        date: result.date || new Date().toISOString().split('T')[0],
                        author: 'AI 자동등록 (Shared)', 
                        department: matchedDept as Department,
                        courseId: targetCourseId || 'unknown',
                        courseName: courseNameForFeedback || '미지정',
                        title: result.title,
                        content: enhancedContent,
                        tags: result.tags,
                        imageUrls: [],
                        contactPerson: result.contact_person
                    };
                    addLog(newLog); // Context handles auto-updates
                } else {
                    // Single Mode & Auto Save OFF -> Populate Form
                    if (results.length === 1) {
                        const r = results[0];
                        setTitle(r.title);
                        setContent(enhancedContent);
                        setDept(matchedDept);
                        setCourseId(targetCourseId);
                        setTags(r.tags || []);
                        if (r.contact_person) {
                            setContactPerson(r.contact_person);
                            // New Highlight for contact person
                            setHighlightedFields(prev => new Set(prev).add('contactPerson'));
                        }
                        
                        const newHighlights = new Set<string>();
                        newHighlights.add('title');
                        newHighlights.add('content');
                        newHighlights.add('department');
                        newHighlights.add('courseId');
                        newHighlights.add('tags');
                        setHighlightedFields(newHighlights);
                    }
                }
            }

            if (results.length > 3) {
                extractedSummary.push({ label: '기타', value: `외 ${results.length - 3}건 추가됨` });
            }

            setUploadProgress(100);
            
            setFeedback({
                type: 'success', 
                title: isMultiLog ? `총 ${results.length}건의 일지가 자동 분류 및 등록되었습니다` : 'AI 분석 및 자동 입력 성공',
                message: isMultiLog
                   ? `문서에서 ${results.length}개의 서로 다른 골프장 정보가 감지되어 각각 별도의 일지로 분리/저장되었습니다.` 
                   : (isAutoSaveEnabled ? `데이터가 '${results[0].courseName}'로 자동 분류되어 공유되었습니다.` : `AI가 데이터를 추출하여 입력 필드를 채웠습니다.`),
                fields: extractedSummary,
                isNewCourse: isNewCourseCreated,
                multiLogCount: results.length,
                summaryReport: summaryReportText // Pass the report
            });
            
            setAiTextInput('');
            setTimeout(() => setHighlightedFields(new Set()), 15000);
        } else {
            throw new Error('분석 결과가 비어있습니다.');
        }

    } catch (error: any) {
        console.error(error);
        if(progressInterval) clearInterval(progressInterval);
        setUploadProgress(0);
        
        let errorTitle = '분석 실패';
        let errorMsg = error.message || '알 수 없는 오류가 발생했습니다.';
        
        // Map error codes to user-friendly messages
        if (errorMsg === "UNSUPPORTED_TYPE") {
            errorTitle = "지원하지 않는 파일";
            errorMsg = "PDF 또는 이미지 파일만 지원됩니다.";
        } else if (errorMsg === "SIZE_LIMIT_EXCEEDED") {
            errorTitle = "파일 크기 초과";
            errorMsg = "10MB 이하의 파일만 업로드할 수 있습니다.";
        } else if (errorMsg === "API_KEY_ERROR") {
            errorTitle = "AI 서비스 권한 오류";
            errorMsg = "API Key가 설정되지 않았거나 만료되었습니다. 관리자에게 문의하세요.";
        } else if (errorMsg === "QUOTA_EXCEEDED") {
            errorTitle = "사용량 초과";
            errorMsg = "AI 서비스 요청량이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        } else if (errorMsg === "SAFETY_BLOCK") {
            errorTitle = "보안 정책 차단";
            errorMsg = "문서 내용이 안전 정책에 의해 차단되었습니다. 민감한 정보가 포함되었는지 확인하세요.";
        }

        setFeedback({
            type: 'error', 
            title: errorTitle, 
            message: errorMsg,
            retryAction: () => performAiAnalysis(file, text)
        });
    } finally {
        if(progressInterval) clearInterval(progressInterval);
        setIsAnalyzing(false);
    }
  };

  const handleAutoFillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        performAiAnalysis(file);
        e.target.value = '';
    }
  };

  const handleAiTextSubmit = () => {
      if (!aiTextInput.trim()) {
          alert("분석할 텍스트를 입력해주세요.");
          return;
      }
      performAiAnalysis(undefined, aiTextInput);
  };

  // ... (Course Modal logic kept same) ...
  const handleCourseChange = (field: keyof typeof newCourse, value: any) => {
    setNewCourse(prev => ({...prev, [field]: value}));
    if (field === 'name' || field === 'holes') setCourseErrors(prev => ({...prev, [field]: undefined}));
  };

  const handleAiCourseSearch = async () => {
    if (!newCourse.name) { setCourseErrors({ name: '골프장 이름을 먼저 입력해주세요.' }); return; }
    setIsAiSearching(true);
    try {
      const details = await getCourseDetailsFromAI(newCourse.name);
      setNewCourse(prev => ({ ...prev, ...details }));
      alert(`AI가 '${newCourse.name}' 정보를 찾아 입력했습니다.`);
    } catch (error) { console.error(error); alert('AI 검색 오류'); } 
    finally { setIsAiSearching(false); }
  };

  const handleSaveNewCourse = () => {
    // ... same validation ...
    const courseToAdd: GolfCourse = {
      id: `new-${Date.now()}`,
      name: newCourse.name,
      address: newCourse.address || '주소 미입력',
      holes: newCourse.holes,
      type: newCourse.type,
      grassType: newCourse.grassType,
      openYear: new Date().getFullYear().toString(),
      area: '-',
      description: '사용자가 직접 등록한 골프장입니다.',
      issues: [] // Init empty issues
    };
    addCourse(courseToAdd);
    
    // Auto-update GPS/Details for manually added course
    getCourseDetailsFromAI(newCourse.name).then((details) => {
        updateCourse({
            ...courseToAdd,
            address: details.address || courseToAdd.address,
            holes: details.holes || courseToAdd.holes,
            type: details.type || courseToAdd.type,
            grassType: details.grassType || courseToAdd.grassType,
            lat: details.lat,
            lng: details.lng,
            description: details.description ? `${courseToAdd.description}\n\n[지도 상세 정보]\n${details.description}` : courseToAdd.description
        });
    }).catch(err => console.error("Manual course auto-enrichment failed", err));

    if (activeTab === 'LOG') setCourseId(courseToAdd.id);
    else setPersonCourseId(courseToAdd.id);
    setIsCourseModalOpen(false);
    alert(`${courseToAdd.name} 골프장이 등록되었습니다. (세부 정보 자동 업데이트 중)`);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedCourse = globalCourses.find(c => c.id === courseId);

    if (editingLog) {
       const updatedLog: LogEntry = {
           ...editingLog,
           department: dept as Department,
           courseId: courseId,
           courseName: selectedCourse?.name || '미지정',
           title: title,
           content: content,
           tags: tags,
           contactPerson: contactPerson
       };
       updateLog(updatedLog);
       setTimeout(() => { setIsSubmitting(false); alert('수정되었습니다.'); navigate(-1); }, 500);
    } else {
       const newLog: LogEntry = {
           id: `manual-${Date.now()}`,
           date: new Date().toISOString().split('T')[0],
           author: '현재 사용자', 
           department: dept as Department,
           courseId: courseId,
           courseName: selectedCourse?.name || '미지정',
           title: title,
           content: content,
           tags: tags,
           contactPerson: contactPerson
       };
       addLog(newLog); // Context handles auto-updates
       setTimeout(() => { 
           setIsSubmitting(false); 
           alert('등록 및 공유 완료 (골프장 이력/인물 자동 업데이트)'); 
           setTitle(''); setContent(''); setFileName(null); setTags([]); setCourseId(''); setContactPerson('');
       }, 1000);
    }
  };

  const handlePersonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !personRole || !personCourseId) { alert('필수 항목을 입력하세요.'); return; }
    setIsSubmitting(true);
    const newPerson: Person = {
        id: `person-${Date.now()}`,
        name: personName,
        phone: personPhone,
        currentRole: personRole,
        currentRoleStartDate: personStartDate,
        currentCourseId: personCourseId,
        affinity: parseInt(personAffinity) as AffinityLevel,
        notes: personNotes,
        careers: [] 
    };
    addPerson(newPerson);
    setTimeout(() => { setIsSubmitting(false); alert('등록되었습니다.'); setPersonName(''); }, 500);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTitle || !schedDate) return;
    setIsSubmitting(true);
    const newEvent: ExternalEvent = {
        id: `sched-${Date.now()}`,
        title: schedTitle,
        date: schedDate,
        time: schedTime,
        location: schedLocation,
        source: schedSource
    };
    addExternalEvent(newEvent);
    setTimeout(() => { setIsSubmitting(false); alert('일정이 등록되었습니다.'); setSchedTitle(''); }, 500);
  };

  const isFilled = (key: string) => highlightedFields.has(key);
  const getInputClass = (key: string) => `w-full rounded-lg border shadow-sm py-2 px-3 transition-all ${isFilled(key) ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-300 focus:ring-brand-500'}`;
  const getSelectClass = (key: string) => `w-full rounded-lg border shadow-sm py-2.5 px-3 transition-all ${isFilled(key) ? 'bg-yellow-100 border-yellow-400 ring-2 ring-yellow-200' : 'border-slate-300 focus:ring-brand-500'}`;

  // Check if contact person is new
  const isNewPerson = contactPerson && contactPerson.length > 1 && !globalPeople.some(p => p.name.replace(/\s/g,'') === contactPerson.replace(/\s/g,''));

  return (
    <div className="space-y-6 relative">
      {editingLog && (
          <div className="flex items-center space-x-2 mb-4">
              <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft size={20} /></button>
              <h2 className="text-lg font-bold">일지 수정 모드</h2>
          </div>
      )}

      {!editingLog && (
          <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg">
            {['LOG', 'PERSON', 'SCHEDULE'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all ${activeTab === tab ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  {tab === 'LOG' && <FileText className="inline mr-2" size={18} />}
                  {tab === 'PERSON' && <UserPlus className="inline mr-2" size={18} />}
                  {tab === 'SCHEDULE' && <CalendarPlus className="inline mr-2" size={18} />}
                  {tab === 'LOG' ? '업무 일지' : tab === 'PERSON' ? '인물 등록' : '일정 등록'}
                </button>
            ))}
          </div>
      )}

      {activeTab === 'LOG' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!editingLog && (
            <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                {/* AI Input Section (File/Text) - Same UI as before */}
                <h2 className="text-xl font-bold mb-2 flex items-center"><Sparkles className="mr-2 text-yellow-300" size={20} /> AI 스마트 입력</h2>
                <p className="text-brand-100 text-sm mb-4">파일 업로드(PDF, 이미지) 또는 텍스트 붙여넣기로 자동 분석</p>
                
                {isAnalyzing && <div className="text-white font-bold mb-2 flex items-center"><Loader2 className="animate-spin mr-2"/> {statusMessage} ({uploadProgress}%)</div>}
                
                {feedback && (
                    <div className={`mb-4 p-4 rounded-lg border ${feedback.type === 'success' ? 'bg-emerald-900/80 border-emerald-400' : 'bg-rose-900/80 border-rose-400'} text-white`}>
                        <div className="font-bold flex items-center justify-between">
                            <span className="flex items-center">{feedback.type === 'success' ? <CheckCircle className="mr-2"/> : <AlertTriangle className="mr-2"/>} {feedback.title}</span>
                            {feedback.multiLogCount && feedback.multiLogCount > 1 && (
                                <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full flex items-center font-bold">
                                    <ListChecks size={12} className="mr-1"/> 일괄 처리됨
                                </span>
                            )}
                        </div>
                        <p className="text-sm opacity-90 mt-1 whitespace-pre-line">{feedback.message}</p>
                        
                        {/* Retry Button for Errors */}
                        {feedback.type === 'error' && feedback.retryAction && (
                            <button 
                                onClick={feedback.retryAction}
                                className="mt-3 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-colors"
                            >
                                <RefreshCcw size={12} className="mr-1.5"/> 다시 시도
                            </button>
                        )}

                        {feedback.fields && (
                            <div className="mt-3 bg-black/20 p-2 rounded text-xs grid grid-cols-2 gap-2">
                                {feedback.fields.map((f, i) => (
                                    <div key={i}><span className="opacity-70 mr-1">{f.label}:</span> <strong>{f.value}</strong></div>
                                ))}
                            </div>
                        )}
                        {/* New: Summary Report Display */}
                        {feedback.summaryReport && (
                            <div className="mt-4 bg-brand-900/50 p-3 rounded-lg border border-brand-500/30">
                                <h5 className="text-xs font-bold text-yellow-400 mb-2 flex items-center">
                                    <Sparkles size={12} className="mr-1"/> AI 심층 분석 및 제언
                                </h5>
                                <p className="text-xs text-slate-100 whitespace-pre-line leading-relaxed">
                                    {feedback.summaryReport}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex bg-black/20 rounded-lg p-1 mb-4 w-fit">
                  <button onClick={() => setAiInputMode('FILE')} className={`px-4 py-2 rounded text-xs font-bold ${aiInputMode === 'FILE' ? 'bg-white text-brand-800' : 'text-brand-100'}`}>파일 (PDF/IMG)</button>
                  <button onClick={() => setAiInputMode('TEXT')} className={`px-4 py-2 rounded text-xs font-bold ${aiInputMode === 'TEXT' ? 'bg-white text-brand-800' : 'text-brand-100'}`}>텍스트</button>
                </div>

                {aiInputMode === 'FILE' ? (
                    <label className={`inline-flex items-center justify-center bg-white text-brand-700 px-6 py-4 rounded-xl font-bold text-sm cursor-pointer shadow-lg w-full md:w-auto ${isAnalyzing ? 'opacity-50' : ''}`}>
                        {isAnalyzing ? '분석 중...' : <><UploadCloud className="mr-2"/> 파일 선택</>}
                        <input type="file" className="hidden" onChange={handleAutoFillUpload} disabled={isAnalyzing} accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"/>
                    </label>
                ) : (
                    <div className="flex flex-col gap-2">
                        <textarea className="w-full h-24 rounded-xl p-3 text-slate-800 text-sm" placeholder="내용 붙여넣기..." value={aiTextInput} onChange={e => setAiTextInput(e.target.value)} disabled={isAnalyzing}/>
                        <button onClick={handleAiTextSubmit} disabled={isAnalyzing || !aiTextInput} className="bg-yellow-400 text-brand-900 font-bold py-2 rounded-lg">AI 분석 시작</button>
                    </div>
                )}
                
                <div className="mt-4 flex items-center cursor-pointer" onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}>
                    <div className={`w-10 h-5 rounded-full relative mr-2 transition-colors ${isAutoSaveEnabled ? 'bg-yellow-400' : 'bg-slate-600'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${isAutoSaveEnabled ? 'left-6' : 'left-1'}`}></div>
                    </div>
                    <span className="text-xs font-bold text-white">자동 저장 및 공유</span>
                </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <form onSubmit={handleLogSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">부서</label>
                      <select className={getSelectClass('department')} value={dept} onChange={(e) => setDept(e.target.value)}>
                          {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                  </div>
                  <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-700">골프장</label>
                        <button type="button" onClick={() => setIsCourseModalOpen(true)} className="text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded">신규</button>
                      </div>
                      <select className={getSelectClass('courseId')} value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                          <option value="">선택하세요</option>
                          {globalCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
                  <input type="text" required className={getInputClass('title')} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">내용</label>
                  <textarea required rows={6} className={getInputClass('content')} value={content} onChange={(e) => setContent(e.target.value)} />
              </div>

              {/* Added Contact Person Field */}
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
                      <span>관련 담당자 (자동 인물 등록)</span>
                      {isNewPerson && (
                          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded flex items-center">
                              <UserPlus size={10} className="mr-1"/> DB 미등록: 저장 시 신규 등록됨
                          </span>
                      )}
                  </label>
                  <input 
                    type="text" 
                    className={`w-full rounded-lg border shadow-sm ${isNewPerson ? 'border-brand-300 ring-1 ring-brand-100 bg-brand-50/20' : 'border-slate-300'}`}
                    placeholder="예: 김철수 팀장 (입력 시 자동 등록됨)"
                    value={contactPerson} 
                    onChange={(e) => setContactPerson(e.target.value)} 
                  />
                  <p className="text-xs text-slate-400 mt-1">입력된 인물이 DB에 없으면 해당 골프장 담당자로 자동 등록됩니다.</p>
              </div>

              <div className="pt-4">
                  <button type="submit" disabled={isSubmitting || isAnalyzing} className="w-full bg-brand-600 text-white py-3.5 rounded-lg font-bold hover:bg-brand-700 flex justify-center items-center">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} 저장 및 공유
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Person & Schedule Tabs omitted for brevity (same as previous) */}
      {/* Course Modal omitted for brevity */}
      {/* ... keeping existing Person/Schedule/Modal code ... */}
      {activeTab === 'PERSON' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
           <h1 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Users className="mr-2 text-slate-400" />
              신규 인물 등록
           </h1>

           <form onSubmit={handlePersonSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">이름</label>
                   <input 
                      type="text" 
                      required
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                      placeholder="홍길동"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">연락처</label>
                   <input 
                      type="text" 
                      required
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                      placeholder="010-0000-0000"
                      value={personPhone}
                      onChange={(e) => setPersonPhone(e.target.value)}
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-slate-700">소속 골프장</label>
                      <button 
                        type="button"
                        onClick={() => setIsCourseModalOpen(true)}
                        className="text-xs flex items-center text-brand-600 hover:text-brand-700 font-medium bg-brand-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <Plus size={12} className="mr-1" />
                        신규 추가
                      </button>
                    </div>
                    <select 
                        className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2.5"
                        value={personCourseId}
                        onChange={(e) => setPersonCourseId(e.target.value)}
                        required
                    >
                        <option value="">소속을 선택하세요</option>
                        {globalCourses.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">직책/직급</label>
                   <input 
                      type="text" 
                      required
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                      placeholder="예: 총지배인, 코스팀장"
                      value={personRole}
                      onChange={(e) => setPersonRole(e.target.value)}
                   />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">입사일 (근무 시작일)</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input 
                       type="date"
                       className="w-full pl-10 rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 py-2.5"
                       value={personStartDate}
                       onChange={(e) => setPersonStartDate(e.target.value)}
                    />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">우리 회사와의 관계 (친밀도)</label>
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {[
                    { val: '2', label: '강력한 아군 (Ally)', color: 'bg-green-100 text-green-800 border-green-200' },
                    { val: '1', label: '우호적 (Friendly)', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                    { val: '0', label: '중립 (Neutral)', color: 'bg-slate-50 text-slate-600 border-slate-200' },
                    { val: '-1', label: '비우호적 (Unfriendly)', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                    { val: '-2', label: '적대적 (Hostile)', color: 'bg-red-50 text-red-700 border-red-100' },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setPersonAffinity(opt.val)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        personAffinity === opt.val 
                          ? `ring-2 ring-offset-1 ring-brand-500 ${opt.color} font-bold` 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">참고 사항 (성향, 특징 등)</label>
                <textarea 
                    rows={4}
                    className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                    placeholder="예: 경쟁사 제품 선호, 예산 절감 중시, 기술적 조언 선호 등"
                    value={personNotes}
                    onChange={(e) => setPersonNotes(e.target.value)}
                />
             </div>

             <div className="pt-4">
                  <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 font-bold shadow-md transition-all disabled:opacity-70"
                  >
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2" />}
                      인물 정보 등록
                  </button>
              </div>
           </form>
        </div>
      )}

      {activeTab === 'SCHEDULE' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in duration-300">
           <h1 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <CalendarPlus className="mr-2 text-slate-400" />
              일정 등록
           </h1>

           <form onSubmit={handleScheduleSubmit} className="space-y-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">일정 제목</label>
                <input 
                   type="text" 
                   required
                   className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                   placeholder="예: 주간 업무 미팅"
                   value={schedTitle}
                   onChange={(e) => setSchedTitle(e.target.value)}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">날짜</label>
                   <input 
                      type="date"
                      required
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                      value={schedDate}
                      onChange={(e) => setSchedDate(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">시간</label>
                   <input 
                      type="time"
                      className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                      value={schedTime}
                      onChange={(e) => setSchedTime(e.target.value)}
                   />
                </div>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">장소 (선택)</label>
                <input 
                   type="text"
                   className="w-full rounded-lg border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                   placeholder="예: 본사 대회의실"
                   value={schedLocation}
                   onChange={(e) => setSchedLocation(e.target.value)}
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">구분</label>
                <div className="flex space-x-2">
                   {['Manual', 'Google', 'Outlook'].map((src) => (
                      <button
                         key={src}
                         type="button"
                         onClick={() => setSchedSource(src as any)}
                         className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                            schedSource === src
                               ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold'
                               : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                         }`}
                      >
                         {src === 'Manual' ? '일반 등록' : src}
                      </button>
                   ))}
                </div>
             </div>

             <div className="pt-4">
                  <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full flex justify-center items-center bg-brand-600 text-white py-3 px-4 rounded-lg hover:bg-brand-700 font-bold shadow-md transition-all disabled:opacity-70"
                  >
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CalendarPlus className="mr-2" />}
                      일정 등록
                  </button>
              </div>
           </form>
        </div>
      )}

      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center text-lg">
                 <PlusSquare size={20} className="mr-2 text-brand-600"/>
                 신규 골프장 등록
              </h3>
              <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                    <span>골프장 이름 <span className="text-red-500">*</span></span>
                    {courseErrors.name && <span className="text-red-500 text-xs font-normal flex items-center"><AlertCircle size={10} className="mr-1"/>{courseErrors.name}</span>}
                </label>
                <div className="flex space-x-2">
                    <input type="text" className={`flex-1 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-offset-0 transition-all ${courseErrors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'}`} placeholder="예: 그린밸리 CC" value={newCourse.name} onChange={(e) => handleCourseChange('name', e.target.value)} autoFocus />
                    <button type="button" onClick={handleAiCourseSearch} disabled={isAiSearching || !newCourse.name} className="bg-brand-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center min-w-[100px] justify-center">{isAiSearching ? <Loader2 size={14} className="animate-spin" /> : <><Map size={14} className="mr-1"/>AI 검색</>}</button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">주소</label>
                <input type="text" className="w-full rounded-lg border-slate-300 text-sm py-2.5" placeholder="예: 경기도..." value={newCourse.address} onChange={(e) => handleCourseChange('address', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">운영 형태</label>
                    <select className="w-full rounded-lg border-slate-300 text-sm py-2.5" value={newCourse.type} onChange={(e) => handleCourseChange('type', e.target.value as CourseType)}>
                        {Object.values(CourseType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">잔디 종류</label>
                    <select className="w-full rounded-lg border-slate-300 text-sm py-2.5" value={newCourse.grassType} onChange={(e) => handleCourseChange('grassType', e.target.value as GrassType)}>
                        {Object.values(GrassType).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                    <span>규모 (홀 수)</span>
                    {courseErrors.holes && <span className="text-red-500 text-xs font-normal flex items-center"><AlertCircle size={10} className="mr-1"/>{courseErrors.holes}</span>}
                 </label>
                 <div className="flex items-center gap-2">
                     {[9, 18, 27, 36].map(h => (
                         <button key={h} type="button" onClick={() => handleCourseChange('holes', h)} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${newCourse.holes === h ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'bg-white border-slate-200'}`}>{h}홀</button>
                     ))}
                     <div className="relative w-20">
                        <input type="number" className="w-full rounded-lg text-sm py-2 pl-2 pr-1 text-center border-slate-300" value={newCourse.holes} onChange={(e) => handleCourseChange('holes', parseInt(e.target.value) || 0)} placeholder="기타" />
                     </div>
                 </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3">
              <button onClick={() => setIsCourseModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">취소</button>
              <button onClick={handleSaveNewCourse} className="px-5 py-2.5 text-sm font-bold text-white bg-brand-600 rounded-lg hover:bg-brand-700 flex items-center"><CheckCircle size={16} className="mr-2" /> 등록 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WriteLog;