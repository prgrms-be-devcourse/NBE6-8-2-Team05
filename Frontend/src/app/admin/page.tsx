"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 회원 타입
interface MemberWithInfoDto {
  id: number;
  name: string;
  email: string;
  exp: number;
  level: number;
  role: string;
  characterImage: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<MemberWithInfoDto | null>(null);
  const [users, setUsers] = useState<MemberWithInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [todayNewsId, setTodayNewsId] = useState<number | null>(null);

  // 내 정보(로그인/권한) 확인
  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const res = await fetch("/api/members/info", { credentials: "include" });
        if (!res.ok) throw new Error("로그인이 필요합니다.");
        const data = await res.json();
        if (!data.data) throw new Error("로그인이 필요합니다.");
        setUser(data.data);
        if (data.data.role !== "ADMIN") {
          alert("관리자만 접근 가능합니다.");
          router.replace("/");
        }
      } catch (e) {
        alert("로그인이 필요합니다.");
        router.replace("/login");
      }
    };
    fetchMyInfo();
  }, [router]);

  // 회원 목록 조회
  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/members", { credentials: "include" });
        if (res.status === 403) {
          setError("관리자 권한이 필요합니다.");
          return;
        }
        if (res.status === 401) {
          setError("로그인이 필요합니다.");
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("회원 목록 조회 실패");
        const data = await res.json();
        setUsers(data.data);
      } catch (e: any) {
        setError(e.message || "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [user, router]);

  // 뉴스 목록 조회
  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    const fetchNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const res = await fetch("/api/news?page=1&size=50&direction=desc");
        if (!res.ok) throw new Error("뉴스 목록 조회 실패");
        const data = await res.json();
        setNews(data.data.content || []);
      } catch (e: any) {
        setNewsError(e.message || "알 수 없는 오류");
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
  }, [user]);

  // 오늘의 뉴스 id 조회
  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    const fetchTodayNews = async () => {
      try {
        const res = await fetch("/api/admin/news/today", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.code === 200 && data.data && data.data.id) {
          setTodayNewsId(data.data.id);
        } else {
          setTodayNewsId(null);
        }
      } catch {
        setTodayNewsId(null);
      }
    };
    fetchTodayNews();
  }, [user, news]);

  // 뉴스 삭제
  const handleDeleteNews = async (newsId: number) => {
    if (!window.confirm('정말로 이 뉴스를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/news/${newsId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || data.code !== 200) throw new Error(data.message || '뉴스 삭제 실패');
      alert('뉴스가 삭제되었습니다.');
      // 삭제 후 목록 새로고침
      setNews((prev) => prev.filter((n) => n.id !== newsId));
    } catch (e: any) {
      alert(e.message || '뉴스 삭제 실패');
    }
  };

  // 오늘의 뉴스 설정
  const handleSetTodayNews = async (newsId: number) => {
    try {
      const res = await fetch(`/api/admin/news/today/select/${newsId}`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || data.code !== 200) throw new Error(data.message || '오늘의 뉴스 설정 실패');
      alert('오늘의 뉴스로 설정되었습니다!');
      setTodayNewsId(newsId);
    } catch (e: any) {
      alert(e.message || '오늘의 뉴스 설정 실패');
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null; // 권한 없으면 아무것도 안 보여줌
  }

  return (
      <div className="min-h-screen bg-gradient-to-b from-[#f7fafd] to-[#e6eaf3] flex flex-col items-center py-16 relative overflow-hidden">
        {/* 배경 장식 요소들 */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-[#7f9cf5]/20 to-[#43e6b5]/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-[#bfe0f5]/30 to-[#8fa4c3]/30 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-[#43e6b5]/25 to-[#7f9cf5]/25 rounded-full blur-lg animate-bounce"></div>

        <div className="w-full max-w-8xl bg-white/90 rounded-3xl shadow-2xl p-12 flex flex-col gap-12 items-center relative overflow-hidden">
          {/* 상단 장식 라인 */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#7f9cf5] via-[#43e6b5] to-[#7f9cf5]"></div>

          <div className="w-full flex flex-col items-center mb-8">
            <div className="relative">
              <div className="text-5xl font-extrabold text-[#7f9cf5] mb-2 tracking-widest animate-pulse">
                관리자 페이지
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-[#43e6b5] to-[#7f9cf5] rounded-full animate-ping"></div>
            </div>
            <div className="text-lg text-[#64748b] font-medium">시스템 관리 및 모니터링</div>
          </div>
          <section className="w-full bg-white/90 rounded-3xl p-8 shadow-xl border border-white/50 backdrop-blur-sm relative overflow-hidden">
            {/* 카드 상단 장식 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5]"></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-[#7f9cf5] to-[#43e6b5] rounded-full opacity-20"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7f9cf5] to-[#43e6b5] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-[#2b6cb0]">모든 회원 조회</div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-[#64748b]">로딩 중...</div>
                </div>
            ) : error ? (
                <div className="text-red-500 text-center py-12">{error}</div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gradient-to-r from-[#e6f1fb] to-[#f0f7ff] text-[#2b6cb0]">
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5]">ID</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5]">이름</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5]">이메일</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5]">레벨</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5]">경험치</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5]">역할</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u, index) => (
                        <tr key={u.id} className={`border-b hover:bg-gradient-to-r hover:from-[#f8fafc] hover:to-[#e6f1fb] transition-all duration-200 ${index % 2 === 0 ? 'bg-white/50' : 'bg-[#f8fafc]/50'}`}>
                          <td className="py-4 px-6 font-semibold text-[#2b6cb0]">{u.id}</td>
                          <td className="py-4 px-6 font-medium">{u.name}</td>
                          <td className="py-4 px-6 text-[#64748b]">{u.email}</td>
                          <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5] text-white rounded-full text-sm font-bold">
                          {u.level}레벨
                        </span>
                          </td>
                          <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-[#e6f1fb] text-[#2b6cb0] rounded-full text-sm font-semibold">
                          {u.exp} EXP
                        </span>
                          </td>
                          <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            u.role === 'ADMIN'
                                ? 'bg-gradient-to-r from-red-400 to-red-600 text-white'
                                : 'bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5] text-white'
                        }`}>
                          {u.role}
                        </span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
          {/* 뉴스 목록 섹션 */}
          <section className="w-full bg-white/90 rounded-3xl p-8 shadow-xl border border-white/50 backdrop-blur-sm relative overflow-hidden">
            {/* 카드 상단 장식 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5]"></div>
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-[#7f9cf5] to-[#43e6b5] rounded-full opacity-20"></div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7f9cf5] to-[#43e6b5] rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-[#2b6cb0]">모든 뉴스 조회</div>
            </div>

            {newsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-lg text-[#64748b]">로딩 중...</div>
                </div>
            ) : newsError ? (
                <div className="text-red-500 text-center py-12">{newsError}</div>
            ) : news.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-lg text-[#64748b] mb-2">등록된 뉴스가 없습니다.</div>
                  <div className="text-sm text-[#94a3b8]">새로운 뉴스를 추가해보세요!</div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gradient-to-r from-[#e6f1fb] to-[#f0f7ff] text-[#2b6cb0]">
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5] w-16">ID</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5] flex-1">제목</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5] w-32">작성자</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5] w-32">날짜</th>
                      <th className="py-4 px-6 font-bold border-b-2 border-[#7f9cf5] w-64">관리</th>
                    </tr>
                    </thead>
                    <tbody>
                    {news.map((n: any, index: number) => (
                        <tr key={n.id} className={`border-b hover:bg-gradient-to-r hover:from-[#f8fafc] hover:to-[#e6f1fb] transition-all duration-200 ${index % 2 === 0 ? 'bg-white/50' : 'bg-[#f8fafc]/50'}`}>
                          <td className="py-4 px-6 w-16 font-semibold text-[#2b6cb0]">{n.id}</td>
                          <td className="py-4 px-6 flex-1 truncate font-medium">{n.title}</td>
                          <td className="py-4 px-6 w-32 truncate text-[#64748b]">{n.author || n.mediaName || '-'}</td>
                          <td className="py-4 px-6 w-32 text-[#64748b]">{n.originCreatedDate || n.createdDate}</td>
                          <td className="py-4 px-6 w-64">
                            <div className="flex flex-row gap-3">
                              <button
                                  onClick={() => handleSetTodayNews(n.id)}
                                  className={`px-4 py-2 rounded-full font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2 ${
                                      todayNewsId === n.id
                                          ? 'bg-gradient-to-r from-green-400 to-green-600 text-white cursor-default'
                                          : 'bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5] text-white hover:from-[#5a7bd8] hover:to-[#2dd4bf]'
                                  }`}
                                  disabled={todayNewsId === n.id}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {todayNewsId === n.id ? '오늘의 뉴스' : '오늘의 뉴스로 설정'}
                              </button>
                              <button
                                  onClick={() => handleDeleteNews(n.id)}
                                  className="px-4 py-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm whitespace-nowrap flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
        </div>
      </div>
  );
} 