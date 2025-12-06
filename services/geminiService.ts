
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, GolfCourse, Person, GrassType, CourseType } from '../types';

// Safety check for API Key
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Helper for retry logic with exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>, 
  retries: number = 3, 
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const msg = error.message || '';
      // Retry on 429 (Quota) or 5xx (Server Errors)
      const isTransient = msg.includes('429') || msg.includes('503') || msg.includes('500') || msg.includes('INTERNAL');
      
      if (isTransient && i < retries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        // console.warn(`Gemini API Error (Attempt ${i + 1}/${retries}): ${msg}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const generateCourseSummary = async (
  course: GolfCourse,
  logs: LogEntry[],
  people: Person[]
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "API Key가 설정되지 않아 AI 요약을 사용할 수 없습니다.";
  }

  const peopleInfo = people.map(p => `${p.name}(${p.currentRole}, 친밀도: ${p.affinity}, 특징: ${p.notes})`).join(' | ');
  const logsInfo = logs.map(l => `[${l.date}] ${l.department} - ${l.title}: ${l.content}`).join('\n');

  const prompt = `
    당신은 골프장 관리 전문가이자 비즈니스 전략가입니다.
    다음은 '${course.name}' 골프장에 대한 정보, 주요 인물, 그리고 최근 업무 일지들입니다.
    
    이 정보를 심층 분석하여 다음 항목을 포함한 "전략적 경영 및 코스 관리 인사이트 보고서"를 작성해주세요. 
    단순한 요약보다는 **이면의 맥락을 읽어내는 통찰력 있는 분석**을 제공해야 합니다. 보고서는 전문적인 톤앤매너를 유지하며 약 600자 내외로 작성하세요.

    1. **종합 현황 진단 및 리스크 (Status & Risks)**: 
       - 코스 상태(잔디 품질, 시설 노후화)와 공사 진행 상황을 점검하세요.
       - **잠재적 리스크**: 일정 지연, 예산 초과, 민원 발생 가능성, 날씨로 인한 작업 중단 등 구체적인 위험 요소를 식별하고 경고하세요.

    2. **비즈니스 기회 및 확장 전략 (Opportunities)**: 
       - 업무 일지에서 발견되는 니즈(Needs)를 바탕으로 신규 계약, 자재 납품, 컨설팅 등의 구체적인 세일즈 기회를 포착하세요.
       - 골프장의 특징(산악형, 링크스 등)에 맞춘 맞춤형 제안 포인트를 도출하세요.

    3. **경쟁 시장 및 역학 구도 심층 분석 (Competitive Landscape Analysis)**: 
       - **경쟁사 활동 감지**: 업무 일지나 인물 대화에서 경쟁사의 움직임(저가 공세, 신제품 시연, 로비 활동)을 포착하세요. 명시적 언급이 없더라도 정황상 경쟁사의 개입이 의심되는 부분을 짚어내세요.
       - **시장 역학(Dynamics)**: 현재 해당 골프장에서 어느 업체가 우위를 점하고 있는지, 'Power Struggle'(세력 다툼)이 있는지 분석하세요.
       - **대응 전략**: 경쟁사의 공세를 방어하거나 시장 점유율을 뺏어오기 위한 구체적인 전술(차별화된 기술 제안, 핵심 인물 포섭 등)을 제안하세요.

    4. **인적 네트워크 활용 전략 (Stakeholder Management)**: 
       - 우군(Ally/Friendly)을 활용하여 내부 정보를 선점하거나 의사결정을 유도하는 방안을 수립하세요.
       - 적대적 인물(Hostile)의 반대를 무력화하거나 그들의 우려를 해소할 수 있는 데이터 기반의 설득 논리를 준비하세요.

    5. **Action Plan (우선순위 과제)**: 
       - 지금 당장 실행해야 할 가장 시급하고 임팩트 있는 3가지 과제를 우선순위대로 제안하세요.

    -- 데이터 --
    [골프장 개요]
    - 이름: ${course.name} (${course.openYear}년 개장)
    - 규모: ${course.holes}홀 (${course.type})
    - 잔디: ${course.grassType}
    - 특징: ${course.description}
    
    [주요 인물 프로필]
    ${peopleInfo}

    [최근 업무 일지 히스토리]
    ${logsInfo}
  `;

  try {
    // Use retry logic for robustness
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
    });
    return response.text || "요약 생성에 실패했습니다.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }
};

