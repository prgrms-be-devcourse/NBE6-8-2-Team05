"use client";
import { useEffect, useState } from "react";
import { FaRegNewspaper } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";

// 서버에서 받는 퀴즈 정보
interface DetailQuizResDto {
  id: number;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  correctOption: "OPTION1" | "OPTION2" | "OPTION3";
}

// 서버에서 받는 퀴즈 + 히스토리 정보
interface DetailQuizWithHistory {
  detailQuizResDto: DetailQuizResDto;
  answer: string | null; // null이면 안 푼 퀴즈, null이 아니면 이미 푼 퀴즈
  correct: boolean; // 서버에서 correct로 오므로 맞춤
  gainExp: number;
  quizType: string;
}

// 퀴즈 제출 후 서버에서 받는 응답
interface DetailQuizAnswerDto {
  quizId: number;
  question: string;
  correctOption: "OPTION1" | "OPTION2" | "OPTION3";
  selectedOption: "OPTION1" | "OPTION2" | "OPTION3";
  isCorrect: boolean;
  gainExp: number;
  quizType: string;
}

export default function NewsQuizPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const params = useParams();
  const router = useRouter();
  const newsId = params.id;
  const [quizzes, setQuizzes] = useState<DetailQuizWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [quizId: number]: 'OPTION1' | 'OPTION2' | 'OPTION3' }>({});
  const [submitting, setSubmitting] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // 뉴스 제목도 API로 받아오고 싶으면 추가 fetch 필요
  const [newsTitle, setNewsTitle] = useState<string>("");

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 상세 퀴즈 조회 (뉴스 ID로 조회)
  useEffect(() => {
    if (!newsId) return;
    const fetchDetailQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/quiz/detail/news/${newsId}`, {
          credentials: 'include',
        });
        
        if (res.status === 401) {
          setIsUnauthorized(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error('상세 퀴즈를 가져오는데 실패했습니다.');
        }

        const result = await res.json();
        console.log('퀴즈 API 응답:', result);
        if (result.code === 200) {
          console.log('퀴즈 데이터:', result.data);
          
          // 서버에서 DetailQuizResDto 배열을 받았으므로, 각 퀴즈의 히스토리를 개별 조회
          const quizList = result.data;
          const quizzesWithHistory: DetailQuizWithHistory[] = [];
          
          for (const quiz of quizList) {
          try {
            const historyRes = await fetch(`/api/quiz/detail/${quiz.id}`, {
              credentials: 'include',
            });
              
            if (historyRes.ok) {
                 const historyResult = await historyRes.json();
                 console.log(`퀴즈 ${quiz.id} 히스토리 응답:`, historyResult);
                 if (historyResult.code === 200) {
                   console.log(`퀴즈 ${quiz.id} 히스토리 데이터:`, historyResult.data);
                   quizzesWithHistory.push(historyResult.data);
                 } else {
                   console.log(`퀴즈 ${quiz.id} 히스토리 없음, 기본값 설정`);
                   // 히스토리가 없으면 기본값으로 설정
                   quizzesWithHistory.push({
                     detailQuizResDto: quiz,
                     answer: null,
                     correct: false,
                     gainExp: 0,
                     quizType: 'DETAIL'
                   });
                 }
               } else {
                 console.log(`퀴즈 ${quiz.id} 히스토리 조회 실패, 기본값 설정`);
                 // 히스토리 조회 실패 시에도 기본값으로 설정
                 quizzesWithHistory.push({
                   detailQuizResDto: quiz,
                   answer: null,
                   correct: false,
                   gainExp: 0,
                   quizType: 'DETAIL'
                 });
               }
            } catch (error) {
               console.error(`퀴즈 ${quiz.id} 히스토리 조회 중 오류:`, error);
               // 오류 발생 시에도 기본값으로 설정
               quizzesWithHistory.push({
                 detailQuizResDto: quiz,
                 answer: null,
                 correct: false,
                 gainExp: 0,
                 quizType: 'DETAIL'
               });
            }
          }
          
          setQuizzes(quizzesWithHistory);
        } else {
           throw new Error(result.message || '퀴즈 데이터를 가져오는데 실패했습니다.');
         }
       } catch (e: any) {
         console.error('퀴즈 조회 오류:', e);
         setError(e.message || '알 수 없는 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
     
    fetchDetailQuizzes();
   }, [newsId]);

  // 뉴스 제목 가져오기
  useEffect(() => {
    if (!newsId) return;
    const fetchNewsTitle = async () => {
      try {
        const res = await fetch(`/api/news/${newsId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.code === 200 && result.data) {
            setNewsTitle(result.data.title);
          }
        }
      } catch (error) {
        console.error('뉴스 제목 조회 오류:', error);
      }
    };
    
    fetchNewsTitle();
  }, [newsId]);

  const submitQuiz = async (quizId: number, selectedOption: 'OPTION1' | 'OPTION2' | 'OPTION3'): Promise<DetailQuizAnswerDto> => {
    const res = await fetch(`/api/quiz/detail/submit/${quizId}?selectedOption=${selectedOption}`, {
        method: 'POST',
        credentials: 'include',
      });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('퀴즈 제출 오류:', res.status, errorText);
      throw new Error(`퀴즈 제출 실패: ${res.status} ${errorText}`);
    }

    const result = await res.json();
    
    
    if (result.code !== 200) {
        throw new Error(result.message || '퀴즈 제출에 실패했습니다.');
    }

    return result.data;
  };

  const submitAllQuizzes = async () => {
    if (Object.keys(answers).length === 0) {
      alert('답을 선택해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // 아직 푸지 않은 퀴즈만 제출 (더 엄격한 필터링)
      const unsolvedQuizzes = quizzes.filter(q => !isQuizSolved(q));
      
      if (unsolvedQuizzes.length === 0) {
        alert('이미 모든 퀴즈를 완료했습니다.');
        return;
      }
      
      for (const quizData of unsolvedQuizzes) {
        const quizId = quizData.detailQuizResDto.id;
        const selectedOption = answers[quizId];
        
        // 추가 검증: 이미 푼 퀴즈는 건너뛰기
        if (selectedOption && !isQuizSolved(quizData)) {
          try {
            await submitQuiz(quizId, selectedOption);
          } catch (error) {
            console.error(`퀴즈 ${quizId} 제출 실패:`, error);
            // 개별 퀴즈 실패 시에도 계속 진행
          }
        }
      }

      // 퀴즈 제출 후 데이터 다시 로드
      if (newsId) {
        const refreshRes = await fetch(`/api/quiz/detail/news/${newsId}`, {
          credentials: 'include',
        });
        if (refreshRes.ok) {
          const refreshResult = await refreshRes.json();
          if (refreshResult.code === 200) {
            // 서버에서 DetailQuizResDto 배열을 받았으므로, 각 퀴즈의 히스토리를 개별 조회
            const quizList = refreshResult.data;
            const quizzesWithHistory: DetailQuizWithHistory[] = [];
            
            for (const quiz of quizList) {
              try {
                const historyRes = await fetch(`/api/quiz/detail/${quiz.id}`, {
            credentials: 'include',
          });

                if (historyRes.ok) {
                  const historyResult = await historyRes.json();
                  if (historyResult.code === 200) {
                    quizzesWithHistory.push(historyResult.data);
                  } else {
                    // 히스토리가 없으면 기본값으로 설정
                    quizzesWithHistory.push({
                      detailQuizResDto: quiz,
                      answer: null,
                      correct: false,
                      gainExp: 0,
                      quizType: 'DETAIL'
                    });
                  }
                } else {
                  // 히스토리 조회 실패 시에도 기본값으로 설정
                  quizzesWithHistory.push({
                    detailQuizResDto: quiz,
                    answer: null,
                    correct: false,
                    gainExp: 0,
                    quizType: 'DETAIL'
                  });
                }
        } catch (error) {
                console.error(`퀴즈 ${quiz.id} 히스토리 조회 중 오류:`, error);
                // 오류 발생 시에도 기본값으로 설정
                quizzesWithHistory.push({
                  detailQuizResDto: quiz,
                  answer: null,
                  correct: false,
                  gainExp: 0,
                  quizType: 'DETAIL'
                });
              }
            }
            
            setQuizzes(quizzesWithHistory);
            setAnswers({}); // 답변 상태 초기화
          }
        }
      }
    } catch (error) {
      console.error('퀴즈 제출 중 오류:', error);
      alert('퀴즈 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOptionText = (quiz: DetailQuizResDto, option: 'OPTION1' | 'OPTION2' | 'OPTION3') => {
    switch (option) {
      case 'OPTION1': return quiz.option1;
      case 'OPTION2': return quiz.option2;
      case 'OPTION3': return quiz.option3;
      default: return '';
    }
  };

  const getOptionLabel = (option: 'OPTION1' | 'OPTION2' | 'OPTION3') => {
    switch (option) {
      case 'OPTION1': return 'A';
      case 'OPTION2': return 'B';
      case 'OPTION3': return 'C';
      default: return '';
    }
  };

  // 이미 푼 퀴즈인지 확인
  const isQuizSolved = (quiz: DetailQuizWithHistory) => {
    return quiz.answer !== null;
  };

  // 모든 퀴즈를 푼 상태인지 확인
  const isAllQuizzesSolved = () => {
    return quizzes.filter(quiz => quiz.detailQuizResDto).every(quiz => isQuizSolved(quiz));
  };

  // 스크롤에 따른 배경 투명도 계산
  const backgroundOpacity = Math.max(0.1, 1 - (scrollY / 1000));

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50">
        <div className="text-2xl font-bold text-gray-900 mb-4">상세 퀴즈를 불러오는 중...</div>
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
            <div className="text-gray-600 mb-6">로그인하고 상세퀴즈에 도전해보세요!</div>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/news/${newsId}/quiz`)}`)}
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

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50 px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
        </div>
    );
  }

  // 모든 퀴즈를 푼 상태인 경우 결과 화면 표시
  if (isAllQuizzesSolved()) {
    return (
      <div className="font-sans min-h-screen relative">
        {/* 전체 배경 */}
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-blue-100/50 transition-opacity duration-300"></div>
        
        {/* 배경 패턴 */}
        <div className="fixed inset-0 opacity-10 transition-opacity duration-300">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        {/* 콘텐츠 */}
        <div className="relative z-10">
          {/* Hero Section - 상세 퀴즈 소개 */}
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
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              상세 퀴즈
            </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    뉴스 기사의 내용을 바탕으로 상세퀴즈를 출제합니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 퀴즈 결과 섹션 */}
          <section className="pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                {/* 퀴즈 결과 */}
                <div className="p-8">
                  <div className="space-y-8">
          {quizzes.map((quizData, idx) => {
            const quiz = quizData.detailQuizResDto;
            
            // quiz가 undefined인 경우 건너뛰기
            if (!quiz) {
              return null;
            }
            
                         const userAnswer = quizData.answer as 'OPTION1' | 'OPTION2' | 'OPTION3';
             const isCorrect = quizData.correct;
             
              return (
                        <div key={quiz.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                          <div className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  {quiz.question}
                    </div>
                <div className="grid grid-cols-1 gap-3">
                  {(['OPTION1', 'OPTION2', 'OPTION3'] as const).map((option) => {
                    const isUser = userAnswer === option;
                    const isCorrectOption = quiz.correctOption === option;
                    const optionText = getOptionText(quiz, option);
                    const optionLabel = getOptionLabel(option);
                    
                        return (
                      <div
                        key={option}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isUser && !isCorrect 
                            ? "border-red-300 bg-red-50" 
                            : isCorrectOption 
                            ? "border-green-300 bg-green-50" 
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isUser && !isCorrect 
                              ? "bg-red-500 text-white" 
                              : isCorrectOption 
                              ? "bg-green-500 text-white" 
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {optionLabel}
                          </div>
                          <span className={`font-medium ${
                            isUser && !isCorrect 
                              ? "text-red-700" 
                              : isCorrectOption 
                              ? "text-green-700" 
                              : "text-gray-700"
                          }`}>
                            {optionText}
                          </span>
                          {isUser && !isCorrect && (
                            <span className="ml-auto text-red-500 font-bold">✗</span>
                          )}
                          {isCorrectOption && (
                            <span className="ml-auto text-green-500 font-bold">✓</span>
                          )}
                        </div>
                      </div>
                        );
                      })}
                    </div>
                <div className="mt-3 text-center">
                  <span className={`text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? `정답!` : '오답'}
                  </span>
                    </div>
                  </div>
              );
            })}
                  </div>

                  {/* 결과 요약 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 mt-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">총 정답</div>
                        <div className="text-2xl font-bold text-blue-600">
                 {quizzes.length}개 중 {quizzes.filter(q => q.detailQuizResDto && q.correct).length}개
               </div>
              </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">상세 퀴즈 경험치</div>
                        <div className="text-2xl font-bold text-indigo-600">
                +{quizzes.filter(q => q.detailQuizResDto).reduce((sum, q) => sum + (Number(q.gainExp) || 0), 0)}점
                        </div>
              </div>
            </div>
          </div>

                  {/* 메인페이지 이동 버튼 */}
                  <div className="text-center">
            <button
              onClick={() => {
                router.push('/');
                window.scrollTo(0, 0);
              }}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              메인페이지로 이동
            </button>
          </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // 퀴즈 데이터가 없는 경우 처리
  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50 px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">상세 퀴즈가 없습니다</div>
          <div className="text-gray-500 mb-6">해당 뉴스에 대한 상세 퀴즈가 준비되지 않았습니다.</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-colors"
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
        className="fixed inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-blue-100/50 transition-opacity duration-300"
        style={{ opacity: backgroundOpacity }}
      ></div>
      
      {/* 배경 패턴 */}
      <div 
        className="fixed inset-0 opacity-10 transition-opacity duration-300"
        style={{ opacity: 0.1 * backgroundOpacity }}
      >
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10">
        {/* Hero Section - 상세 퀴즈 소개 */}
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
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  상세 퀴즈
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  해당 뉴스 기사의 내용을 바탕으로 상세퀴즈를 출제합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 퀴즈 섹션 */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* 퀴즈 섹션 */}
              <div className="p-8">
                {/* 진행 상황 표시 - 아직 퀴즈를 제출하지 않은 경우에만 표시 */}
                {!isAllQuizzesSolved() && (
                  <div className="w-full mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">진행 상황</span>
                      <span className="text-sm font-semibold text-blue-600">
              {Object.keys(answers).length} / {quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length ? (Object.keys(answers).length / quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
                )}
        
                <div className="space-y-8">
          {quizzes.map((quizData, idx) => {
            const quiz = quizData.detailQuizResDto;
            
            // quiz가 undefined인 경우 건너뛰기
            if (!quiz) {
              return null;
            }
            
            const isSolved = isQuizSolved(quizData);
            const isAnswered = answers[quiz.id];
            
                         // 이미 푼 퀴즈인 경우 결과 표시
             if (isSolved) {
               const userAnswer = quizData.answer as 'OPTION1' | 'OPTION2' | 'OPTION3';
               const isCorrect = quizData.correct;
              
              return (
                        <div key={quiz.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <div className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    {quiz.question}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {(['OPTION1', 'OPTION2', 'OPTION3'] as const).map((option) => {
                      const isUser = userAnswer === option;
                      const isCorrectOption = quiz.correctOption === option;
                      const optionText = getOptionText(quiz, option);
                      const optionLabel = getOptionLabel(option);
                      
                      return (
                        <div
                          key={option}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            isUser && !isCorrect 
                              ? "border-red-300 bg-red-50" 
                              : isCorrectOption 
                              ? "border-green-300 bg-green-50" 
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isUser && !isCorrect 
                                ? "bg-red-500 text-white" 
                                : isCorrectOption 
                                ? "bg-green-500 text-white" 
                                : "bg-gray-200 text-gray-600"
                            }`}>
                              {optionLabel}
                            </div>
                            <span className={`font-medium ${
                              isUser && !isCorrect 
                                ? "text-red-700" 
                                : isCorrectOption 
                                ? "text-green-700" 
                                : "text-gray-700"
                            }`}>
                              {optionText}
                            </span>
                            {isUser && !isCorrect && (
                              <span className="ml-auto text-red-500 font-bold">✗</span>
                            )}
                            {isCorrectOption && (
                              <span className="ml-auto text-green-500 font-bold">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-center">
                    <span className={`text-sm font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {isCorrect ? `정답!` : '오답'}
                    </span>
                  </div>
                </div>
              );
            }
            
            // 아직 안 푼 퀴즈인 경우 선택 가능한 UI 표시
            return (
                      <div key={quiz.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="font-bold text-lg mb-4 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  {quiz.question}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {(['OPTION1', 'OPTION2', 'OPTION3'] as const).map((option) => {
                    const isSelected = answers[quiz.id] === option;
                    const optionText = getOptionText(quiz, option);
                    const optionLabel = getOptionLabel(option);
                  
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          setAnswers(prev => ({ ...prev, [quiz.id]: option }));
                        }}
                        disabled={false}
                                className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md hover:border-blue-300 ${
                          isSelected 
                                    ? "border-blue-600 bg-blue-100" 
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            isSelected 
                                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" 
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {optionLabel}
                          </div>
                          <span className={`font-medium ${
                            isSelected 
                                      ? "text-blue-700" 
                              : "text-gray-700"
                          }`}>
                            {optionText}
                </span>
                    </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
            </div>
        
        {/* 제출 버튼 */}
                <div className="mt-8 text-center">
                <button
                    className={`px-8 py-4 rounded-full font-bold text-lg shadow transition-all ${
                      Object.keys(answers).length === quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length && 
                      quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length > 0 && 
                      !submitting
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={submitAllQuizzes}
                    disabled={
                      Object.keys(answers).length !== quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length || 
                      quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length === 0 || 
                      submitting
                    }
        >
          {submitting 
            ? "제출 중..." 
                      : quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length === 0
                        ? "모든 퀴즈 완료"
            : Object.keys(answers).length === quizzes.filter(q => q.detailQuizResDto && !isQuizSolved(q)).length
              ? "퀴즈 제출하기" 
              : "모든 문제를 풀어주세요"
          }
                </button>
                </div>
              </div>
            </div>
          </div>
        </section>
              </div>
      </div>
  );
} 