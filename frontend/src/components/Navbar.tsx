import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import Button from "./Button";

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 다크모드 상태 초기화 및 localStorage에서 불러오기
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // 다크모드 토글 함수
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 min-w-[97%] max-w-6xl flex items-center justify-between px-8 py-4 rounded-2xl bg-primary dark:bg-secondary backdrop-blur-mdrounded-2xl  z-50 transition-colors duration-300">
      {/* 왼쪽: 로고 */}
      <Link
        to="/"
        className="text-4xl font-black text-text-primary dark:text-text-secondary hover:text-accent-yellow transition-colors"
      >
        TD LOL
      </Link>
      {/* 가운데: 항목들 */}
      <div className="flex gap-8 text-lg font-semibold text-text-primary dark:text-text-secondary">
        <Link
          to="/players"
          className="hover:text-text-muted transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-primary-dark/50 dark:hover:bg-secondary-light/50"
        >
          풀 관리
        </Link>
        <Link
          to="/team-create"
          className="hover:text-text-muted transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-primary-dark/50 dark:hover:bg-secondary-light/50"
        >
          팀 생성
        </Link>
        <Link
          to="/records"
          className="hover:text-text-muted transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-primary-dark/50 dark:hover:bg-secondary-light/50"
        >
          전적
        </Link>
        <Link
          to="/ranking"
          className="hover:text-text-muted transition-colors duration-200 px-3 py-1 rounded-lg hover:bg-primary-dark/50 dark:hover:bg-secondary-light/50"
        >
          랭킹
        </Link>
      </div>
      {/* 오른쪽: 다크모드 토글 + 인증 버튼 */}
      <div className="flex items-center gap-4">
        {/* 다크모드 토글 버튼 */}
        <Button onClick={toggleDarkMode} aria-label="다크모드 토글">
          {isDarkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </Button>

        {/* 인증 버튼 */}
        {!isLoggedIn ? (
          <Button onClick={() => navigate("/login")}>SIGN IN</Button>
        ) : (
          <Button onClick={logout}>SIGN OUT</Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
