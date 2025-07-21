import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PoolCard from "../components/PoolCard";
import LogoutMessage from "./LogoutMessage";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/Button";
import API_BASE_URL from "../config/api";

interface Pool {
  poolId: string;
  name: string;
  playersCount: number;
}

const TeamCreate = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

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
    } finally {
      setLoading(false);
    }
  };

  const handlePoolSelect = (poolId: string) => {
    navigate(`/team-builder/${poolId}`);
  };

  if (!isLoggedIn) {
    return <LogoutMessage />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="text-center mt-24">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mt-24 mb-4">팀 생성</h1>
        <p className="text-text-muted mb-6">
          팀을 만들 풀을 선택해주세요. 선택한 풀의 플레이어들로 팀을 구성할 수
          있습니다.
        </p>

        {pools.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">
              사용 가능한 풀이 없습니다
            </h2>
            <p className="text-text-muted mb-6">
              먼저 풀을 생성하거나 기존 풀에 가입해주세요.
            </p>
            <Button onClick={() => navigate("/players")}>
              풀 관리 페이지로 이동
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-6">풀 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <div key={pool.poolId} className="relative">
                  <PoolCard
                    poolId={pool.poolId}
                    name={pool.name}
                    playersCount={pool.playersCount}
                    onClick={() => handlePoolSelect(pool.poolId)}
                  />
                  {pool.playersCount >= 10 && (
                    <div className="absolute top-4 right-16 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      팀 생성 가능
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamCreate;