export const analyzeLogEntry = async (log: LogEntry): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "API Key가 없어 분석할 수 없습니다.";
  }

  const prompt = `
    당신은 비즈니스 인텔리전스(BI) 전문가입니다. 아래의 업무 일지를 분석하여 의사결정에 도움이 되는 핵심 인사이트를 추출해주세요.

    [업무 일지 정보]
    - 날짜/부서: ${log.date} / ${log.department}
    - 제목: ${log.title}
    - 내용: ${log.content}
    - 태그: ${log.tags?.join(', ') || '없음'}

    다음 3가지 섹션으로 나누어 간결하게(총 300자 이내) 분석해주세요. 
    가독성을 위해 각 섹션 제목은 **(Bold)** 처리를 해주세요.

    1. **📋 핵심 요약**: 
       업무의 본질과 현재 상황을 한 줄로 명확하게 요약하세요.

    2. **🔍 숨겨진 함의/리스크**: 
       내용에 직접적으로 드러나지 않았지만 유의해야 할 뉘앙스(부정적 징후, 경쟁사 위협, 잠재적 문제)나 놓치고 있는 기회.
       - **건설사업** 관련일 경우: '견적' 단계라면 수익성과 수주 확률(Winning Probability)을, '공사현황' 단계라면 공기 지연(Delay) 및 안전/품질 리스크를 중점적으로 진단하세요.
       - **영업** 관련일 경우: 계약 성사 확률과 경쟁사의 움직임을 분석하세요.

    3. **🚀 추천 액션**: 
       담당자가 취해야 할 구체적이고 즉각적인 행동 2가지를 제안하세요.
  `;

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
    });
    return response.text || "분석 결과를 생성하지 못했습니다.";
  } catch (error) {
    console.error("Gemini Log Analysis Error:", error);
    return "AI 분석 중 오류가 발생했습니다.";
  }
};

// Interface for the structured response
export interface AnalyzedLogData {
  title: string;
  content: string;
  date: string;
  department: string;
  courseName: string;
  tags: string[];
  project_name?: string;
  contact_person?: string;
  delivery_date?: string;
  key_issues?: string[]; 
  participants?: string[]; 
  weather?: string;
  summary_report?: string; // New: Deep summary report
  course_info?: { // New field for auto-creating courses
    address?: string;
    holes?: number;
    type?: string;
  };
}

// Helper to validate AI response structure
const validateAnalyzedData = (data: any): AnalyzedLogData => {
  if (!data || typeof data !== 'object') {
    throw new Error("AI 응답 데이터가 올바르지 않습니다.");
  }
  
  // Ensure required fields exist with default fallbacks if missing
  return {
    title: typeof data.title === 'string' ? data.title : '',
    content: typeof data.content === 'string' ? data.content : '',
    date: typeof data.date === 'string' ? data.date : new Date().toISOString().split('T')[0],
    department: typeof data.department === 'string' ? data.department : '영업',
    courseName: typeof data.courseName === 'string' ? data.courseName : '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    project_name: typeof data.project_name === 'string' ? data.project_name : undefined,
    contact_person: typeof data.contact_person === 'string' ? data.contact_person : undefined,
    delivery_date: typeof data.delivery_date === 'string' ? data.delivery_date : undefined,
    key_issues: Array.isArray(data.key_issues) ? data.key_issues : [],
    participants: Array.isArray(data.participants) ? data.participants : [],
    weather: typeof data.weather === 'string' ? data.weather : undefined,
    summary_report: typeof data.summary_report === 'string' ? data.summary_report : undefined,
    course_info: data.course_info || {},
  };
};

