import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";
import Input from "../components/Input";
import PoolCard from "../components/PoolCard";
import LogoutMessage from "./LogoutMessage";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config/api";

interface Pool {
  poolId: string;
  name: string;
  playersCount: number;
}

const Players = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [newPoolName, setNewPoolName] = useState("");
  const [joinPoolId, setJoinPoolId] = useState("");
  const [joinPoolName, setJoinPoolName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/pools`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPools(response.data);
    } catch (error) {
      console.error("Failed to fetch pools:", error);
    }
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/pools`,
        {
          name: newPoolName,
          playerIds: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewPoolName("");
      fetchPools();
    } catch (error) {
      console.error("Failed to create pool:", error);
    }
  };

  const handleJoinPool = async () => {
    if (!joinPoolId.trim() || !joinPoolName.trim()) {
      setError("풀 ID와 풀 이름을 모두 입력해주세요.");
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/api/pools/join`, null, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          poolId: joinPoolId,
          poolName: joinPoolName,
        },
      });
      setJoinPoolId("");
      setJoinPoolName("");
      fetchPools();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("풀 가입에 실패했습니다.");
      }
    }
  };

  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <LogoutMessage />;
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mt-24 mb-4">플레이어 풀 관리</h1>

        {/* 풀 생성 섹션 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">새 풀 생성</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1 w-full">
              <Input
                type="text"
                value={newPoolName}
                onChange={(e) => setNewPoolName(e.target.value)}
                placeholder="새 풀 이름"
                label="풀 이름"
                className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
              />
            </div>
            <Button onClick={handleCreatePool} className="px-4 py-2 h-10 mb-4">
              풀 생성
            </Button>
          </div>
        </div>

        {/* 풀 추가 섹션 */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">기존 풀 추가</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              type="text"
              value={joinPoolName}
              onChange={(e) => setJoinPoolName(e.target.value)}
              placeholder="풀 이름"
              label="풀 이름"
              className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
            />
            <Input
              type="text"
              value={joinPoolId}
              onChange={(e) => setJoinPoolId(e.target.value)}
              placeholder="#"
              label="풀 ID"
              className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
            />

            <div className="flex justify-between items-center mt-6">
              <Button onClick={handleJoinPool} className="px-4 py-2 h-10 mb-4">
                풀 추가
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <PoolCard
            key={pool.poolId}
            poolId={pool.poolId}
            name={pool.name}
            playersCount={pool.playersCount}
            onClick={() => navigate(`/pool/${pool.poolId}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default Players;
