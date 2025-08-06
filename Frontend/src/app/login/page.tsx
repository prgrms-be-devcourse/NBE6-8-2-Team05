"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/members/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('로그인 응답 데이터:', data);
        
        // 로그인 성공 시 사용자 정보를 AuthContext에 저장
        if (data.data) {
          console.log('AuthContext에 저장할 사용자 데이터:', data.data);
          login(data.data);
          router.push('/');
        } else {
          console.log('사용자 데이터가 없음');
          router.push('/');
        }
      } else {
        const data = await response.json();
        throw new Error(data.message || '로그인에 실패했습니다.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#f7fafd] to-[#e6eaf3] font-sans pt-24">
      {/* 로고/서비스명 */}
      <div className="mb-8 text-center">
        <span className="text-3xl font-extrabold text-[#2b6cb0] tracking-tight">뉴스OX</span>
        <div className="text-base text-gray-500 mt-2">진짜 뉴스를 가려내는 AI 퀴즈 서비스</div>
      </div>
      
      {/* 로그인 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg px-8 py-8 w-full max-w-md flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* 이메일 입력 */}
        <div className="flex flex-col gap-1">
          <input 
            type="email" 
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            placeholder="이메일" 
            required
            className="rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7f9cf5]" 
          />
          {emailError && (
            <div className="text-red-500 text-sm px-2">{emailError}</div>
          )}
        </div>
        
        {/* 비밀번호 입력 */}
        <input 
          type="password" 
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호" 
          required
          className="rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7f9cf5]" 
        />
        
        <button 
          type="submit" 
          disabled={isLoading || !!emailError}
          className="w-full flex items-center gap-3 justify-center h-10 text-base font-medium rounded-full shadow bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5] text-white hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? "로그인 중..." : "로그인"}
        </button>
        
        <div className="flex items-center my-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="mx-2 text-gray-400 text-sm">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        
        {/* 네이버 소셜로그인 */}
        <a 
          href="http://localhost:8080/oauth2/authorization/naver?redirectUrl=http://localhost:3000/"
          className="group w-full flex items-center gap-3 justify-center h-10 text-base font-medium rounded-full shadow bg-[#03C75A] text-white hover:opacity-90 transition mb-1"
        >
          <Image src="/social/naver_login.png" alt="네이버 로고" width={24} height={24} className="group-hover:opacity-80 transition" />
          <span>네이버로 로그인</span>
        </a>  

        {/* 구글 소셜로그인 */}
        <a 
          href="http://localhost:8080/oauth2/authorization/google?redirectUrl=http://localhost:3000/"
          className="group w-full flex items-center gap-3 justify-center h-10 text-base font-medium rounded-full shadow bg-[#FFFFFF] border border-gray-300 text-[#3c4043] hover:bg-gray-50 transition mb-1"
        >
          <Image src="/social/google_login.png" alt="구글 로고" width={24} height={24} className="ml-[-13px] group-hover:opacity-80 transition" />
          <span>구글로 로그인</span>
        </a>  

        {/* 카카오 소셜로그인 */}
        <a 
          href="http://localhost:8080/oauth2/authorization/kakao?redirectUrl=http://localhost:3000/"
          className="group w-full flex items-center gap-3 justify-center h-10 text-base font-medium rounded-full shadow bg-[#FEE500] text-[#3C1E1E] hover:bg-[#FFEB3B] transition mb-1"
        >
          <Image src="/social/kakao_login.png" alt="카카오 로고" width={24} height={24} className="group-hover:opacity-70 transition" />
          <span>카카오로 로그인</span>
        </a>  
        
        <Link href="/register" className="mt-4 text-center text-[#2b6cb0] font-semibold hover:underline">
          회원가입하기
        </Link>
      </form>
    </div>
  );
} 