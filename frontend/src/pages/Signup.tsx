import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Input from "../components/Input";
import Button from "../components/Button";
import FormContainer from "../components/FormContainer";
import API_BASE_URL from "../config/api";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/profiles/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else if (err.response?.status === 500) {
          setError("서버 내 오류가 발생했습니다. 잠시 후 다시 시도해주세요");
        }
      } else {
        setError("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <FormContainer title="회원가입">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          id="username"
          type="text"
          name="username"
          label="사용자 이름"
          className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <Input
          id="email"
          type="email"
          name="email"
          label="이메일"
          className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          id="password"
          type="password"
          name="password"
          label="비밀번호"
          className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          label="비밀번호 확인"
          className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" fullWidth>
          회원가입
        </Button>
        <p className="text-center text-sm text-text-primary dark:text-text-secondary">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            className="text-text-primary dark:text-text-secondary hover:text-accent-yellow transition-colors"
          >
            로그인
          </Link>
        </p>
      </form>
    </FormContainer>
  );
};

export default Signup;