export const analyzeDocument = async (
  inputData: { base64Data?: string, mimeType?: string, textData?: string }[], // Updated to accept Array
  existingCourseNames: string[] = []
): Promise<AnalyzedLogData[] | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. 시스템 관리자에게 문의하세요.");
  }

  // Construct content parts based on input type
  const contentParts: any[] = [];
  const validMimeTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/heic', 
    'image/heif'
  ];

  let totalSizeInBytes = 0;
  const MAX_BATCH_SIZE_BYTES = 25 * 1024 * 1024; // 25MB Batch Limit (Soft limit)

  // Iterate over all inputs (Batch Processing)
  for (const item of inputData) {
      if (item.base64Data && item.mimeType) {
        if (!validMimeTypes.includes(item.mimeType)) {
             throw new Error(`지원하지 않는 파일 형식(${item.mimeType})이 포함되어 있습니다.`);
        }
        
        // Approximate size check
        const size = (item.base64Data.length * 3) / 4;
        totalSizeInBytes += size;

        contentParts.push({
            inlineData: {
                mimeType: item.mimeType,
                data: item.base64Data
            }
        });
      } else if (item.textData) {
        contentParts.push({
            text: `[입력 텍스트 데이터]\n${item.textData}`
        });
      }
  }

  if (contentParts.length === 0) {
      throw new Error("분석할 데이터가 없습니다.");
  }

  if (totalSizeInBytes > MAX_BATCH_SIZE_BYTES) {
      throw new Error(`전체 파일 크기가 25MB를 초과했습니다 (${(totalSizeInBytes / (1024*1024)).toFixed(1)}MB). 파일을 나누어 업로드해주세요.`);
  }

  // Add the prompt instruction
  contentParts.push({
    text: `
      당신은 고성능 문서 분석 AI입니다. 
      제공된 ${contentParts.length}개의 파일(이미지, PDF) 또는 텍스트 데이터를 **전부** 분석해야 합니다.
      
      [필수 작업 지침]
      1. **다중 문서 처리**: 여러 개의 파일이 입력되었습니다. 각 파일의 내용을 개별적으로 분석하여 **각각 별도의 업무 일지 항목**으로 추출하세요.
         - 파일들이 서로 관련이 없다면 독립적인 객체로 만드세요.
         - 하나의 파일 안에 여러 골프장 정보가 있다면 그것도 분리하세요.
      
      2. **형식 준수**: 결과는 반드시 단일 **JSON 배열(Array)**로 반환해야 합니다.

      [골프장 식별 및 신규 생성 규칙 (Entity Resolution & Creation)]
      현재 데이터베이스에 등록된 골프장 목록: [${existingCourseNames.join(', ')}]
      
      1. courseName: 문서에 언급된 골프장 이름을 추출하세요.
         - **매칭 우선**: 문서의 골프장 이름이 위 목록 중 하나와 유사하다면(예: '스카이뷰' vs '스카이뷰 CC'), **반드시 목록에 있는 정확한 이름을 사용**하세요.
         - **신규 생성**: 목록에 없는 새로운 골프장이라면, 문서에 나온 이름을 그대로 사용하세요.

      [기본 정보 추출]
      2. title: 내용을 요약한 구체적인 제목.
      3. content: 업무 내용의 상세 본문을 가능한 누락 없이 추출하세요. 
      4. date: 날짜 (YYYY-MM-DD). 문서 내 날짜가 없으면 오늘.
      
      [스마트 분류 - 부서 및 태그]
      5. department: ('영업', '연구소', '건설사업', '컨설팅', '관리') 중 문맥에 맞게 추론.
      6. tags: 상황별 구체적 태그 5~7개.

      [상세 정보 추출]
      7. project_name: 구체적인 프로젝트/공사명 (없으면 null).
      8. contact_person: 해당 건의 핵심 담당자 (없으면 null).
      9. delivery_date: 마감 기한 (없으면 null).
      10. participants: 회의 참석자나 관련 인물 이름 목록 (Array).
      11. weather: 날씨 정보 (없으면 null).

      [심층 분석 (Deep Insights)]
      12. key_issues: 해당 건의 핵심 이슈 3~5가지.
      13. **summary_report**: (필수) 전체 내용을 3~4문장으로 요약한 보고서.

      [신규 골프장 정보 (New Course Only)]
      14. course_info: **기존 목록에 없는 새로운 골프장인 경우에만** 주소, 홀 수, 타입(회원제/대중제)을 추출.

      출력은 반드시 JSON 배열([]) 형식이어야 합니다.
    `
  });

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: contentParts
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                title: { type: Type.STRING, description: "문서 제목" },
                content: { type: Type.STRING, description: "업무 내용 상세 본문" },
                date: { type: Type.STRING, description: "날짜 (YYYY-MM-DD)" },
                department: { type: Type.STRING, description: "관련 부서" },
                courseName: { type: Type.STRING, description: "골프장 이름 (매칭된 표준명 또는 신규명)" },
                project_name: { type: Type.STRING, description: "프로젝트명", nullable: true },
                contact_person: { type: Type.STRING, description: "담당자", nullable: true },
                delivery_date: { type: Type.STRING, description: "기한", nullable: true },
                participants: { type: Type.ARRAY, items: { type: Type.STRING }, description: "참석자/관련자" },
                weather: { type: Type.STRING, description: "날씨", nullable: true },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "태그 목록" },
                key_issues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "핵심 이슈 및 리스크" },
                summary_report: { type: Type.STRING, description: "심층 요약 보고서" },
                course_info: {
                    type: Type.OBJECT,
                    properties: {
                        address: { type: Type.STRING, nullable: true },
                        holes: { type: Type.NUMBER, nullable: true },
                        type: { type: Type.STRING, nullable: true }
                    },
                    nullable: true,
                    description: "신규 골프장일 경우에만 채워짐"
                }
                },
                required: ["title", "content", "date", "department", "courseName", "tags", "summary_report"]
            }
          }
        }
      });
    });

    const text = response.text;
    
    if (!text && response.candidates?.[0]?.finishReason) {
        const reason = response.candidates[0].finishReason;
        if (reason === 'SAFETY') throw new Error("문서 내용이 안전 정책에 의해 차단되었습니다.");
        throw new Error(`AI 분석이 중단되었습니다 (사유: ${reason}).`);
    }

    if (!text) throw new Error("AI 응답이 비어있습니다.");
    
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      throw new Error("AI 응답 형식이 올바르지 않습니다.");
    }

    if (Array.isArray(parsedData)) {
        return parsedData.map(validateAnalyzedData);
    } else if (typeof parsedData === 'object') {
        return [validateAnalyzedData(parsedData)];
    } else {
        throw new Error("AI 응답 데이터 형식이 맞지 않습니다.");
    }

  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes("지원하지 않는") || msg.includes("파일 크기") || msg.includes("안전 정책")) throw error;
    if (msg.includes('413') || msg.includes('too large')) throw new Error("파일 크기가 너무 큽니다. (Server 413 Error)");
    if (msg.includes('400')) throw new Error("잘못된 요청입니다. (400 Error)");
    if (msg.includes('401') || msg.includes('403')) throw new Error("AI 서비스 권한 오류입니다. API Key를 확인하세요.");
    if (msg.includes('429')) throw new Error("요청 과부하입니다. 잠시 후 다시 시도하세요. (429 Error)");
    
    console.error("Unhandled Gemini Error:", error);
    throw new Error(`분석 중 오류 발생: ${msg.substring(0, 80)}...`);
  }
};

