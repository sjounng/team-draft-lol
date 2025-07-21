import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";
import LogoutMessage from "./LogoutMessage";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config/api";

interface Player {
  playerId: number;
  name: string;
  score: number;
  mainLane: string;
  subLane: string;
}

interface Pool {
  poolId: number;
  name: string;
  players: Player[];
}

const PoolRanking = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [rankedPlayers, setRankedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const fetchPoolRanking = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/pools/${poolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const poolData = response.data;
      setPool(poolData);

      // 플레이어를 점수순으로 정렬
      const sortedPlayers = [...poolData.players].sort(
        (a, b) => b.score - a.score
      );
      setRankedPlayers(sortedPlayers);
    } catch (error) {
      console.error("풀 랭킹 조회 실패:", error);
      navigate("/ranking");
    } finally {
      setLoading(false);
    }
  }, [poolId, navigate]);

  useEffect(() => {
    if (poolId) {
      fetchPoolRanking();
    }
  }, [poolId, fetchPoolRanking]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      default:
        return `${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500 text-white"; // 금색
      case 2:
        return "bg-gray-400 text-white"; // 은색
      case 3:
        return "bg-orange-600 text-white"; // 동색
      default:
        return "bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary";
    }
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

  if (!pool) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="text-center mt-24">
          <h2 className="text-xl font-semibold mb-4">풀을 찾을 수 없습니다</h2>
          <Button onClick={() => navigate("/ranking")}>
            랭킹 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mb-8">
        <div className="flex items-center justify-between mt-24 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{pool.name} 랭킹</h1>
            <p className="text-text-muted">총 {rankedPlayers.length}명</p>
          </div>
          <Button onClick={() => navigate("/ranking")}>돌아가기</Button>
        </div>

        {rankedPlayers.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">
              등록된 플레이어가 없습니다
            </h2>
            <p className="text-text-muted mb-6">
              풀에 플레이어를 추가한 후 랭킹을 확인해보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rankedPlayers.map((player, index) => {
              const rank = index + 1;
              return (
                <div
                  key={player.playerId}
                  className={`flex items-center p-6 rounded-lg border-2 transition-all duration-200 ${
                    rank <= 3
                      ? "border-white shadow-lg"
                      : "border-primary-dark/20 dark:border-secondary-dark/20"
                  } ${getRankColor(rank)}`}
                >
                  {/* 순위 */}
                  <div className="flex-shrink-0 mr-6">
                    <div className="text-2xl font-bold">
                      {getRankIcon(rank)}
                    </div>
                  </div>

                  {/* 플레이어 정보 */}
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">{player.name}</h3>
                      </div>

                      {/* 점수 */}
                      <div className="flex flex-row gap-1 items-end text-right">
                        <div className="text-3xl font-bold">{player.score}</div>
                        <div className="text-sm opacity-75 mb-1">점</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PoolRanking;
