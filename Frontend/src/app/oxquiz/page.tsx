'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// NewsCategory enum (서버와 일치)
enum NewsCategory {
  POLITICS = 'POLITICS',
  ECONOMY = 'ECONOMY', 
  SOCIETY = 'SOCIETY',
  CULTURE = 'CULTURE',
  IT = 'IT'
}

// 카테고리 매핑
const categoryMap = {
  [NewsCategory.POLITICS]: '정치',
  [NewsCategory.ECONOMY]: '경제',
  [NewsCategory.SOCIETY]: '사회',
  [NewsCategory.CULTURE]: '문화',
  [NewsCategory.IT]: 'IT'
};

// 카테고리 옵션
const categoryOptions = [
  { id: 'all', name: '전체', value: null },
  { id: NewsCategory.POLITICS, name: '정치', value: NewsCategory.POLITICS },
  { id: NewsCategory.ECONOMY, name: '경제', value: NewsCategory.ECONOMY },
  { id: NewsCategory.SOCIETY, name: '사회', value: NewsCategory.SOCIETY },
  { id: NewsCategory.CULTURE, name: '문화', value: NewsCategory.CULTURE },
  { id: NewsCategory.IT, name: 'IT', value: NewsCategory.IT },
];

// FactQuiz 타입 정의
interface FactQuiz {
  id: number;
  question: string;
  realNewsTitle: string;
  newsCategory?: string; // 서버에서 카테고리 정보를 보내주는 경우
}

// API 응답 타입
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export default function OxQuizMainPage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quizzes, setQuizzes] = useState<FactQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 퀴즈 데이터 가져오기
  const fetchQuizzes = async (category?: NewsCategory) => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      let url = `${API_BASE_URL}/api/quiz/fact`;
      if (category) {
        url += `/category?category=${category}`;
      }
      
      console.log('API 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log('서버 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('서버 응답 데이터:', result);
      
      if (result.code === 200) {
        // 서버에서 받은 데이터를 FactQuiz 형태로 매핑
        const quizData = result.data.map((item: any) => ({
          id: item.id,
          question: item.question,
          realNewsTitle: item.realNewsTitle,
          newsCategory: item.newsCategory
        }));
        
        setQuizzes(quizData);
      } else {
        throw new Error(result.message || '퀴즈 데이터를 가져오는데 실패했습니다.');
      }
      
    } catch (err) {
      console.error('퀴즈 데이터 가져오기 오류:', err);
      
      // 더 명확한 오류 메시지 제공
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
      } else if (err instanceof Error) {
        if (err.message.includes('500')) {
          errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (err.message.includes('404')) {
          errorMessage = '요청한 데이터를 찾을 수 없습니다.';
        } else if (err.message.includes('401')) {
          errorMessage = '로그인이 필요합니다.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 스크롤을 맨 위로 올리기
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 페이지 로드 시 전체 퀴즈 데이터 가져오기
  useEffect(() => {
    fetchQuizzes();
  }, []);

  // 카테고리 변경 시 퀴즈 데이터 다시 가져오기
  useEffect(() => {
    if (selectedCategory === 'all') {
      fetchQuizzes();
    } else {
      const category = selectedCategory as NewsCategory;
      fetchQuizzes(category);
    }
  }, [selectedCategory]);

  // 사용자별 localStorage 키 생성 함수
  const getUserSpecificKey = (baseKey: string) => {
    const userName = user?.name || 'anonymous';
    return `${userName}_${baseKey}`;
  };

  // 퀴즈 완료 상태 확인 함수
  const isQuizCompleted = (quizId: number) => {
    const key = getUserSpecificKey(`oxquiz_completed_${quizId}`);
    return localStorage.getItem(key) === 'true';
  };

  // 페이지 포커스 시 퀴즈 상태 업데이트
  useEffect(() => {
    const handleFocus = () => {
      setQuizzes(prev => [...prev]);
    };
    
    const handleStorageChange = () => {
      setQuizzes(prev => [...prev]);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 스크롤에 따른 배경 투명도 계산
  const backgroundOpacity = Math.max(0.1, 1 - (scrollY / 1000));

  if (loading) {
  return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/50 via-purple-50/50 to-indigo-100/50">
        <div className="text-2xl font-bold text-gray-900 mb-4">OX 퀴즈를 불러오는 중...</div>
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/50 via-purple-50/50 to-indigo-100/50 px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</div>
          <div className="text-gray-600 mb-6">{error}</div>
            <button 
              onClick={() => {
                if (selectedCategory === 'all') {
                  fetchQuizzes();
                } else {
                  const category = selectedCategory as NewsCategory;
                  fetchQuizzes(category);
                }
              }}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen relative">
      {/* 전체 배경 */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-indigo-100/50 transition-opacity duration-300"
        style={{ opacity: backgroundOpacity }}
      ></div>
      
      {/* 배경 패턴 */}
      <div 
        className="fixed inset-0 opacity-10 transition-opacity duration-300"
        style={{ opacity: 0.1 * backgroundOpacity }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10">
        {/* Hero Section - OX 퀴즈 소개 */}
        <section className="pt-12 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* 메인 헤드라인 */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  OX 퀴즈
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  AI를 통해 가짜뉴스를 생성하여, AI가 생성한 가짜뉴스와 진짜뉴스 중 정답을 고르는 퀴즈입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* OX 퀴즈 섹션 */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-8">
                {/* 카테고리 필터 */}
                <div className="flex flex-wrap gap-4 justify-center mb-8">
                  {categoryOptions.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-6 py-3 rounded-full border text-base font-semibold shadow transition-all duration-300 transform hover:scale-105
                        ${selectedCategory === cat.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

        {/* 퀴즈 목록 */}
          <div className="w-full">
            {quizzes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">
                  {selectedCategory === 'all' ? '퀴즈가 없습니다.' : '해당 카테고리의 퀴즈가 없습니다.'}
                </div>
                <div className="text-gray-300 text-sm">다른 카테고리를 선택해보세요!</div>
              </div>
            )}
            
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {quizzes.map((quiz, index) => (
                <button
                  key={quiz.id}
                  onClick={() => router.push(`/oxquiz/detail/${quiz.id}`, { scroll: false })}
                        className="group relative bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02] border-2 border-indigo-200 hover:border-indigo-400 text-left h-80"
                >
                  
                  {/* 퀴즈 순서 */}
                  <div className="absolute top-4 left-4 z-10">
                          <span className="text-sm font-bold text-indigo-600 bg-white px-3 py-1 rounded-full shadow-sm">
                            퀴즈 {index + 1}
                    </span>
                  </div>
                  
                  {/* 퀴즈 내용 */}
                  <div className="p-6 pt-16 flex flex-col h-full">
                    
                    {/* 기사 제목 - 중앙 정렬 */}
                          <div className="text-center mb-4">
                      <div className="inline-block">
                              <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors leading-tight px-4 py-2 bg-white border-2 border-indigo-200 rounded-xl shadow-sm line-clamp-2">
                          {quiz.realNewsTitle}
                        </h3>
                      </div>
                    </div>
                    
                    {/* 퀴즈 질문과 화살표 */}
                          <div className="flex items-center justify-between mt-auto pt-4">
                            <span className={`text-xs ${isQuizCompleted(quiz.id) ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                              {isQuizCompleted(quiz.id) ? '퀴즈 완료' : '아직 풀지 않음'}
                            </span>
                      <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700 line-clamp-1">
                          {quiz.question}
                        </span>
                              <span className="text-indigo-600 text-2xl font-black group-hover:text-purple-600 transition-colors -mt-1">
                          →
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 호버 효과 */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                </button>
              ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 