import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../components/Button";
import Input from "../components/Input";
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
  cs: number; // 미니언 처치 수 (서폿의 경우 시야점수)
  beforeScore?: number; // 반영 전 점수
  afterScore?: number; // 반영 후 점수
  scoreChange?: number; // 점수 변화량
  streakBonus?: number; // 연승/연패 보너스
}

interface GameRecord {
  gameId: number;
  team1Won: boolean;
  team1Kills: number;
  team2Kills: number;
  team1Gold: number;
  team2Gold: number;
  applied: boolean;
  createdAt: string;
  playerRecords: PlayerGameRecord[];
}

const RecordDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [gameRecord, setGameRecord] = useState<GameRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [players, setPlayers] = useState<any[]>([]); // 플레이어 목록 상태 추가
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // 편집용 상태
  const [editData, setEditData] = useState({
    team1Won: true,
    team1Kills: 0,
    team2Kills: 0,
    team1Gold: 0,
    team2Gold: 0,
    playerRecords: [] as PlayerGameRecord[],
  });

  // 플레이어 목록 가져오기
  const fetchPlayers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/players`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayers(response.data);
    } catch (error) {
      console.error("플레이어 목록 조회 실패:", error);
    }
  }, []);

  const fetchGameRecord = useCallback(
    async (skipLoadingState = false) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/api/game-records/${gameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const record = response.data;

        setGameRecord(record);
        setEditData({
          team1Won: record.team1Won,
          team1Kills: record.team1Kills,
          team2Kills: record.team2Kills,
          team1Gold: record.team1Gold,
          team2Gold: record.team2Gold,
          playerRecords: [...record.playerRecords],
        });
      } catch (error) {
        console.error("전적 조회 실패:", error);
        alert("전적 조회에 실패했습니다.");
        navigate("/records");
      } finally {
        if (!skipLoadingState) {
          setLoading(false);
        }
      }
    },
    [gameId, navigate]
  );

  useEffect(() => {
    if (gameId && isLoggedIn) {
      fetchGameRecord();
      fetchPlayers(); // 플레이어 목록도 함께 가져오기
    }
  }, [gameId, isLoggedIn, fetchGameRecord, fetchPlayers]);

  const handleApplyScores = async () => {
    if (!gameRecord) return;

    setApplying(true);
    try {
      const token = localStorage.getItem("token");
      const applyResponse = await axios.post(
        `${API_BASE_URL}/api/game-records/${gameRecord.gameId}/apply`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 디버깅: 점수 반영 API 응답 확인
      console.log("=== 점수 반영 API 응답 ===");
      console.log("응답 상태:", applyResponse.status);
      console.log("응답 데이터:", applyResponse.data);
      console.log("======================");

      alert("점수가 성공적으로 반영되었습니다!");

      // 서버에서 최신 데이터를 다시 가져와서 실제 상태 확인 (로딩 상태는 변경하지 않음)
      await fetchGameRecord(true);

      // Records 페이지로 돌아가면서 새로고침 트리거
      setTimeout(() => {
        navigate("/records", { state: { refreshNeeded: true } });
      }, 1000);
    } catch (error: any) {
      console.error("점수 반영 실패:", error);
      alert(error.response?.data || "점수 반영에 실패했습니다.");
    } finally {
      setApplying(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!gameRecord) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      const updateData = {
        team1Won: editData.team1Won,
        team1Kills: editData.team1Kills,
        team2Kills: editData.team2Kills,
        team1Gold: editData.team1Gold,
        team2Gold: editData.team2Gold,
        playerRecords: editData.playerRecords.map((p) => ({
          playerId: p.playerId,
          teamNumber: p.teamNumber,
          assignedPosition: p.assignedPosition,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          cs: p.cs,
        })),
      };

      await axios.put(
        `${API_BASE_URL}/api/game-records/${gameRecord.gameId}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("전적이 수정되었습니다!");
      setEditMode(false);
      await fetchGameRecord();
    } catch (error) {
      console.error("전적 수정 실패:", error);
      alert("전적 수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!gameRecord) return;

    if (!window.confirm("정말로 이 전적을 삭제하시겠습니까?")) {
      return;
    }

    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/game-records/${gameRecord.gameId}/delete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("전적이 성공적으로 삭제되었습니다!");
      navigate("/records", { state: { refreshNeeded: true } });
    } catch (error: any) {
      console.error("전적 삭제 실패:", error);
      alert(error.response?.data || "전적 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const updatePlayerRecord = (
    playerId: number,
    field: keyof PlayerGameRecord,
    value: number
  ) => {
    setEditData((prev) => ({
      ...prev,
      playerRecords: prev.playerRecords.map((record) =>
        record.playerId === playerId ? { ...record, [field]: value } : record
      ),
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getKDA = (kills: number, deaths: number, assists: number) => {
    const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
    return kda.toFixed(2);
  };

  const calculatePlayerScoreChange = (player: PlayerGameRecord) => {
    if (!gameRecord) return 0;

    // 승패에 따른 기본 점수 (승리 팀 +7점, 패배 팀 -7점)
    const isWinner =
      (player.teamNumber === 1 && gameRecord.team1Won) ||
      (player.teamNumber === 2 && !gameRecord.team1Won);
    const baseWinLossScore = isWinner ? 7.0 : -7.0;

    // 기본 점수 계산: (킬수 + 어시스트) / 데스수 (데스가 0이면 킬+어시스트)
    const baseScore =
      player.deaths === 0
        ? player.kills + player.assists
        : Math.round((player.kills + player.assists) / player.deaths);

    // 포지션별 가중치 적용
    const getPositionMultiplier = (position: string) => {
      switch (position) {
        case "TOP":
          return 3.0;
        case "JGL":
        case "MID":
          return 2.5;
        case "ADC":
        case "SUP":
          return 2.0;
        default:
          return 0.5;
      }
    };

    const positionMultiplier = getPositionMultiplier(player.assignedPosition);
    let weightedScore;

    if (isWinner) {
      // 승리 팀: 기존 방식 (KDA가 높을수록 높은 점수)
      weightedScore = baseScore * positionMultiplier;
      // 최소 +7점 보장
      weightedScore = Math.max(7.0, weightedScore);
    } else {
      // 패배 팀: 포지션 가중치를 먼저 적용한 후 역수 처리
      // KDA가 높을수록 덜 깎임 (최소 -5점 보장)
      const weightedBaseScore = baseScore * positionMultiplier;
      const inverseScore =
        weightedBaseScore === 0 ? 5.0 : Math.min(5.0, 10.0 / weightedBaseScore);
      weightedScore = -inverseScore; // 음수로 만들어서 감소점수로 만듦
    }

    // 승패에 따른 점수 적용
    let finalScore = isWinner ? weightedScore : weightedScore; // 패배 팀은 이미 음수

    // 승패 기본 점수 추가
    finalScore += baseWinLossScore;

    // 골드 보너스 적용
    const goldBonus = Math.round(
      (gameRecord.team1Gold / gameRecord.team2Gold) * 0.5
    );
    if (player.teamNumber === 1) {
      finalScore += isWinner ? goldBonus : -goldBonus;
    } else {
      finalScore += isWinner ? goldBonus : -goldBonus;
    }

    // 서폿 시야 보너스 적용
    if (player.assignedPosition === "SUP") {
      const opponentSupport = gameRecord.playerRecords.find(
        (p) =>
          p.assignedPosition === "SUP" && p.teamNumber !== player.teamNumber
      );

      if (opponentSupport) {
        const visionDiff = (player.cs - opponentSupport.cs) / 10;
        finalScore += isWinner ? visionDiff : -visionDiff;
      }
    }

    // CS 보너스 적용 (서폿 제외)
    if (player.assignedPosition !== "SUP") {
      // 같은 포지션의 상대방 찾기
      const opponent = gameRecord.playerRecords.find(
        (p) =>
          p.assignedPosition === player.assignedPosition &&
          p.teamNumber !== player.teamNumber
      );

      if (opponent) {
        // CS 차이 계산
        const csDifference = player.cs - opponent.cs;
        // 차이 / 5를 정수화
        const csBonus = csDifference / 5;
        // 승패에 따른 보너스 적용
        finalScore += isWinner ? csBonus : -csBonus;
      }
    }

    // 상대방과의 점수 격차 보너스/페널티 적용
    const opponent = gameRecord.playerRecords.find(
      (p) =>
        p.assignedPosition === player.assignedPosition &&
        p.teamNumber !== player.teamNumber
    );

    if (opponent) {
      const myScore = player.kills + player.assists; // 내 점수 (KDA 기반)
      const opponentScore = opponent.kills + opponent.assists; // 상대 점수 (KDA 기반)

      if (opponentScore > myScore) {
        // 상대방 점수가 높은 경우
        if (isWinner) {
          // 이긴 경우: (상대 점수 / 내 점수) * 2 추가
          const bonus = (opponentScore / myScore) * 2;
          finalScore += bonus;
        } else {
          // 진 경우: (내 점수 / 상대 점수) * 2 추가
          const bonus = (myScore / opponentScore) * 2;
          finalScore += bonus;
        }
      } else if (myScore > opponentScore) {
        // 내 점수가 높은 경우
        if (isWinner) {
          // 이긴 경우: (상대 점수 / 내 점수) * 2 빼기
          const penalty = (opponentScore / myScore) * 2;
          finalScore -= penalty;
        } else {
          // 진 경우: (내 점수 / 상대 점수) * 2 빼기
          const penalty = (myScore / opponentScore) * 2;
          finalScore -= penalty;
        }
      }
    }

    // 최종 점수 제한 적용
    if (isWinner) {
      finalScore = Math.max(7, Math.min(75, finalScore)); // 승리 팀 최소 +7점, 최대 +75점
    } else {
      finalScore = Math.min(-7, Math.max(-75, finalScore)); // 패배 팀 최소 -7점, 최대 -75점
    }

    return Math.round(finalScore);
  };

  const renderPlayerCard = (player: PlayerGameRecord, isWinner: boolean) => {
    const isEditing = editMode;
    const editPlayer =
      editData.playerRecords.find((p) => p.playerId === player.playerId) ||
      player;
    const scoreChange = calculatePlayerScoreChange(player);

    return (
      <div
        key={player.playerId}
        className={`bg-primary-light dark:bg-secondary-light rounded-lg p-4 border-2 ${
          isWinner
            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
            : "border-red-400 bg-red-50 dark:bg-red-900/20"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{player.assignedPosition}</h3>
            <p className="text-sm text-text-muted">{player.playerName}</p>
            <p className="text-xs text-text-muted">{player.lolId}</p>
          </div>
          <div className="text-right">
            {isEditing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div>
                    <label className="block text-xs text-text-muted mb-1">
                      K (킬)
                    </label>
                    <Input
                      type="number"
                      value={editPlayer.kills.toString()}
                      onChange={(e) =>
                        updatePlayerRecord(
                          player.playerId,
                          "kills",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">
                      D (데스)
                    </label>
                    <Input
                      type="number"
                      value={editPlayer.deaths.toString()}
                      onChange={(e) =>
                        updatePlayerRecord(
                          player.playerId,
                          "deaths",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1">
                      A (어시스트)
                    </label>
                    <Input
                      type="number"
                      value={editPlayer.assists.toString()}
                      onChange={(e) =>
                        updatePlayerRecord(
                          player.playerId,
                          "assists",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                {player.assignedPosition !== "SUP" ? (
                  <div className="mt-2">
                    <label className="block text-xs text-text-muted mb-1">
                      CS (미니언)
                    </label>
                    <Input
                      type="number"
                      value={editPlayer.cs.toString()}
                      onChange={(e) =>
                        updatePlayerRecord(
                          player.playerId,
                          "cs",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                      className="text-center"
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="block text-xs text-text-muted mb-1">
                      시야점수
                    </label>
                    <Input
                      type="number"
                      value={editPlayer.cs?.toString() || "0"}
                      onChange={(e) =>
                        updatePlayerRecord(
                          player.playerId,
                          "cs",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                      min="0"
                      className="text-center"
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {player.kills}/{player.deaths}/{player.assists}
                </div>
                <div className="text-sm text-text-muted">
                  KDA: {getKDA(player.kills, player.deaths, player.assists)}
                </div>
                {player.assignedPosition !== "SUP" ? (
                  <div className="text-sm text-text-muted">CS: {player.cs}</div>
                ) : (
                  <div className="text-sm text-text-muted">
                    시야점수: {player.cs}
                  </div>
                )}
                {gameRecord &&
                  gameRecord.team1Gold > 0 &&
                  gameRecord.team2Gold > 0 && (
                    <div className="text-sm font-semibold">
                      <span
                        className={
                          scoreChange >= 0
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {scoreChange >= 0 ? "+" : ""}
                        {scoreChange}점
                      </span>
                      {/* 반영이 안된 경우에만 프론트엔드에서 계산한 연승/연패 보너스 표시 */}
                      {!gameRecord.applied &&
                        (() => {
                          // 플레이어의 현재 연승/연패 상태 가져오기
                          const currentPlayer = players.find(
                            (p) => p.playerId === player.playerId
                          );
                          const currentStreak =
                            currentPlayer?.winLossStreak || 0;
                          const isWinner =
                            (player.teamNumber === 1 && gameRecord.team1Won) ||
                            (player.teamNumber === 2 && !gameRecord.team1Won);

                          // 미래 연승/연패 상태 계산
                          let futureStreak;
                          if (isWinner) {
                            futureStreak =
                              currentStreak < 0 ? 1 : currentStreak + 1;
                          } else {
                            futureStreak =
                              currentStreak > 0 ? -1 : currentStreak - 1;
                          }

                          // 보너스 계산
                          let streakBonus = 0;
                          if (isWinner) {
                            if (futureStreak >= 6) streakBonus = 5;
                            else if (futureStreak >= 4) streakBonus = 3;
                            else if (futureStreak >= 2) streakBonus = 2;
                          } else {
                            if (futureStreak <= -6) streakBonus = -5;
                            else if (futureStreak <= -4) streakBonus = -3;
                            else if (futureStreak <= -2) streakBonus = -2;
                          }

                          return streakBonus !== 0 ? (
                            <span className="text-yellow-500 dark:text-yellow-400">
                              {" "}
                              {streakBonus >= 0 ? "+" : ""}
                              {streakBonus}{" "}
                              {streakBonus > 0 ? "연승중" : "연패중"}
                            </span>
                          ) : null;
                        })()}
                      {/* 반영이 된 경우 백엔드에서 전송된 연승/연패 보너스 표시 */}
                      {gameRecord.applied &&
                        player.streakBonus !== undefined &&
                        player.streakBonus !== null &&
                        player.streakBonus !== 0 && (
                          <span className="text-yellow-500 dark:text-yellow-400">
                            {" "}
                            {player.streakBonus >= 0 ? "+" : ""}
                            {player.streakBonus}{" "}
                            {player.streakBonus > 0 ? "연승중" : "연패중"}
                          </span>
                        )}
                      {/* 총 점수 변화량 표시 (반영이 안된 경우에만) */}
                      {!gameRecord.applied &&
                        (() => {
                          const currentPlayer = players.find(
                            (p) => p.playerId === player.playerId
                          );
                          const currentStreak =
                            currentPlayer?.winLossStreak || 0;
                          const isWinner =
                            (player.teamNumber === 1 && gameRecord.team1Won) ||
                            (player.teamNumber === 2 && !gameRecord.team1Won);
                          let futureStreak;
                          if (isWinner) {
                            futureStreak =
                              currentStreak < 0 ? 1 : currentStreak + 1;
                          } else {
                            futureStreak =
                              currentStreak > 0 ? -1 : currentStreak - 1;
                          }
                          let streakBonus = 0;
                          if (isWinner) {
                            if (futureStreak >= 6) streakBonus = 5;
                            else if (futureStreak >= 4) streakBonus = 3;
                            else if (futureStreak >= 2) streakBonus = 2;
                          } else {
                            if (futureStreak <= -6) streakBonus = -5;
                            else if (futureStreak <= -4) streakBonus = -3;
                            else if (futureStreak <= -2) streakBonus = -2;
                          }

                          return streakBonus !== 0 ? (
                            <div className="text-sm font-semibold mt-1">
                              <span
                                className={
                                  scoreChange + streakBonus >= 0
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-red-600 dark:text-red-400"
                                }
                              >
                                총 {scoreChange + streakBonus >= 0 ? "+" : ""}
                                {scoreChange + streakBonus}점
                              </span>
                            </div>
                          ) : null;
                        })()}
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTeam = (teamNumber: number) => {
    const isTeam1 = teamNumber === 1;
    const currentRecord = editMode ? editData : gameRecord!;
    const teamPlayers = currentRecord.playerRecords.filter(
      (p) => p.teamNumber === teamNumber
    );
    const isWinner = isTeam1 ? currentRecord.team1Won : !currentRecord.team1Won;

    // 포지션 순서대로 정렬
    const positions = ["TOP", "JGL", "MID", "ADC", "SUP"];
    const sortedPlayers = teamPlayers.sort(
      (a, b) =>
        positions.indexOf(a.assignedPosition) -
        positions.indexOf(b.assignedPosition)
    );

    return (
      <div>
        <div className="text-center mb-6">
          <h2
            className={`text-2xl font-bold ${
              isTeam1
                ? "text-blue-600 dark:text-blue-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {teamNumber}팀
            {isWinner && (
              <span className="ml-2 px-2 py-1 bg-green-500 text-white text-sm rounded">
                승리
              </span>
            )}
          </h2>
        </div>
        <div className="space-y-3">
          {sortedPlayers.map((player) => renderPlayerCard(player, isWinner))}
        </div>
      </div>
    );
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

  if (!gameRecord) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="text-center mt-24">
          <h2 className="text-xl font-semibold mb-4">
            전적을 찾을 수 없습니다
          </h2>
          <Button onClick={() => navigate("/records")}>
            전적 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const currentData = editMode ? editData : gameRecord;

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mt-24 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">게임 #{gameRecord.gameId}</h1>
            <p className="text-text-muted">
              {formatDate(gameRecord.createdAt)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  gameRecord.applied
                    ? "bg-green-500 text-white"
                    : "bg-yellow-500 text-black"
                }`}
              >
                {gameRecord.applied ? "반영됨" : "미반영"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)}>취소</Button>
                <Button onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate("/records")}>돌아가기</Button>
                <Button onClick={() => setEditMode(true)}>수정하기</Button>
                {!gameRecord.applied ? (
                  <Button
                    onClick={handleApplyScores}
                    disabled={applying}
                    className="bg-green-500 dark:bg-green-700 hover:bg-green-400 dark:hover:bg-green-600"
                  >
                    {applying ? "반영 중..." : "결과 반영"}
                  </Button>
                ) : (
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold mt-3">
                    점수 반영 완료
                  </span>
                )}
                <Button
                  onClick={handleDeleteRecord}
                  disabled={deleting}
                  className="bg-red-500 dark:bg-red-700 hover:bg-red-400 dark:hover:bg-red-600"
                >
                  {deleting ? "삭제 중..." : "전적 삭제"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 게임 요약 */}
        <div className="bg-primary-light dark:bg-secondary-light rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">게임 요약</h2>

          {editMode && (
            <div className="mb-4">
              <div className="flex gap-4 justify-center mb-4">
                <Button
                  type="button"
                  variant={editData.team1Won ? "contained" : "outlined"}
                  onClick={() =>
                    setEditData((prev) => ({ ...prev, team1Won: true }))
                  }
                >
                  1팀 승리
                </Button>
                <Button
                  type="button"
                  variant={!editData.team1Won ? "contained" : "outlined"}
                  onClick={() =>
                    setEditData((prev) => ({ ...prev, team1Won: false }))
                  }
                >
                  2팀 승리
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">결과</p>
              <p
                className={`text-lg font-bold ${
                  currentData.team1Won
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {currentData.team1Won ? "1팀 승리" : "2팀 승리"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">킬수</p>
              {editMode ? (
                <div className="flex gap-2 justify-center">
                  <Input
                    type="number"
                    value={editData.team1Kills.toString()}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        team1Kills: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-16 text-center"
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    value={editData.team2Kills.toString()}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        team2Kills: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-16 text-center"
                  />
                </div>
              ) : (
                <p className="text-lg font-bold">
                  <span className="text-blue-600 dark:text-blue-400">
                    {currentData.team1Kills}
                  </span>{" "}
                  -{" "}
                  <span className="text-red-600 dark:text-red-400">
                    {currentData.team2Kills}
                  </span>
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm text-text-muted mb-1">골드</p>
              {editMode ? (
                <div className="flex gap-2 justify-center">
                  <Input
                    type="number"
                    value={editData.team1Gold.toString()}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        team1Gold: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-20 text-center"
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    value={editData.team2Gold.toString()}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        team2Gold: parseInt(e.target.value) || 0,
                      }))
                    }
                    min="0"
                    className="w-20 text-center"
                  />
                </div>
              ) : (
                <p className="text-lg font-bold">
                  <span className="text-blue-600 dark:text-blue-400">
                    {currentData.team1Gold.toLocaleString()}
                  </span>{" "}
                  -{" "}
                  <span className="text-red-600 dark:text-red-400">
                    {currentData.team2Gold.toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 팀별 플레이어 상세 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* 1팀 */}
          <div className="order-1">{renderTeam(1)}</div>

          {/* 2팀 */}
          <div className="order-2">{renderTeam(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetail;