export interface AICourseDetails {
  address: string;
  holes: number;
  type: CourseType;
  grassType: GrassType;
  description: string;
  lat?: number;
  lng?: number;
}

export const getCourseDetailsFromAI = async (courseName: string): Promise<AICourseDetails> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key가 필요합니다.");
  }

  // Enhanced prompt to simulate Naver Maps lookup with GPS
  const prompt = `
    당신은 한국 골프장 데이터베이스 및 지도 전문가입니다. 
    "${courseName}"라는 골프장을 네이버 지도(Naver Maps)나 공식 웹사이트에서 검색한다고 가정하고, 다음 정보를 정확하게 추출해주세요.
    
    **정보를 찾을 수 없다면 가장 가능성 높은 정보를 추론하여 제공하세요.**

    요구사항:
    1. **주소**: 반드시 '도로명 주소'를 우선으로 찾아주세요. (예: 경기도 여주시 북내면 여양1로 500)
    2. **GPS 좌표**: 해당 주소의 대략적인 위도(lat)와 경도(lng)를 추정하여 제공하세요. (소수점 6자리까지)
    3. **홀 수**: 총 홀 수(Holes)를 정확히 기재하세요. (18, 27, 36 등). 모르면 18로 가정.
    4. **운영 형태**: '회원제'인지 '대중제(퍼블릭)'인지 구분하세요.
    5. **잔디 종류**: 한국잔디(중지/금잔디)인지 양잔디(벤트그라스/켄터키블루그라스)인지 확인하고, 모르면 '혼합'으로 하세요.
    6. **설명**: 골프장의 지형적 특징(산악형, 평지형, 링크스 등), 난이도, 주요 이슈를 2문장 내외로 요약하세요.

    Response Schema (JSON):
    {
      "address": "도로명 주소 (필수)",
      "lat": 위도(숫자),
      "lng": 경도(숫자),
      "holes": 숫자,
      "type": "회원제" 또는 "대중제",
      "grassType": "한국잔디", "벤트그라스", "캔터키블루그라스", 또는 "혼합",
      "description": "설명 텍스트"
    }
  `;

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
           responseSchema: {
            type: Type.OBJECT,
            properties: {
              address: { type: Type.STRING },
              lat: { type: Type.NUMBER },
              lng: { type: Type.NUMBER },
              holes: { type: Type.NUMBER },
              type: { type: Type.STRING },
              grassType: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ['address', 'holes', 'type', 'grassType', 'description']
          }
        }
      });
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const data = JSON.parse(text);

    // Map string values to enums safely
    const mapType = (t: string): CourseType => {
      if (t?.includes('회원')) return CourseType.MEMBER;
      return CourseType.PUBLIC;
    };

    const mapGrass = (g: string): GrassType => {
      if (g?.includes('벤트')) return GrassType.BENTGRASS;
      if (g?.includes('캔터키') || g?.includes('켄터키')) return GrassType.KENTUCKY;
      if (g?.includes('한국') || g?.includes('조이시아') || g?.includes('금잔디')) return GrassType.ZOYSIA;
      return GrassType.MIXED;
    };

    return {
      address: data.address || '주소 정보 없음',
      lat: data.lat || 37.5665,
      lng: data.lng || 126.9780,
      holes: data.holes || 18,
      type: mapType(data.type),
      grassType: mapGrass(data.grassType),
      description: data.description || '정보를 찾을 수 없습니다.'
    };

  } catch (error) {
    console.error("AI Course Search Error:", error);
    throw new Error("골프장 정보를 가져오는 데 실패했습니다.");
  }
};

