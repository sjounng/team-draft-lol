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
  isOwner?: boolean; // owner 여부
  isMember?: boolean; // 멤버 여부
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
  const { isLoggedIn, user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  // isMember, setIsMember 삭제
  // kdaOpponent 변수 삭제

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

  useEffect(() => {
    if (gameRecord && user) {
      setIsOwner(!!gameRecord.isOwner);
      setIsMember(!!gameRecord.isMember);
      // 디버깅용 로그
      console.log(
        "user.id:",
        user.id,
        "isOwner:",
        gameRecord.isOwner,
        "isMember:",
        gameRecord.isMember
      );
    }
  }, [gameRecord, user]);

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

    // 1. 승패 기본점수
    const isWinner =
      (player.teamNumber === 1 && gameRecord.team1Won) ||
      (player.teamNumber === 2 && !gameRecord.team1Won);
    let total = isWinner ? 0 : -15;

    // 2. KDA (포지션별 계수)
    const getKDA = (kills: number, deaths: number, assists: number) =>
      deaths === 0 ? kills + assists : (kills + assists) / deaths;
    const kda = getKDA(player.kills, player.deaths, player.assists);
    const opponent = gameRecord.playerRecords.find(
      (p) =>
        p.assignedPosition === player.assignedPosition &&
        p.teamNumber !== player.teamNumber
    );
    const laneCoef: Record<string, number> = {
      TOP: 1.5,
      JGL: 1.2,
      MID: 1.2,
      ADC: 1,
      SUP: 0.8,
    };
    const coef = laneCoef[player.assignedPosition] || 1;
    if (isWinner) {
      total += Math.round(kda * coef);
    } else {
      total -= Math.round(kda * coef);
    }

    // 3. 팀 골드 차이
    const myTeamGold =
      player.teamNumber === 1 ? gameRecord.team1Gold : gameRecord.team2Gold;
    const oppTeamGold =
      player.teamNumber === 1 ? gameRecord.team2Gold : gameRecord.team1Gold;
    const goldDiff = Math.round((myTeamGold / (oppTeamGold || 1)) * 3);
    total += isWinner ? goldDiff : -goldDiff;

    // 4. 팀 킬 차이
    const myTeamKills =
      player.teamNumber === 1 ? gameRecord.team1Kills : gameRecord.team2Kills;
    const oppTeamKills =
      player.teamNumber === 1 ? gameRecord.team2Kills : gameRecord.team1Kills;
    const killDiff = Math.round((myTeamKills - oppTeamKills) * 0.5);
    total += isWinner ? killDiff : -killDiff;

    // 5. 맞라이너와 CS(서폿은 시야점수) 차이
    if (opponent) {
      const cs = player.cs;
      const csOpponent = opponent.cs;
      let csCoefFactor = 3;
      const csCoef = Math.round(
        (Math.max(cs, csOpponent) / Math.max(Math.min(cs, csOpponent), 1)) *
          csCoefFactor
      );
      total += cs > csOpponent ? csCoef : -csCoef;
    }

    // 6. 맞라이너와 점수 차이
    if (opponent) {
      const myScore = player.beforeScore ?? 500;
      const oppScore = opponent.beforeScore ?? 500;
      if (myScore < oppScore) {
        if (!isWinner) {
          total += Math.round((oppScore / (myScore === 0 ? 1 : myScore)) * 2);
        } else {
          total += Math.round((oppScore / (myScore === 0 ? 1 : myScore)) * 5);
        }
      } else if (myScore > oppScore) {
        if (!isWinner) {
          total -= Math.round((myScore / (oppScore === 0 ? 1 : oppScore)) * 5);
        } else {
          total -= Math.round((myScore / (oppScore === 0 ? 1 : oppScore)) * 2);
        }
      }
    }

    // 7. 점수 제한
    if (isWinner) total = Math.max(10, Math.min(75, total));
    else total = Math.max(-75, Math.min(-10, total));

    // 8. 연승/연패 보너스 (별도)
    // 실제 반영은 streakBonus에서 처리

    return Math.round(total);
  };

  // 연승/연패 보너스 계산 함수 (백엔드와 동일하게)
  const getStreakBonus = (streak: number, isWinner: boolean) => {
    const futureStreak = isWinner
      ? streak < 0
        ? 1
        : streak + 1
      : streak > 0
      ? -1
      : streak - 1;
    if (isWinner) {
      if (futureStreak >= 2) return futureStreak;
      else return 0;
    } else {
      if (futureStreak <= -2) return futureStreak;
      else return 0;
    }
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
                          const streakBonus = getStreakBonus(
                            currentStreak,
                            isWinner
                          );
                          return streakBonus !== 0 ? (
                            <span className="text-yellow-500 dark:text-yellow-400">
                              {streakBonus >= 0 ? "+" : ""}
                              {streakBonus}{" "}
                              {streakBonus > 0 ? "연승중" : "연패중"}
                            </span>
                          ) : null;
                        })()}
                      {/* 반영이 된 경우 백엔드에서 전송된 연승/연패 보너스만 그대로 표시 */}
                      {gameRecord.applied &&
                        player.streakBonus !== undefined &&
                        player.streakBonus !== null &&
                        player.streakBonus !== 0 && (
                          <span className="text-yellow-500 dark:text-yellow-400">
                            {player.streakBonus > 0 ? "+" : ""}
                            {player.streakBonus}{" "}
                            {player.streakBonus > 0 ? "연승중" : "연패중"}
                          </span>
                        )}
                      {/* 총 점수 변화량 표시 (반영이 안된 경우에만) */}
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
                          const streakBonus = getStreakBonus(
                            currentStreak,
                            isWinner
                          );
                          const scoreChange =
                            calculatePlayerScoreChange(player);
                          const totalChange = scoreChange + streakBonus;
                          return (
                            <div className="text-sm font-semibold mt-1">
                              <span
                                className={
                                  totalChange >= 0
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-red-600 dark:text-red-400"
                                }
                              >
                                총 {totalChange >= 0 ? "+" : ""}
                                {totalChange}점
                              </span>
                              {streakBonus !== 0 && (
                                <span className="text-yellow-500 dark:text-yellow-400">
                                  {" "}
                                  {streakBonus >= 0 ? "+" : ""}
                                  {streakBonus}{" "}
                                  {streakBonus > 0 ? "연승중" : "연패중"}
                                </span>
                              )}
                            </div>
                          );
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
                {(isOwner || isMember) && (
                  <Button onClick={() => setEditMode(true)}>수정하기</Button>
                )}
                {isOwner && !gameRecord.applied ? (
                  <Button
                    onClick={handleApplyScores}
                    disabled={applying}
                    className="bg-green-500 dark:bg-green-700 hover:bg-green-400 dark:hover:bg-green-600"
                  >
                    {applying ? "반영 중..." : "결과 반영"}
                  </Button>
                ) : gameRecord.applied ? (
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold mt-3">
                    점수 반영 완료
                  </span>
                ) : null}
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
