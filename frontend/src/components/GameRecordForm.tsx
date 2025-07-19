import React, { useState } from "react";
import axios from "axios";
import Button from "./Button";
import Input from "./Input";

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

interface TeamResult {
  team1: Team;
  team2: Team;
  scoreDifference: number;
  currentCombination: number;
  totalCombinations: number;
  availableCombinations: number[];
}

interface PlayerRecord {
  playerId: number;
  teamNumber: number;
  assignedPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number; // 미니언 처치 수 (서폿의 경우 시야점수)
}

interface GameRecordFormProps {
  teamResult: TeamResult;
  onClose: () => void;
  onSuccess: () => void;
}

const GameRecordForm: React.FC<GameRecordFormProps> = ({
  teamResult,
  onClose,
  onSuccess,
}) => {
  const [team1Won, setTeam1Won] = useState<boolean | null>(null);
  const [team1Kills, setTeam1Kills] = useState<number>(0);
  const [team2Kills, setTeam2Kills] = useState<number>(0);
  const [team1Gold, setTeam1Gold] = useState<number>(0);
  const [team2Gold, setTeam2Gold] = useState<number>(0);
  const [playerRecords, setPlayerRecords] = useState<PlayerRecord[]>(() => {
    // 초기 플레이어 기록 생성
    const records: PlayerRecord[] = [];

    // 1팀 플레이어들
    [
      teamResult.team1.topPlayer,
      teamResult.team1.junglePlayer,
      teamResult.team1.midPlayer,
      teamResult.team1.adcPlayer,
      teamResult.team1.supportPlayer,
    ].forEach((player) => {
      records.push({
        playerId: player.playerId,
        teamNumber: 1,
        assignedPosition: player.assignedPosition,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
      });
    });

    // 2팀 플레이어들
    [
      teamResult.team2.topPlayer,
      teamResult.team2.junglePlayer,
      teamResult.team2.midPlayer,
      teamResult.team2.adcPlayer,
      teamResult.team2.supportPlayer,
    ].forEach((player) => {
      records.push({
        playerId: player.playerId,
        teamNumber: 2,
        assignedPosition: player.assignedPosition,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
      });
    });

    return records;
  });
  const [submitting, setSubmitting] = useState(false);

  const updatePlayerRecord = (
    playerId: number,
    field: keyof PlayerRecord,
    value: number
  ) => {
    setPlayerRecords((prev) =>
      prev.map((record) =>
        record.playerId === playerId ? { ...record, [field]: value } : record
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (team1Won === null) {
      alert("승리 팀을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");

      const gameRecordData = {
        team1Won,
        team1Kills,
        team2Kills,
        team1Gold,
        team2Gold,
        playerRecords,
      };

      await axios.post(
        "http://localhost:8080/api/game-records",
        gameRecordData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onSuccess();
    } catch (error) {
      console.error("전적 저장 실패:", error);
      alert("전적 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTeamPlayers = (team: Team, teamNumber: number) => {
    const teamPlayers = [
      team.topPlayer,
      team.junglePlayer,
      team.midPlayer,
      team.adcPlayer,
      team.supportPlayer,
    ];

    return teamPlayers.map((player) => {
      const record = playerRecords.find((r) => r.playerId === player.playerId);
      if (!record) return null;

      return (
        <div
          key={player.playerId}
          className="bg-primary-light dark:bg-secondary-light p-3 rounded mb-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{player.assignedPosition}</span>
            <span className="text-sm text-text-muted">{player.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="block text-xs text-text-muted mb-1">
                K (킬)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={record.kills.toString()}
                onChange={(e) =>
                  updatePlayerRecord(
                    player.playerId,
                    "kills",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                D (데스)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={record.deaths.toString()}
                onChange={(e) =>
                  updatePlayerRecord(
                    player.playerId,
                    "deaths",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">
                A (어시스트)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={record.assists.toString()}
                onChange={(e) =>
                  updatePlayerRecord(
                    player.playerId,
                    "assists",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
              />
            </div>
          </div>
          {player.assignedPosition !== "SUP" ? (
            <div>
              <label className="block text-xs text-text-muted mb-1">
                CS (미니언)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={record.cs?.toString() || "0"}
                onChange={(e) =>
                  updatePlayerRecord(
                    player.playerId,
                    "cs",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-text-muted mb-1">
                시야점수
              </label>
              <Input
                type="number"
                placeholder="0"
                value={record.cs?.toString() || "0"}
                onChange={(e) =>
                  updatePlayerRecord(
                    player.playerId,
                    "cs",
                    parseInt(e.target.value) || 0
                  )
                }
                min="0"
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary dark:bg-secondary rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">전적 생성</h2>
          <Button onClick={onClose}>닫기</Button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 승부 결과 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">승부 결과</h3>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={team1Won === true ? "contained" : "outlined"}
                onClick={() => setTeam1Won(true)}
              >
                1팀 승리
              </Button>
              <Button
                type="button"
                variant={team1Won === false ? "contained" : "outlined"}
                onClick={() => setTeam1Won(false)}
              >
                2팀 승리
              </Button>
            </div>
          </div>

          {/* 팀 통계 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 1팀 통계 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                1팀 통계
              </h3>
              <div className="space-y-3">
                <Input
                  label="팀 킬수"
                  type="number"
                  value={team1Kills.toString()}
                  onChange={(e) => setTeam1Kills(parseInt(e.target.value) || 0)}
                  min="0"
                />
                <Input
                  label="획득 골드"
                  type="number"
                  value={team1Gold.toString()}
                  onChange={(e) => setTeam1Gold(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>

            {/* 2팀 통계 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">
                2팀 통계
              </h3>
              <div className="space-y-3">
                <Input
                  label="팀 킬수"
                  type="number"
                  value={team2Kills.toString()}
                  onChange={(e) => setTeam2Kills(parseInt(e.target.value) || 0)}
                  min="0"
                />
                <Input
                  label="획득 골드"
                  type="number"
                  value={team2Gold.toString()}
                  onChange={(e) => setTeam2Gold(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* 개별 플레이어 기록 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 1팀 플레이어 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">
                1팀 개별 기록 (K/D/A)
              </h3>
              {renderTeamPlayers(teamResult.team1, 1)}
            </div>

            {/* 2팀 플레이어 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">
                2팀 개별 기록 (K/D/A)
              </h3>
              {renderTeamPlayers(teamResult.team2, 2)}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3">
            <Button type="button" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "저장 중..." : "전적 저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameRecordForm;
