import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TeamPlayerCard from "../components/TeamPlayerCard";
import Button from "../components/Button";
import LogoutMessage from "./LogoutMessage";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config/api";

interface TeamPlayer {
  playerId: number;
  name: string;
  lolId: string;
  originalScore: number;
  adjustedScore: number;
  assignedPosition: string;
  mainLane: string;
  subLane: string;
  positionType: "MAIN" | "SUB" | "FILL";
}

interface Team {
  teamNumber: number;
  players: TeamPlayer[];
  totalScore: number;
  topPlayer: TeamPlayer;
  junglePlayer: TeamPlayer;
  midPlayer: TeamPlayer;
  adcPlayer: TeamPlayer;
  supportPlayer: TeamPlayer;
}

interface TeamResultData {
  team1: Team;
  team2: Team;
  scoreDifference: number;
  currentCombination: number;
  totalCombinations: number;
  availableCombinations: number[];
  poolId: number; // 추가된 필드
}

const TeamResult = () => {
  const [teamResult, setTeamResult] = useState<TeamResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [customMode, setCustomMode] = useState(false); // 직접 구성하기 모드
  const [draggedPlayer, setDraggedPlayer] = useState<{
    player: TeamPlayer;
    fromTeam: number;
    fromPosition: string;
  } | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const savedResult = localStorage.getItem("teamResult");
    if (savedResult) {
      setTeamResult(JSON.parse(savedResult));
    } else {
      navigate("/team-create");
    }
  }, [navigate]);

  // 포지션별 점수 계산 함수
  const calculateAdjustedScore = (
    player: TeamPlayer,
    position: string
  ): number => {
    const baseScore = player.originalScore;
    let multiplier = 1.0;

    if (player.mainLane === position) {
      multiplier = 1.0;
    } else if (player.subLane === position) {
      multiplier = 0.8;
    } else {
      multiplier = 0.6;
    }

    return Math.round(baseScore * multiplier);
  };

  // 팀 전체 점수 재계산
  const recalculateTeamScore = (team: Team): number => {
    const positions = ["TOP", "JGL", "MID", "ADC", "SUP"];
    const positionKeys = [
      "topPlayer",
      "junglePlayer",
      "midPlayer",
      "adcPlayer",
      "supportPlayer",
    ];

    let totalScore = 0;
    positions.forEach((position, index) => {
      const positionKey = positionKeys[index];
      const player = team[positionKey as keyof Team] as TeamPlayer;
      totalScore += calculateAdjustedScore(player, position);
    });

    return totalScore;
  };

  // 플레이어 위치 교체 함수
  const swapPlayers = (
    fromTeam: number,
    fromPosition: string,
    toTeam: number,
    toPosition: string
  ) => {
    if (!teamResult) return;

    const positionMap: { [key: string]: keyof Team } = {
      TOP: "topPlayer",
      JGL: "junglePlayer",
      MID: "midPlayer",
      ADC: "adcPlayer",
      SUP: "supportPlayer",
    };

    const newTeamResult = { ...teamResult };
    const team1 = { ...newTeamResult.team1 };
    const team2 = { ...newTeamResult.team2 };

    const fromTeamData = fromTeam === 1 ? team1 : team2;
    const toTeamData = toTeam === 1 ? team1 : team2;

    const fromKey = positionMap[fromPosition];
    const toKey = positionMap[toPosition];

    const fromPlayer = fromTeamData[fromKey] as TeamPlayer;
    const toPlayer = toTeamData[toKey] as TeamPlayer;

    // 플레이어 교체
    (fromTeamData as any)[fromKey] = {
      ...toPlayer,
      assignedPosition: fromPosition,
      adjustedScore: calculateAdjustedScore(toPlayer, fromPosition),
      positionType:
        toPlayer.mainLane === fromPosition
          ? "MAIN"
          : toPlayer.subLane === fromPosition
          ? "SUB"
          : "FILL",
    };

    (toTeamData as any)[toKey] = {
      ...fromPlayer,
      assignedPosition: toPosition,
      adjustedScore: calculateAdjustedScore(fromPlayer, toPosition),
      positionType:
        fromPlayer.mainLane === toPosition
          ? "MAIN"
          : fromPlayer.subLane === toPosition
          ? "SUB"
          : "FILL",
    };

    // 팀 점수 재계산
    team1.totalScore = recalculateTeamScore(team1);
    team2.totalScore = recalculateTeamScore(team2);

    // 점수 차이 재계산
    newTeamResult.team1 = team1;
    newTeamResult.team2 = team2;
    newTeamResult.scoreDifference = Math.abs(
      team1.totalScore - team2.totalScore
    );

    setTeamResult(newTeamResult);
    localStorage.setItem("teamResult", JSON.stringify(newTeamResult));
  };

  // 드래그 시작
  const handleDragStart = (player: TeamPlayer, teamNumber: number) => {
    if (!customMode) return;
    setDraggedPlayer({
      player,
      fromTeam: teamNumber,
      fromPosition: player.assignedPosition,
    });
  };

  // 드롭 처리
  const handleDrop = (
    e: React.DragEvent,
    toTeam: number,
    toPosition: string
  ) => {
    e.preventDefault();
    if (!draggedPlayer || !customMode) return;

    if (
      draggedPlayer.fromTeam !== toTeam ||
      draggedPlayer.fromPosition !== toPosition
    ) {
      swapPlayers(
        draggedPlayer.fromTeam,
        draggedPlayer.fromPosition,
        toTeam,
        toPosition
      );
    }

    setDraggedPlayer(null);
  };

  // 드래그 오버 허용
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleReroll = async () => {
    if (!teamResult) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const playerIds = JSON.parse(
        localStorage.getItem("selectedPlayerIds") || "[]"
      );
      const nextCombination =
        teamResult.currentCombination % teamResult.totalCombinations;

      const response = await axios.post(
        `${API_BASE_URL}/api/teams/reroll`,
        { playerIds },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { combinationIndex: nextCombination },
        }
      );

      const newResult = response.data;
      setTeamResult(newResult);
      localStorage.setItem("teamResult", JSON.stringify(newResult));
    } catch (error) {
      console.error("리롤 실패:", error);
      alert("리롤에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewTeam = () => {
    localStorage.removeItem("teamResult");
    localStorage.removeItem("selectedPlayerIds");
    navigate("/team-create");
  };

  // 전적 생성 시 poolId 포함
  const handleCreateGameRecord = async () => {
    if (!teamResult) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      // poolId를 teamResult 또는 상위에서 받아와야 함 (예시)
      const poolId = teamResult.poolId;

      // 현재 포지션에 배치된 플레이어들로 전적 생성
      const team1Players = [
        teamResult.team1.topPlayer,
        teamResult.team1.junglePlayer,
        teamResult.team1.midPlayer,
        teamResult.team1.adcPlayer,
        teamResult.team1.supportPlayer,
      ];

      const team2Players = [
        teamResult.team2.topPlayer,
        teamResult.team2.junglePlayer,
        teamResult.team2.midPlayer,
        teamResult.team2.adcPlayer,
        teamResult.team2.supportPlayer,
      ];

      const playerRecords = [
        ...team1Players.map((player) => ({
          playerId: player.playerId,
          teamNumber: 1,
          assignedPosition: player.assignedPosition,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs: 0,
        })),
        ...team2Players.map((player) => ({
          playerId: player.playerId,
          teamNumber: 2,
          assignedPosition: player.assignedPosition,
          kills: 0,
          deaths: 0,
          assists: 0,
          cs: 0,
        })),
      ];

      const gameRecordData = {
        poolId, // poolId 포함
        team1Won: true, // 기본값
        team1Kills: 0,
        team2Kills: 0,
        team1Gold: 0,
        team2Gold: 0,
        playerRecords,
      };

      await axios.post(`${API_BASE_URL}/api/game-records`, gameRecordData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("전적이 생성되었습니다! 전적 페이지에서 상세 정보를 수정하세요.");
      navigate("/records");
    } catch (error) {
      console.error("전적 생성 실패:", error);
      alert("전적 생성에 실패했습니다.");
    } finally {
      setCreating(false);
    }
  };

  const renderTeamPlayers = (team: Team, teamNumber: number) => {
    const positions = [
      { key: "topPlayer", label: "TOP" },
      { key: "junglePlayer", label: "JGL" },
      { key: "midPlayer", label: "MID" },
      { key: "adcPlayer", label: "ADC" },
      { key: "supportPlayer", label: "SUP" },
    ];

    return positions.map(({ key, label }) => {
      const player = team[key as keyof Team] as TeamPlayer;
      return (
        <div key={label} className="mb-2">
          <TeamPlayerCard
            name={player.name}
            lolId={player.lolId}
            originalScore={player.originalScore}
            adjustedScore={player.adjustedScore}
            assignedPosition={player.assignedPosition}
            mainLane={player.mainLane}
            subLane={player.subLane}
            positionType={player.positionType}
            onDragStart={(e) => handleDragStart(player, teamNumber)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, teamNumber, label)}
            isDragged={
              draggedPlayer?.player.playerId === player.playerId &&
              draggedPlayer.fromTeam === teamNumber
            }
            isCustomMode={customMode}
          />
        </div>
      );
    });
  };

  if (!isLoggedIn) {
    return <LogoutMessage />;
  }

  if (!teamResult) {
    return (
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="text-center mt-24">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mb-6">
        <div className="text-center mt-16 mb-6">
          <h1 className="text-3xl font-bold mb-4">팀 구성 결과</h1>
          <div className="flex justify-center items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-sm text-text-muted">점수 차이</p>
              <p className="text-2xl font-bold text-accent-yellow">
                {teamResult.scoreDifference}점
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-muted">조합</p>
              <p className="text-xl font-semibold">
                {teamResult.currentCombination}/{teamResult.totalCombinations}
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <Button onClick={handleReroll} disabled={loading || customMode}>
              {loading ? "리롤 중..." : "다른 조합 보기"}
            </Button>
            <Button
              onClick={() => setCustomMode(!customMode)}
              className={customMode ? "!bg-orange-500 dark:!bg-orange-600" : ""}
            >
              {customMode ? "구성 완료" : "직접 구성하기"}
            </Button>
            <Button
              onClick={handleCreateGameRecord}
              disabled={creating || customMode}
              className="bg-green-500 dark:bg-green-700 hover:bg-green-400 dark:hover:bg-green-600"
            >
              {creating ? "생성 중..." : "전적 생성하기"}
            </Button>
            <Button onClick={handleNewTeam} disabled={customMode}>
              새 팀 만들기
            </Button>
          </div>

          {customMode && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-center text-blue-600 dark:text-blue-400">
                💡 <strong>직접 구성 모드</strong>: 플레이어 카드를 드래그해서
                위치를 바꿔보세요! 포지션에 따라 점수가 자동으로 계산됩니다.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1팀 */}
          <div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                1팀
              </h2>
              <p className="text-lg font-semibold">
                총 점수: {teamResult.team1.totalScore}점
              </p>
            </div>
            <div className="space-y-2">
              {renderTeamPlayers(teamResult.team1, 1)}
            </div>
          </div>

          {/* 2팀 */}
          <div>
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                2팀
              </h2>
              <p className="text-lg font-semibold">
                총 점수: {teamResult.team2.totalScore}점
              </p>
            </div>
            <div className="space-y-2">
              {renderTeamPlayers(teamResult.team2, 2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamResult;