/**
 * Searches through the application's stored data using Gemini AI.
 * Uses the fast 'gemini-2.5-flash-lite' model for quick lookups.
 */
export const searchAppWithAI = async (query: string, appContextData: {
  logs: LogEntry[],
  courses: GolfCourse[],
  people: Person[]
}): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key가 필요합니다.");
  }

  // Serialize the context data to a string format the AI can understand
  // Minimizing tokens by selecting only relevant fields could be an optimization,
  // but sending the JSON structure is usually efficient enough for this scale.
  const contextString = JSON.stringify({
    courses: appContextData.courses.map(c => ({ name: c.name, type: c.type, desc: c.description, issues: c.issues })),
    people: appContextData.people.map(p => ({ name: p.name, role: p.currentRole, courseId: p.currentCourseId, notes: p.notes })),
    recent_logs: appContextData.logs.slice(0, 30).map(l => ({ // Limit to recent 30 logs
      date: l.date,
      course: l.courseName,
      title: l.title,
      content: l.content
    }))
  });

  const todayDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const prompt = `
    You are an intelligent internal search engine for a Golf Course Management System (GreenMaster).
    The user is asking a question about their stored data (Logs, People, Golf Courses).
    
    [Current System Date]: ${todayDate} (Use this for relative date calculations like 'last week', 'yesterday', 'recent')
    [User Query]: "${query}"

    [Database Context]:
    ${contextString}

    [Instructions]:
    1. Search through the provided Database Context to find the answer.
    2. **Date Handling**: Carefully interpret relative dates (e.g., "recent 1 week", "last month") using [Current System Date].
    3. Answer strictly based on the provided data. Do not use outside knowledge unless it's general common sense.
    4. If the answer is found, summarize it clearly in Korean.
       - **Citation Requirement**: You MUST cite the source date and title for every fact. (e.g., "(출처: 2024-05-20 [제목])").
    5. If the information is not in the database, explicitly state: "시스템 데이터에서 관련 정보를 찾을 수 없습니다."
    6. Be concise and professional.
  `;

  try {
    const response = await retryOperation(async () => {
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest', // Using the fast model as requested
        contents: prompt,
      });
    });

    return response.text || "답변을 생성할 수 없습니다.";
  } catch (error) {
    console.error("AI Search Error:", error);
    throw new Error("AI 검색 중 오류가 발생했습니다.");
  }
};