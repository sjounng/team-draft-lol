import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Input from "../components/Input";
import Button from "../components/Button";
import FormContainer from "../components/FormContainer";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/profiles/login`, {
        email,
        password,
      });

      const { token } = response.data;
      login(token);
      navigate("/players");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "로그인에 실패했습니다.");
      } else {
        setError("로그인에 실패했습니다.");
      }
    }
  };

  return (
    <FormContainer title="로그인">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="email"
          type="email"
          label="이메일"
          className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          label="비밀번호"
          className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" fullWidth>
          로그인
        </Button>
        <p className="text-center text-sm text-text-primary dark:text-text-secondary">
          계정이 없으신가요?{" "}
          <Link
            to="/signup"
            className="text-text-primary dark:text-text-secondary hover:text-accent-yellow transition-colors"
          >
            회원가입
          </Link>
        </p>
      </form>
    </FormContainer>
  );
};

export default Login;
