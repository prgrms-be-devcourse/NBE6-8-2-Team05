"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 실시간 유효성 검사를 위한 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  
  // 유효성 검사 에러 메시지
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [nameError, setNameError] = useState("");

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      setEmailError("올바른 이메일 형식을 입력해주세요");
    } else {
      setEmailError("");
    }
  };

  // 비밀번호 유효성 검사
  const validatePassword = (password: string) => {
    if (password && password.length < 10) {
      setPasswordError("비밀번호를 10자 이상 입력해주세요");
    } else {
      setPasswordError("");
    }
  };

  // 이름 유효성 검사
  const validateName = (name: string) => {
    if (name && name.trim().length < 2) {
      setNameError("이름을 2자 이상 입력해주세요");
    } else {
      setNameError("");
    }
  };

  // 비밀번호 확인 유효성 검사
  const validatePasswordConfirm = (confirmPassword: string) => {
    if (confirmPassword && password && confirmPassword !== password) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다");
    } else {
      setPasswordConfirmError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 최종 유효성 검사
    if (emailError || passwordError || passwordConfirmError || nameError) {
      setError("입력 정보를 올바르게 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/members/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "회원가입에 실패했습니다.");
      }

      // 회원가입 성공
      alert(data.message);
      router.replace("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-b from-[#f7fafd] to-[#e6eaf3] font-sans pt-28">
      {/* 로고/서비스명 */}
      <div className="mb-6 text-center">
        <span className="text-3xl font-extrabold text-[#2b6cb0] tracking-tight">뉴스OX</span>
        <div className="text-base text-gray-500 mt-2">진짜 뉴스를 가려내는 AI 퀴즈 서비스</div>
      </div>
      
      {/* 회원가입 폼 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg px-8 py-8 w-full max-w-md flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">회원가입</h2>
        
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
        <div className="flex flex-col gap-1">
          <input 
            type="password" 
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            placeholder="비밀번호" 
            required
            minLength={10}
            maxLength={50}
            className="rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7f9cf5]" 
          />
          {passwordError && (
            <div className="text-red-500 text-sm px-2">{passwordError}</div>
          )}
        </div>
        
        {/* 비밀번호 확인 */}
        <div className="flex flex-col gap-1">
          <input 
            type="password" 
            name="passwordConfirm"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              validatePasswordConfirm(e.target.value);
            }}
            placeholder="비밀번호 확인" 
            required
            className="rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7f9cf5]" 
          />
          {passwordConfirmError && (
            <div className="text-red-500 text-sm px-2">{passwordConfirmError}</div>
          )}
        </div>
        
        {/* 이름 입력 */}
        <div className="flex flex-col gap-1">
          <input 
            type="text" 
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              validateName(e.target.value);
            }}
            placeholder="이름" 
            required
            minLength={2}
            maxLength={30}
            className="rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7f9cf5]" 
          />
          {nameError && (
            <div className="text-red-500 text-sm px-2">{nameError}</div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading || !!emailError || !!passwordError || !!passwordConfirmError || !!nameError}
          className="w-full flex items-center gap-3 justify-center h-10 text-base font-medium rounded-full shadow bg-gradient-to-r from-[#7f9cf5] to-[#43e6b5] text-white hover:opacity-90 transition disabled:opacity-50"
        >
          {isLoading ? "가입 중..." : "회원가입"}
        </button>
        
        <Link href="/login" className="mt-4 text-center text-[#2b6cb0] font-semibold hover:underline">
          이미 계정이 있으신가요? 로그인하기
        </Link>
      </form>
    </div>
  );
} 