import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";
import LogoutMessage from "./LogoutMessage";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config/api";

interface PlayerGameRecord {
  playerId: number;
  playerName: string;
  lolId: string;
  teamNumber: number;
  assignedPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  beforeScore: number;
  afterScore: number;
  scoreChange: number;
}

interface GameRecord {
  gameId: number;
  team1Won: boolean;
  team1Kills: number;
  team2Kills: number;
  team1Gold: number;
  team2Gold: number;
  team1SupportVision: number;
  team2SupportVision: number;
  applied: boolean; // isApplied에서 applied로 변경
  createdAt: string;
  playerRecords: PlayerGameRecord[];
}

const Records = () => {
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      fetchGameRecords();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // RecordDetail에서 점수 반영 후 돌아온 경우 새로고침
    if (location.state?.refreshNeeded) {
      fetchGameRecords();
      // state 초기화하여 무한 새로고침 방지
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const fetchGameRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/game-records`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGameRecords(response.data);
    } catch (error) {
      console.error("전적 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRecordClick = (gameId: number) => {
    navigate(`/records/${gameId}`);
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
      <div className="mt-24 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">게임 전적</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/team-create")}>
              새 팀 만들기
            </Button>
          </div>
        </div>

        {gameRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted mb-4">아직 저장된 전적이 없습니다.</p>
            <Button onClick={() => navigate("/team-create")}>
              첫 번째 팀 만들기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {gameRecords.map((record) => (
              <div
                key={record.gameId}
                className="bg-primary-light dark:bg-secondary-light rounded-lg p-6 border border-primary-dark/20 dark:border-secondary-dark/20 cursor-pointer hover:bg-primary/80 dark:hover:bg-secondary/80 transition-colors"
                onClick={() => handleRecordClick(record.gameId)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-text-muted">
                      Game #{record.gameId}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        record.team1Won
                          ? "bg-blue-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {record.team1Won ? "1팀 승리" : "2팀 승리"}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.applied
                          ? "bg-green-500 text-white"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {record.applied ? "반영됨" : "미반영"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">
                      {formatDate(record.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 킬수 */}
                  <div className="text-center">
                    <p className="text-sm text-text-muted mb-1">킬</p>
                    <p className="font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">
                        {record.team1Kills}
                      </span>{" "}
                      -{" "}
                      <span className="text-red-600 dark:text-red-400">
                        {record.team2Kills}
                      </span>
                    </p>
                  </div>

                  {/* 골드 */}
                  <div className="text-center">
                    <p className="text-sm text-text-muted mb-1">골드</p>
                    <p className="font-semibold">
                      <span className="text-blue-600 dark:text-blue-400">
                        {record.team1Gold.toLocaleString()}
                      </span>{" "}
                      -{" "}
                      <span className="text-red-600 dark:text-red-400">
                        {record.team2Gold.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary-dark/10 dark:border-secondary-dark/10">
                  <p className="text-sm text-text-muted">
                    클릭하여 상세 기록 보기
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
