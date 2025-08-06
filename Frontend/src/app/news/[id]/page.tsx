"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';

interface NewsDetail {
  id: number;
  title: string;
  content: string;
  originCreatedDate?: string;
  createdDate?: string;
  author?: string;
  source?: string;
  mediaName?: string;
  journalist?: string;
  imgUrl?: string;
  imageUrl?: string;
  originalNewsUrl?: string;
}

export default function NewsDetailPage() {
  const router = useRouter();
  const params = useParams();
  const newsId = params.id;

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 페이지 로드 시 스크롤을 맨 위로 올리기
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!newsId) return;
    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/news/${newsId}`);
        if (!res.ok) throw new Error('뉴스를 불러오지 못했습니다.');
        const data = await res.json();
        if (data.code !== 200 || !data.data) {
          throw new Error(data.message || '뉴스를 찾을 수 없습니다.');
        }
  
        setNews({ ...data.data, imageUrl: data.data.imgUrl });
      } catch (e: any) {
        setError(e.message || '알 수 없는 오류');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [newsId]);

  const handleQuiz = () => {
    router.push(`/news/${newsId}/quiz`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50">
        <div className="text-2xl font-bold text-gray-900 mb-4">뉴스를 불러오는 중...</div>
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50 px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</div>
          <div className="text-gray-600 mb-6">{error}</div>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
        </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50/50 via-indigo-50/50 to-blue-100/50 px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">뉴스를 찾을 수 없습니다</div>
          <div className="text-gray-500 mb-6">요청하신 뉴스를 찾을 수 없습니다.</div>
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full hover:from-blue-700 hover:to-indigo-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
        </div>
    );
  }

  // 스크롤에 따른 배경 투명도 계산
  const backgroundOpacity = Math.max(0.1, 1 - (scrollY / 1000));

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
        {/* Hero Section - 뉴스 상세 소개 */}
        <section className="pt-12 pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* 메인 헤드라인 */}
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  뉴스 상세
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  매일 발행되는 최신 뉴스 기사를 읽어보세요
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 뉴스 상세 섹션 */}
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* 뉴스 카드 */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              {/* 뉴스 헤더 */}
              <div className="bg-white text-gray-800 p-8">
                <div className="flex items-center justify-between mb-4 mt-4">
                  <div className="flex items-center space-x-2">
                    {(news.mediaName || news.source) && (
                      <span className="text-sm font-medium bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        {news.mediaName || news.source}
                      </span>
                    )}
                    {(news.journalist || news.author) && (
                      <>
                        <span className="text-sm text-gray-600">•</span>
                        <span className="text-sm text-gray-600">{news.journalist || news.author}</span>
                      </>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">
                    {news.originCreatedDate ? 
                      new Date(news.originCreatedDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 
                      news.createdDate ? 
                        new Date(news.createdDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 
                        '날짜 정보 없음'
                    }
                  </span>
                </div>
                <div className="bg-gray-100 rounded-2xl p-6 border border-gray-300">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900 text-center">
                    {news.title}
                  </h1>
                </div>
              </div>

              {/* 뉴스 본문 */}
              <div className="p-8">
          {news.imageUrl && (
                  <div className="mb-8">
                    <div className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden">
                <Image
                    src={news.imageUrl}
                        alt={news.title}
                        width={600}
                        height={300}
                        className="w-full h-auto object-contain"
                      />
                    </div>
              </div>
          )}

                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                  <div className="prose prose-lg max-w-none">
                    <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                      {news.content}
                    </div>
            </div>
                </div>

                {/* 원문 링크 */}
                {news.originalNewsUrl && (
                  <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                    <a
                      href={news.originalNewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      원문 보기
                    </a>
                  </div>
            )}
          </div>
        </div>

            {/* 상세 퀴즈 안내 */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 상세 퀴즈에 도전해보세요!</h3>
                  <p className="text-gray-600 mb-6">
                    해당 뉴스 기사의 내용을 바탕으로 상세퀴즈를 출제합니다
                  </p>
                 <button
                     onClick={handleQuiz}
                     className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                 >
                    <span className="mr-3">상세 퀴즈 풀러가기</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                   </svg>
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