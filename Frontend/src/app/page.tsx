"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";
import { getCharacterImageByLevel } from "@/utils/characterUtils";

// 경험치를 기반으로 올바른 레벨을 계산하는 함수
const calculateLevelFromExp = (exp: number): number => {
  if (exp >= 200) return 3;
  if (exp >= 100) return 2;
  return 1;
};



interface NewsArticle {
  id: number;
  title: string;
  content: string;
  description: string;
  link: string;
  imgUrl?: string;
  originCreatedDate: string;
  mediaName: string;
  journalist: string;
  originalNewsUrl: string;
  newsCategory: string;
}

interface NewsPage {
  content: NewsArticle[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

interface TodayNews {
  id: number;
  title: string;
  content: string;
  imgUrl?: string;
  originCreatedDate: string;
  mediaName: string;
}

interface RankingMember {
  id: number;
  name: string;
  exp: number;
  level: number;
  characterImage: string;
  rank: number;
}

export default function Home() {
  const searchParams = useSearchParams();
  const [todayNews, setTodayNews] = useState<TodayNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rankingMembers, setRankingMembers] = useState<RankingMember[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const { checkAuth } = useAuth();

  useEffect(() => {
    const loginSuccess = searchParams.get('loginSuccess');
    const message = searchParams.get('message');


    const redirect = searchParams.get('redirect');

    if (loginSuccess === 'true' && message) {
      alert(message); // 카카오 로그인 성공 메시지 팝업
      // 소셜로그인 성공 후 최신 사용자 정보 가져오기
      checkAuth();
      
      // 리다이렉트 파라미터가 있으면 해당 페이지로 이동
      if (redirect) {
        window.location.href = redirect;
      }
    }
  }, [searchParams, checkAuth]);

  // 오늘의 뉴스 불러오기
  useEffect(() => {
    const fetchTodayNews = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/news/today');
        if (res.ok) {
          const data = await res.json();
          if (data.code === 200 && data.data) {
            setTodayNews(data.data);
          }
        }
      } catch (error) {
        console.error('오늘의 뉴스 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTodayNews();
  }, []);

  // 뉴스 기사 목록 불러오기
  useEffect(() => {
    const fetchNewsArticles = async () => {
      setNewsLoading(true);
      try {
        let url = '';

        if (searchQuery) {
          // 검색어가 있는 경우
          url = `/api/news/search?title=${encodeURIComponent(searchQuery)}&page=${currentPage}&size=9&direction=desc`;
        } else if (selectedCategory) {
          // 카테고리가 선택된 경우 - 한글을 영어로 변환
          const categoryMap: { [key: string]: string } = {
            '정치': 'POLITICS',
            '경제': 'ECONOMY',
            'IT': 'IT',
            '문화': 'CULTURE',
            '사회': 'SOCIETY'
          };
          const englishCategory = categoryMap[selectedCategory] || selectedCategory;
          url = `/api/news/category/${encodeURIComponent(englishCategory)}?page=${currentPage}&size=9&direction=desc`;
        } else {
          // 전체 뉴스
          url = `/api/news?page=${currentPage}&size=9&direction=desc`;
        }

        const res = await fetch(url);
        
        if (res.ok) {
          const data = await res.json();
          
          if (data.code === 200 && data.data) {
            setNewsArticles(data.data.content || []);
            setTotalPages(data.data.totalPages || 0);
          } else {
            // API 응답이 성공이지만 데이터가 없는 경우
            setNewsArticles([]);
            setTotalPages(0);
          }
        } else {
          // API 호출 실패 시 (500 에러 등)
          console.error(' 뉴스 API 호출 실패:', res.status, res.statusText);
          const errorText = await res.text();
          console.error('에러 응답 내용:', errorText);
          setNewsArticles([]);
          setTotalPages(0);
        }
      } catch (error) {
        console.error(' 뉴스 목록 조회 실패:', error);
        // 에러 발생 시 빈 배열로 설정
        setNewsArticles([]);
        setTotalPages(0);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNewsArticles();
  }, [currentPage, searchQuery, selectedCategory]);

  // 랭킹 데이터 불러오기
  useEffect(() => {
    const fetchRanking = async () => {
      setRankingLoading(true);
      try {
        const res = await fetch('/api/members/rank');
        if (res.ok) {
          const data = await res.json();
          if (data.code === 200 && data.data) {
            const rankingData = data.data.map((member: any, index: number) => ({
              ...member,
              rank: index + 1
            }));
            setRankingMembers(rankingData);
          }
        }
      } catch (error) {
        console.error('랭킹 데이터 조회 실패:', error);
        // 에러 발생 시 빈 배열로 설정
        setRankingMembers([]);
      } finally {
        setRankingLoading(false);
      }
    };
    fetchRanking();
  }, []);

  return (
    <div className="font-sans min-h-screen bg-white">
      {/* 상단 네비게이션은 layout.tsx에서 공통 처리됨 */}

      {/* Hero Section - 서비스 소개 */}
      <section className="relative pt-32 pb-32 overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* 메인 헤드라인 */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              <span className="block">뉴스 기반</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                퀴즈 플랫폼
              </span>
            </h1>
            
            {/* 서비스 소개 */}
            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
                매일 업데이트되는 <span className="font-semibold text-gray-800">최신 뉴스를 기반으로 AI가 생성한 퀴즈를 풀어보세요</span>
              </p>
              
              {/* 3가지 퀴즈 타입 소개 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="text-3xl mb-3">📰</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">상세 퀴즈</h3>
                  <p className="text-sm text-gray-600">뉴스 내용을 바탕으로 출제되는 상세 퀴즈</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="text-3xl mb-3">⭐</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">오늘의 퀴즈</h3>
                  <p className="text-sm text-gray-600">매일 선정되는 오늘의 뉴스로 출제되는 상세 퀴즈</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">OX 퀴즈</h3>
                  <p className="text-sm text-gray-600">가짜 뉴스와 진짜 뉴스를 구분하는 OX 퀴즈</p>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      {/* 1. 뉴스 + 상세퀴즈 섹션 */}
      <section className="py-20 bg-blue-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 텍스트 콘텐츠 */}
            <div className="pl-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                매일 새로운 뉴스 +<br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  상세퀴즈
                </span>
              </h2>
                             <p className="text-xl text-gray-600 mb-8 leading-relaxed whitespace-nowrap">
                 매일 발행되는 뉴스 기사를 가져와서, 해당 뉴스 기사의 내용을 바탕으로 상세퀴즈를 출제합니다.
               </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">매일 새로운 뉴스 기사 제공</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">카테고리별 검색 및 키워드 검색</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">뉴스 내용 기반 상세퀴즈 출제</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-blue-200">
                <div className="text-sm font-semibold text-blue-800 mb-2">💡 상세퀴즈 풀이 방법</div>
                <div className="text-sm text-blue-700">
                  1. 뉴스를 읽고 →  2. 해당 뉴스 페이지에서 "상세 퀴즈 풀러가기" 버튼 클릭
                </div>
              </div>
              
              <button
                onClick={() => {
                  const newsSection = document.getElementById('news-section');
                  if (newsSection) {
                    newsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // 추가로 조금 더 위쪽으로 스크롤
                    setTimeout(() => {
                      window.scrollBy(0, -50);
                    }, 500);
                  }
                }}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                뉴스 읽어보기
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            

          </div>
        </div>
      </section>

      {/* 2. 오늘의 뉴스 + 오늘의 퀴즈 섹션 */}
      <section className="py-20 bg-purple-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                오늘의 뉴스 +<br />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  오늘의퀴즈
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                매일 발행되는 새로운 뉴스 기사 중, AI 평가 점수가 가장 높은 뉴스를<br /> 오늘의 뉴스로 선정합니다.<br />
                오늘의 뉴스의 상세 퀴즈인 오늘의퀴즈를 출제합니다.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">AI 평가 점수 기반 오늘의 뉴스 선정</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">오늘의 뉴스 기반 '오늘의퀴즈' 출제</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">경험치 2배 획득</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-purple-200">
                <div className="text-sm font-semibold text-purple-800 mb-2">💡 오늘의퀴즈 풀이 방법</div>
                <div className="text-sm text-purple-700">
                  1. 오늘의 뉴스 페이지에서 →  2. "오늘의 퀴즈 풀기" 버튼 클릭
                </div>
              </div>
              
              <Link 
                href="/todaynews"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                오늘의 뉴스 보기
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OX퀴즈 섹션 */}
      <section className="py-20 bg-indigo-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 텍스트 콘텐츠 */}
            <div className="pl-8">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  OX퀴즈
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AI를 통해 가짜뉴스를 생성하여, <br />
                AI가 생성한 가짜뉴스와 진짜뉴스 중 정답을 고르는 퀴즈입니다.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">실제 뉴스 제목을 바탕으로 AI 가짜뉴스 생성</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">본문을 읽고 진짜뉴스와 가짜뉴스 구분</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">카테고리별 OX퀴즈 선택</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-indigo-200">
                <div className="text-sm font-semibold text-indigo-800 mb-2">💡 OX퀴즈 풀이 방법</div>
                <div className="text-sm text-indigo-700">
                  1. OX퀴즈 목록에서 원하는 퀴즈 선택 →  2. 진짜뉴스와 가짜뉴스 중 정답 고르기
                </div>
              </div>
              
              <Link 
                href="/oxquiz"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                OX퀴즈 풀어보기
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 캐릭터 키우기 + 랭킹 섹션 */}
      <section className="py-20 bg-green-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              캐릭터 키우기 + 랭킹 제도
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              퀴즈를 풀어 얻은 경험치로 캐릭터를 성장시켜주세요! <br />
              레벨,경험치 기반 TOP3를 보여주는 랭킹 제도
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* 캐릭터 키우기 */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">🐤 캐릭터 키우기</h3>
                <p className="text-gray-600">퀴즈를 풀어서 캐릭터를 성장시켜주세요</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">퀴즈 정답 시 경험치 획득</h4>
                    <p className="text-sm text-gray-600">상세퀴즈, OX퀴즈, 오늘의퀴즈 </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">경험치 누적으로 레벨업</h4>
                    <p className="text-sm text-gray-600">1레벨부터 3레벨까지 존재</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">레벨업 시 캐릭터 성장</h4>
                    <p className="text-sm text-gray-600">레벨 별로 달라지는 캐릭터 모습</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <Link 
                  href="/mypage"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300"
                >
                  내 캐릭터 보기
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* 랭킹 시스템 */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">🏆 랭킹제도</h3>
                <p className="text-gray-600">퀴즈 고수 TOP3를 확인해보세요!</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <div className="text-center mb-4">
                </div>
                
                {rankingLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  </div>
                ) : rankingMembers.length > 0 ? (
                  <div className="space-y-4">
                    {rankingMembers.slice(0, 3).map((member, index) => (
                      <div key={member.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="text-3xl">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg shadow-lg">
                          {getCharacterImageByLevel(calculateLevelFromExp(member.exp))}
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-bold text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-600">Level {member.level} • {member.exp} EXP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm mb-2">랭킹 데이터가 없습니다</div>
                    <div className="text-xs">퀴즈를 풀어서 랭킹에 도전해보세요!</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 뉴스 목록 섹션 */}
      <section id="news-section" className="py-20 bg-blue-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              📰 뉴스 기사 목록
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              최신 뉴스를 확인하고 관심 있는 기사를 찾아보세요
            </p>
          </div>

          {/* 카테고리 버튼 */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['정치', '경제', 'IT', '문화', '사회'].map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(selectedCategory === category ? '' : category);
                  setCurrentPage(1);
                  setSearchQuery('');
                }}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform hover:scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:shadow-md'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 검색창 */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                placeholder="뉴스 검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                  setSelectedCategory('');
                }}
                className="w-full px-6 py-4 pl-12 bg-white rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-300"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

                     {/* 뉴스 목록 */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
             {newsLoading ? (
               // 로딩 스피너
               Array.from({ length: 6 }).map((_, index) => (
                 <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                   <div className="h-48 bg-gray-200"></div>
                   <div className="p-6">
                     <div className="h-4 bg-gray-200 rounded mb-4"></div>
                     <div className="h-6 bg-gray-200 rounded mb-2"></div>
                     <div className="h-6 bg-gray-200 rounded mb-2"></div>
                     <div className="h-4 bg-gray-200 rounded mb-4"></div>
                     <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                   </div>
                 </div>
               ))
             ) : newsArticles.length > 0 ? (
               newsArticles.map((article) => (
                                   <Link
                    key={article.id}
                    href={`/news/${article.id}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full transform hover:scale-105"
                  >
                    {/* 뉴스 이미지 */}
                    {article.imgUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={article.imgUrl}
                          alt={article.title}
                          fill
                          className="object-contain group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col flex-1">
                                           <div className="flex items-center gap-2 mb-4">
                       <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                         {article.newsCategory === 'IT' ? 'IT' : 
                          article.newsCategory === 'POLITICS' ? '정치' :
                          article.newsCategory === 'SOCIETY' ? '사회' :
                          article.newsCategory === 'ECONOMY' ? '경제' :
                          article.newsCategory === 'CULTURE' ? '문화' : article.newsCategory}
                       </span>
                       <span className="text-sm text-gray-500">{article.mediaName}</span>
                     </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                        {article.description || article.content.substring(0, 120)}...
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-xs text-gray-500">
                          {article.journalist}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(article.originCreatedDate).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </Link>
               ))
             ) : (
               <div className="col-span-full text-center py-12">
                 <div className="text-gray-500 mb-4">
                   <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">뉴스를 찾을 수 없습니다</h3>
                 <p className="text-gray-600">검색어나 카테고리를 변경해보세요</p>
               </div>
             )}
           </div>

          {/* 페이징 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
              >
                이전
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
              >
                다음
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-200 text-gray-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 서비스 정보 섹션 */}
            <div>
              <h3 className="text-2xl font-bold mb-4 text-[#2b6cb0]">
                뉴스OX
              </h3>
              <p className="text-gray-500 mb-4 leading-relaxed">
                매일 업데이트되는 최신 뉴스를 기반으로 AI가 생성한 퀴즈를 풀며 
                지식을 쌓는 새로운 학습 플랫폼입니다.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://github.com/your-repo/newsquiz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* 주요 기능 섹션 */}
            <div>
              <h4 className="text-lg font-semibold mb-4">주요 기능</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-gray-500">
                  <div>📰 상세 퀴즈</div>
                  <div>⭐ 오늘의 퀴즈</div>
                  <div>🤖 OX 퀴즈</div>
                </div>
                <div className="space-y-2 text-gray-500">
                  <div>🐤 캐릭터 키우기</div>
                  <div>🏆 랭킹 시스템</div>
                </div>
              </div>
            </div>
          </div>

          {/* 저작권 정보 */}
          <div className="border-t border-gray-400 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 뉴스OX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
