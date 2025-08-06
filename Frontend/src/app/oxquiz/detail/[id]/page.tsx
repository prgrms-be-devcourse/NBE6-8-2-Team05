'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";

// 서버 응답 타입 정의
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 서버에서 보내는 새로운 DTO 구조
interface FactQuizWithHistoryDto {
  factQuizDto: {
    id: number;
    question: string;
    realNewsTitle: string;
    realNewsContent: string;
    fakeNewsContent: string;
    correctNewsType: 'REAL' | 'FAKE';
    quizType: string;
  };
  answer: string | null; // null이면 안 푼 퀴즈, 값이 있으면 푼 퀴즈
  correct: boolean;
  gainExp: number;
}

// 정답 제출 응답 DTO (서버 응답에 맞게 수정)
interface FactQuizAnswerDto {
  quizId: number;
  question: string;
  selectedNewsType: 'REAL' | 'FAKE';
  correctNewsType: 'REAL' | 'FAKE';
  correct: boolean; // isCorrect에서 correct로 변경
  gainExp: number;
  quizType: string;
}



export default function OxQuizDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const id = params.id as string;
  const [quizData, setQuizData] = useState<FactQuizWithHistoryDto | null>(null);
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answerResult, setAnswerResult] = useState<FactQuizAnswerDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isAReal, setIsAReal] = useState<boolean | null>(null);

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 사용자별 localStorage 키 생성 함수
  const getUserSpecificKey = (baseKey: string) => {
    const userName = user?.name || 'anonymous';
    return `${userName}_${baseKey}`;
  };

  // 퀴즈 데이터 가져오기
  const fetchQuizDetail = async (quizId: string) => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const url = `${API_BASE_URL}/api/quiz/fact/${quizId}`;
      
      console.log('퀴즈 상세 API 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      console.log('서버 응답 상태:', response.status, response.statusText);
      
      if (response.status === 401) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('퀴즈를 찾을 수 없습니다.');
        } else {
          throw new Error(`서버 응답 오류: ${response.status} ${response.statusText}`);
        }
      }
      
      const result: ApiResponse<FactQuizWithHistoryDto> = await response.json();

      
      if (result.code === 200) {
        setQuizData(result.data);
        
        // localStorage에서 저장된 뉴스 순서 확인
        const storageKey = getUserSpecificKey(`oxquiz_news_order_${quizId}`);
        const savedOrder = localStorage.getItem(storageKey);
        
        if (savedOrder !== null) {
          // 저장된 순서가 있으면 사용
          setIsAReal(savedOrder === 'true');
        } else {
          // 저장된 순서가 없으면 새로 생성하고 저장
          const newOrder = Math.random() < 0.5;
          setIsAReal(newOrder);
          localStorage.setItem(storageKey, newOrder.toString());
        }
      } else {
        throw new Error(result.message || '퀴즈 데이터를 가져오는데 실패했습니다.');
      }
      
    } catch (err) {
      console.error('퀴즈 상세 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 스크롤을 맨 위로 올리기
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 퀴즈 데이터 가져오기
  useEffect(() => {
    if (id) {
      fetchQuizDetail(id);
    }
  }, [id]);

  // 정답 제출
  const submitAnswer = async (selectedAnswer: 'A' | 'B') => {
    try {
      setSubmitted(true);
      // 선택한 뉴스가 진짜인지 가짜인지 판별
      let actualSelectedNewsType: 'REAL' | 'FAKE';
      if (isAReal === null) return;
      
      if (selectedAnswer === 'A') {
        // 뉴스 A를 선택한 경우
        actualSelectedNewsType = isAReal ? 'REAL' : 'FAKE';
      } else {
        // 뉴스 B를 선택한 경우
        actualSelectedNewsType = isAReal ? 'FAKE' : 'REAL';
      }
      
      
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const url = `${API_BASE_URL}/api/quiz/fact/submit/${id}?selectedNewsType=${actualSelectedNewsType}`;
      
      console.log('정답 제출 API 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      console.log('정답 제출 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`정답 제출 실패: ${response.status} ${response.statusText}`);
      }
      
      const result: ApiResponse<FactQuizAnswerDto> = await response.json();
      console.log('정답 제출 응답 데이터:', result);
      
                   if (result.code === 200) {
        setAnswerResult(result.data);
        
        // 퀴즈 완료 상태를 localStorage에 저장
        const completedKey = getUserSpecificKey(`oxquiz_completed_${id}`);
        localStorage.setItem(completedKey, 'true');
        
      } else {
        throw new Error(result.message || '정답 제출에 실패했습니다.');
      }
      
    } catch (err) {
      console.error('정답 제출 오류:', err);
      setError(err instanceof Error ? err.message : '정답 제출 중 오류가 발생했습니다.');
      setSubmitted(false);
    }
  };

  // 결과 메시지 생성
  const getResultMessage = (correct: boolean, correctNewsType: 'REAL' | 'FAKE', question: string) => {
    if (isAReal === null) return '';
    
    if (question.includes('가짜 뉴스')) {
      // "다음 중 가짜 뉴스는?" 질문인 경우
      const fakeNews = isAReal ? '뉴스 B' : '뉴스 A';
      return `가짜 뉴스는 ${fakeNews}입니다.`;
    } else {
      // "다음 중 진짜 뉴스는?" 질문인 경우
      const realNews = isAReal ? '뉴스 A' : '뉴스 B';
      return `진짜 뉴스는 ${realNews}입니다.`;
    }
  };

  const handleSubmit = () => {
    if (!selected || !quizData) return;
    submitAnswer(selected);
  };

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

  // 로그인이 필요한 경우
  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50 px-4 pt-60">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-4">로그인이 필요합니다</div>
            <div className="text-gray-600 mb-6">로그인하고 OX퀴즈에 도전해보세요!</div>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/oxquiz/detail/${id}`)}`)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
              >
                로그인하기
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                메인페이지로 돌아가기
              </button>
            </div>
          </div>
        </div>
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
                onClick={() => router.push('/oxquiz')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                OX퀴즈 목록으로 돌아가기
              </button>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50/50 via-purple-50/50 to-indigo-100/50 px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">퀴즈를 찾을 수 없습니다</div>
          <div className="text-gray-500 mb-6">요청하신 퀴즈를 찾을 수 없습니다.</div>
          <button
            onClick={() => router.push('/oxquiz')}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-colors"
          >
            OX퀴즈 목록으로 돌아가기
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

        {/* OX 퀴즈 상세 섹션 */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-8">
                {/* 뒤로가기 버튼 */}
                <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => router.push('/oxquiz')}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                    <span className="font-semibold">OX퀴즈 목록</span>
              </button>
            </div>

                {/* 퀴즈 제목과 질문 */}
                <div className="text-center mb-8">
                  <div className="text-2xl font-bold text-gray-900 mb-4">{quizData.factQuizDto.realNewsTitle}</div>
                  <div className="text-lg font-semibold text-indigo-600 mb-6">{quizData.factQuizDto.question}</div>
                  <div className="w-full h-0.5 bg-gray-200"></div>
                </div>

                {/* 이미 푼 퀴즈인 경우 결과 표시 */}
                {quizData.answer !== null && (
                  <div className="space-y-6">
                                         <div className="space-y-6">
                                              <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 relative ${
                         // 사용자가 뉴스 A를 선택했을 가능성이 높은 경우 테두리 표시
                         (isAReal === false && quizData.answer === 'FAKE') || (isAReal === true && quizData.answer === 'REAL')
                           ? (quizData.correct ? 'border-green-500' : 'border-red-300')
                           : 'border-gray-200'
                       }`}>
                         {/* 이미 푼 퀴즈 오버레이 효과 */}
                         {((isAReal === false && quizData.answer === 'FAKE') || (isAReal === true && quizData.answer === 'REAL')) && (
                           <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl"></div>
                         )}
                         <div className="font-semibold text-indigo-600 mb-4 text-lg bg-white p-3 rounded-lg text-center">뉴스 A</div>
                         <div className="text-base text-gray-900 whitespace-pre-line leading-relaxed">
                           {isAReal === true ? quizData.factQuizDto.realNewsContent : quizData.factQuizDto.fakeNewsContent}
                         </div>
                       </div>
                                                <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 relative ${
                           // 사용자가 뉴스 B를 선택했을 가능성이 높은 경우 테두리 표시
                           (isAReal === true && quizData.answer === 'FAKE') || (isAReal === false && quizData.answer === 'REAL')
                             ? (quizData.correct ? 'border-green-500' : 'border-red-300')
                             : 'border-gray-200'
                         }`}>
                           {/* 이미 푼 퀴즈 오버레이 효과 */}
                           {((isAReal === true && quizData.answer === 'FAKE') || (isAReal === false && quizData.answer === 'REAL')) && (
                             <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl"></div>
                           )}
                           <div className="font-semibold text-indigo-600 mb-4 text-lg bg-white p-3 rounded-lg text-center">뉴스 B</div>
                           <div className="text-base text-gray-900 whitespace-pre-line leading-relaxed">
                             {isAReal === true ? quizData.factQuizDto.fakeNewsContent : quizData.factQuizDto.realNewsContent}
                           </div>
                </div>
             </div>

                                         {/* 결과 표시 */}
                     <div className="text-center mt-8">
                       <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${quizData.correct ? 'bg-green-100' : 'bg-red-100'}`}>
                         <span className={`text-2xl ${quizData.correct ? 'text-green-600' : 'text-red-600'}`}>
                           {quizData.correct ? '✓' : '✗'}
                 </span>
               </div>
                       <div className={`text-xl font-bold mb-2 ${quizData.correct ? 'text-green-700' : 'text-red-700'}`}>
                         {quizData.correct ? '정답입니다!' : '오답입니다'}
                       </div>
                       <div className="text-lg text-gray-700 mb-4">
                         {getResultMessage(quizData.correct, quizData.factQuizDto.correctNewsType, quizData.factQuizDto.question)}
               </div>
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">얻은 경험치</div>
                         <div className="text-2xl font-bold text-indigo-600">+{quizData.gainExp}점</div>
              </div>
                       <div className="flex items-center justify-end gap-3">
                         <div className="text-sm text-gray-600">
                           이미 푼 퀴즈입니다.
            </div>
               <button
                 onClick={() => router.push('/oxquiz')}
                           className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-semibold"
               >
                           OX퀴즈 목록
               </button>
             </div>
          </div>
        </div>
                )}

                {/* 아직 안 푼 퀴즈인 경우 선택 UI */}
                {quizData.answer === null && (
                  <div className="space-y-6">
                                         <div className="space-y-6">
                                                           <button
                          onClick={() => !submitted && setSelected('A')}
                          disabled={submitted}
                          className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 transition-all duration-300 text-left relative ${
                            !submitted ? 'cursor-pointer transform hover:scale-[1.01] hover:from-indigo-100 hover:to-purple-100' : ''
                          } ${
                            !submitted && selected === 'A' ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200'
                          } ${
                            submitted && selected === 'A' && answerResult?.correct ? 'border-green-500' : ''
                          } ${
                            submitted && selected === 'A' && !answerResult?.correct ? 'border-red-300' : ''
                          }`}
                        >
                          {/* 선택 오버레이 효과 */}
                          {selected === 'A' && (
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl"></div>
                          )}
                         <div className="font-semibold text-indigo-600 mb-4 text-lg bg-white p-3 rounded-lg text-center">뉴스 A</div>
                         <div className="text-base text-gray-900 whitespace-pre-line leading-relaxed">
                           {isAReal === true ? quizData.factQuizDto.realNewsContent : quizData.factQuizDto.fakeNewsContent}
            </div>
                       </button>
                                                                                              <button
                          onClick={() => !submitted && setSelected('B')}
                          disabled={submitted}
                          className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 transition-all duration-300 text-left relative ${
                            !submitted ? 'cursor-pointer transform hover:scale-[1.01] hover:from-indigo-100 hover:to-purple-100' : ''
                          } ${
                            !submitted && selected === 'B' ? 'border-indigo-500 bg-indigo-100' : 'border-gray-200'
                          } ${
                            submitted && selected === 'B' && answerResult?.correct ? 'border-green-500' : ''
                          } ${
                            submitted && selected === 'B' && !answerResult?.correct ? 'border-red-300' : ''
                          }`}
                        >
                          {/* 선택 오버레이 효과 */}
                          {selected === 'B' && (
                            <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl"></div>
                          )}
                         <div className="font-semibold text-indigo-600 mb-4 text-lg bg-white p-3 rounded-lg text-center">뉴스 B</div>
                         <div className="text-base text-gray-900 whitespace-pre-line leading-relaxed">
                           {isAReal === true ? quizData.factQuizDto.fakeNewsContent : quizData.factQuizDto.realNewsContent}
                         </div>
                       </button>
                     </div>

                    {/* 제출 버튼 */}
          {!submitted && (
                      <div className="text-center mt-8">
            <button
              onClick={handleSubmit}
              disabled={!selected}
                          className={`px-8 py-4 rounded-full font-bold text-lg shadow transition-all transform hover:scale-105 ${
                            selected ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
            >
              제출
            </button>
                      </div>
          )}
          
                    {/* 결과 표시 */}
          {submitted && answerResult && (
                      <div className="text-center mt-8">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${answerResult.correct ? 'bg-green-100' : 'bg-red-100'}`}>
                 <span className={`text-2xl ${answerResult.correct ? 'text-green-600' : 'text-red-600'}`}>
                   {answerResult.correct ? '✓' : '✗'}
                 </span>
               </div>
               <div className={`text-xl font-bold mb-2 ${answerResult.correct ? 'text-green-700' : 'text-red-700'}`}>
                 {answerResult.correct ? '정답입니다!' : '오답입니다'}
               </div>
               <div className="text-lg text-gray-700 mb-4">
                 {getResultMessage(answerResult.correct, answerResult.correctNewsType, quizData.factQuizDto.question)}
               </div>
               <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                 <div className="text-sm text-gray-500 mb-1">얻은 경험치</div>
                          <div className="text-2xl font-bold text-indigo-600">+{answerResult.gainExp}점</div>
               </div>
               <div className="flex items-center justify-end gap-3">
                 <div className="text-sm text-gray-600">
                             OX퀴즈 목록으로 돌아가서 다른 퀴즈를 풀어보세요!
                 </div>
                 <button
                   onClick={() => router.push('/oxquiz')}
                             className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-semibold"
                 >
                             OX퀴즈 목록
                 </button>
               </div>
            </div>
          )}
        </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 