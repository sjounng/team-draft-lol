import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PlayerCard from "../components/PlayerCard";
import Button from "../components/Button";
import LogoutMessage from "./LogoutMessage";
import { useAuth } from "../contexts/AuthContext";
import API_BASE_URL from "../config/api";

interface Player {
  playerId: string;
  name: string;
  lolId: string;
  score: number;
  mainLane: string;
  subLane: string;
}

interface Pool {
  poolId: string;
  name: string;
  players: Player[];
}

const TeamBuilder = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<
    "available" | "selected" | null
  >(null);
  const [dragOverArea, setDragOverArea] = useState<
    "available" | "selected" | null
  >(null);
  const [checkedPlayers, setCheckedPlayers] = useState<Set<string>>(new Set());
  const teamGenerationRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  // 계산된 값들
  const availablePlayers = allPlayers.filter(
    (player) => !selectedPlayerIds.has(player.playerId)
  );
  const selectedPlayers = allPlayers.filter((player) =>
    selectedPlayerIds.has(player.playerId)
  );

  const fetchPool = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/pools/${poolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const poolData = response.data;
      setPool(poolData);
      setAllPlayers(poolData.players || []);
      setSelectedPlayerIds(new Set()); // 초기화
    } catch (error) {
      console.error("Failed to fetch pool:", error);
      navigate("/team-create");
    } finally {
      setLoading(false);
    }
  }, [poolId, navigate]);

  useEffect(() => {
    if (poolId) {
      fetchPool();
    }
  }, [poolId, fetchPool]);

  useEffect(() => {
    if (selectedPlayerIds.size === 10 && teamGenerationRef.current) {
      teamGenerationRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedPlayerIds.size]);

  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayerIds.size >= 10) {
      alert("최대 10명까지만 선택할 수 있습니다.");
      return;
    }

    setSelectedPlayerIds((prev) => new Set(prev).add(player.playerId));

    // 체크 해제
    setCheckedPlayers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(player.playerId);
      return newSet;
    });
  };

  const handlePlayerDeselect = (player: Player) => {
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(player.playerId);
      return newSet;
    });
  };

  // 체크박스 상태 변경
  const handlePlayerCheck = (playerId: string, checked: boolean) => {
    setCheckedPlayers((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(playerId);
      } else {
        newSet.delete(playerId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (checkedPlayers.size === availablePlayers.length) {
      // 전체 해제
      setCheckedPlayers(new Set());
    } else {
      // 전체 선택
      setCheckedPlayers(new Set(availablePlayers.map((p) => p.playerId)));
    }
  };

  // 체크된 플레이어들 일괄 추가
  const handleAddCheckedPlayers = () => {
    const checkedPlayersList = availablePlayers.filter((p) =>
      checkedPlayers.has(p.playerId)
    );

    if (checkedPlayersList.length === 0) {
      alert("추가할 플레이어를 선택해주세요.");
      return;
    }

    if (selectedPlayerIds.size + checkedPlayersList.length > 10) {
      alert(
        `최대 10명까지만 선택할 수 있습니다. (현재: ${selectedPlayerIds.size}명, 추가하려는: ${checkedPlayersList.length}명)`
      );
      return;
    }

    // 선택된 플레이어들을 팀에 추가
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev);
      checkedPlayersList.forEach((player) => newSet.add(player.playerId));
      return newSet;
    });
    setCheckedPlayers(new Set());
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, player: Player) => {
    setDraggedPlayer(player);

    // 어느 영역에서 드래그가 시작되었는지 확인
    const isFromAvailable = !selectedPlayerIds.has(player.playerId);
    setDraggedFrom(isFromAvailable ? "available" : "selected");

    e.dataTransfer.effectAllowed = "move";
  };

  // 드래그 오버 (드롭 영역 위에 있을 때)
  const handleDragOver = (
    e: React.DragEvent,
    area: "available" | "selected"
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverArea(area);
  };

  // 드래그 떠날 때
  const handleDragLeave = () => {
    setDragOverArea(null);
  };

  // 드롭 (놓기)
  const handleDrop = (
    e: React.DragEvent,
    targetArea: "available" | "selected"
  ) => {
    e.preventDefault();
    setDragOverArea(null);

    if (!draggedPlayer || !draggedFrom) return;

    // 같은 영역에 드롭하면 아무것도 안함
    if (draggedFrom === targetArea) {
      setDraggedPlayer(null);
      setDraggedFrom(null);
      return;
    }

    // available에서 selected로 이동
    if (draggedFrom === "available" && targetArea === "selected") {
      if (selectedPlayerIds.size >= 10) {
        alert("최대 10명까지만 선택할 수 있습니다.");
        setDraggedPlayer(null);
        setDraggedFrom(null);
        return;
      }
      handlePlayerSelect(draggedPlayer);
    }
    // selected에서 available로 이동
    else if (draggedFrom === "selected" && targetArea === "available") {
      handlePlayerDeselect(draggedPlayer);
    }

    setDraggedPlayer(null);
    setDraggedFrom(null);
  };

  const handleCreateTeam = async () => {
    if (selectedPlayerIds.size !== 10) {
      alert("정확히 10명의 플레이어를 선택해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const playerIds = Array.from(selectedPlayerIds).map((id) => parseInt(id));

      const response = await axios.post(
        `${API_BASE_URL}/api/teams/generate`,
        { playerIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // 팀 결과를 localStorage에 저장하고 팀 결과 페이지로 이동
      const teamResult = {
        ...response.data,
        poolId: parseInt(poolId!), // poolId 추가
      };
      localStorage.setItem("teamResult", JSON.stringify(teamResult));
      navigate("/team-result");
    } catch (error) {
      console.error("팀 생성 실패:", error);
      alert("팀 생성에 실패했습니다.");
    }
  };

  const handleReset = () => {
    setSelectedPlayerIds(new Set());
    setCheckedPlayers(new Set());
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
          <Button onClick={() => navigate("/team-create")}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="mb-8">
        <div className="flex items-center justify-between mt-24 mb-6">
          <div>
            <h1 className="text-3xl font-bold">{pool.name} - 팀 빌더</h1>
            <p className="text-text-muted">
              플레이어를 선택하여 팀을 구성하세요 ({selectedPlayerIds.size}/10)
            </p>
            <p className="text-sm text-text-muted mt-1">
              💡 플레이어 카드를 클릭하거나 드래그해서 이동할 수 있습니다
            </p>
            <p className="text-sm text-text-muted mt-1">
              💡 체크박스를 이용해 여러 플레이어를 한번에 선택할 수도 있습니다
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleReset}>초기화</Button>
            <Button onClick={() => navigate("/team-create")}>
              다른 풀 선택
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 좌측: 사용 가능한 플레이어 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                선택 가능 ({availablePlayers.length}명)
              </h2>
              {availablePlayers.length > 0 && (
                <div className="flex gap-3">
                  <Button onClick={handleSelectAll}>
                    {checkedPlayers.size === availablePlayers.length
                      ? "전체 해제"
                      : "전체 선택"}
                  </Button>
                  {checkedPlayers.size > 0 && (
                    <Button onClick={handleAddCheckedPlayers}>
                      선택된 {checkedPlayers.size}명 추가
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div
              className={`bg-primary-light dark:bg-secondary-light rounded-lg p-4 min-h-[400px] border-2 border-dashed transition-all duration-200 ${
                dragOverArea === "available"
                  ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                  : "border-primary-dark/20 dark:border-secondary-dark/20"
              }`}
              onDragOver={(e) => handleDragOver(e, "available")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "available")}
            >
              {availablePlayers.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  모든 플레이어가 선택되었습니다
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availablePlayers.map((player) => (
                    <div key={player.playerId}>
                      <PlayerCard
                        id={parseInt(player.playerId)}
                        name={player.name}
                        score={player.score}
                        mainLane={player.mainLane}
                        subLane={player.subLane}
                        onClick={() => handlePlayerSelect(player)}
                        showDeleteButton={false}
                        draggable={true}
                        onDragStart={handleDragStart}
                        playerData={player}
                        showCheckbox={true}
                        checked={checkedPlayers.has(player.playerId)}
                        onCheck={(checked) =>
                          handlePlayerCheck(player.playerId, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 우측: 선택된 플레이어 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold mt-2 mb-2">
                선택됨 ({selectedPlayerIds.size}/10명)
              </h2>
            </div>
            <div
              className={`bg-primary-light dark:bg-secondary-light rounded-lg p-4 min-h-[400px] transition-all duration-200 ${
                selectedPlayers.length > 0
                  ? ""
                  : "border-2 border-dashed border-blue-400/40"
              } ${
                dragOverArea === "selected"
                  ? "border-2 border-blue-600 bg-blue-100 dark:bg-blue-800/30"
                  : ""
              }`}
              onDragOver={(e) => handleDragOver(e, "selected")}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, "selected")}
            >
              {selectedPlayers.length === 0 ? (
                <div className="text-center text-text-muted py-8">
                  플레이어를 선택해주세요
                  <br />
                  <span className="text-xs">카드를 여기로 드래그하세요</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {selectedPlayers.map((player) => (
                    <div key={player.playerId}>
                      <PlayerCard
                        id={parseInt(player.playerId)}
                        name={player.name}
                        score={player.score}
                        mainLane={player.mainLane}
                        subLane={player.subLane}
                        onClick={() => handlePlayerDeselect(player)}
                        showDeleteButton={false}
                        className="border-2 border-blue-400/50"
                        draggable={true}
                        onDragStart={handleDragStart}
                        playerData={player}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 팀 생성 버튼 */}
        <div className="text-center mt-8" ref={teamGenerationRef}>
          <Button
            onClick={handleCreateTeam}
            disabled={selectedPlayerIds.size !== 10}
            className="bg-green-500 hover:bg-green-400 dark:hover:bg-green-600 text-white"
          >
            팀 생성 ({selectedPlayerIds.size}/10)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamBuilder;
