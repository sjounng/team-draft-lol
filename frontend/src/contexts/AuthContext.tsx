import { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  user: { id: string } | null; // user 필드 추가
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT에서 userId 추출 함수 추가
function parseUserIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // 일반적으로 sub 또는 id 필드에 userId가 들어있음
    return payload.sub || payload.id || null;
  } catch (e) {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    let userId = null;
    if (storedToken) {
      userId = parseUserIdFromToken(storedToken);
      setToken(storedToken);
      setIsLoggedIn(true);
      if (userId) setUser({ id: userId });
      localStorage.setItem("userId", userId || "");
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const userId = parseUserIdFromToken(token);
    if (userId) {
      localStorage.setItem("userId", userId);
      setUser({ id: userId });
    }
    setToken(token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setToken(null);
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, token, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
