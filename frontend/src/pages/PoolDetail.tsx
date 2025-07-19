// src/pages/PoolDetail.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import LogoutMessage from "./LogoutMessage";
import API_BASE_URL from "../config/api";
import PlayerCard from "../components/PlayerCard";
import Button from "../components/Button";
import Input from "../components/Input";

const LANE_OPTIONS = ["TOP", "JGL", "MID", "ADC", "SUP"] as const;
type Lane = (typeof LANE_OPTIONS)[number];

// 롤 티어 시스템 정의 (1000점 만점, 정규분포 기반)
const TIER_OPTIONS = [
  { label: "아이언 4", value: "IRON_4", score: 50 },
  { label: "아이언 3", value: "IRON_3", score: 80 },
  { label: "아이언 2", value: "IRON_2", score: 110 },
  { label: "아이언 1", value: "IRON_1", score: 140 },
  { label: "브론즈 4", value: "BRONZE_4", score: 170 },
  { label: "브론즈 3", value: "BRONZE_3", score: 200 },
  { label: "브론즈 2", value: "BRONZE_2", score: 230 },
  { label: "브론즈 1", value: "BRONZE_1", score: 260 },
  { label: "실버 4", value: "SILVER_4", score: 300 },
  { label: "실버 3", value: "SILVER_3", score: 340 },
  { label: "실버 2", value: "SILVER_2", score: 380 },
  { label: "실버 1", value: "SILVER_1", score: 420 },
  { label: "골드 4", value: "GOLD_4", score: 460 },
  { label: "골드 3", value: "GOLD_3", score: 500 },
  { label: "골드 2", value: "GOLD_2", score: 540 },
  { label: "골드 1", value: "GOLD_1", score: 580 },
  { label: "플래티넘 4", value: "PLATINUM_4", score: 620 },
  { label: "플래티넘 3", value: "PLATINUM_3", score: 660 },
  { label: "플래티넘 2", value: "PLATINUM_2", score: 700 },
  { label: "플래티넘 1", value: "PLATINUM_1", score: 740 },
  { label: "에메랄드 4", value: "EMERALD_4", score: 770 },
  { label: "에메랄드 3", value: "EMERALD_3", score: 790 },
  { label: "에메랄드 2", value: "EMERALD_2", score: 810 },
  { label: "에메랄드 1", value: "EMERALD_1", score: 830 },
  { label: "다이아몬드 4", value: "DIAMOND_4", score: 850 },
  { label: "다이아몬드 3", value: "DIAMOND_3", score: 870 },
  { label: "다이아몬드 2", value: "DIAMOND_2", score: 890 },
  { label: "다이아몬드 1", value: "DIAMOND_1", score: 910 },
  { label: "마스터", value: "MASTER", score: 940 },
  { label: "그랜드마스터", value: "GRANDMASTER", score: 970 },
  { label: "챌린저", value: "CHALLENGER", score: 1000 },
] as const;

type Tier = (typeof TIER_OPTIONS)[number]["value"];

interface Player {
  playerId: number;
  name: string;
  lolId: string;
  score: number;
  mainLane: Lane;
  subLane: Lane;
}

interface Pool {
  poolId: number;
  name: string;
  createdAt: string;
  players: Player[];
}

interface ValidationError {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  errors: ValidationError[];
}

const PoolDetail = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<Pool | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState({
    name: "",
    lolId: "",
    tier: "" as Tier | "",
    mainLane: "" as Lane,
    subLane: "" as Lane,
  });
  const [editForm, setEditForm] = useState({
    name: "",
    lolId: "",
    score: 0,
    mainLane: "" as Lane,
    subLane: "" as Lane,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [editErrors, setEditErrors] = useState<ValidationError[]>([]);
  const navigate = useNavigate();

  const getScoreFromTier = (tier: Tier | ""): number => {
    if (!tier) return 500; // 기본값 (정규분포 평균)
    const tierOption = TIER_OPTIONS.find((option) => option.value === tier);
    return tierOption ? tierOption.score : 500;
  };

  const fetchPool = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get(`${API_BASE_URL}/api/pools/${poolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPool(res.data);
      setPlayers(res.data.players || []);
    } catch (err) {
      console.error("풀 정보 불러오기 실패:", err);
    }
  }, [poolId, navigate]);

  useEffect(() => {
    if (poolId) {
      fetchPool();
    }
  }, [poolId, fetchPool]);

  const handleAddPlayer = async () => {
    try {
      setErrors([]); // 에러 초기화
      const token = localStorage.getItem("token");

      // 티어에 따른 스코어 계산
      const calculatedScore = getScoreFromTier(form.tier);

      await axios.post(
        `${API_BASE_URL}/api/pools/${poolId}/players`,
        {
          name: form.name,
          lolId: form.lolId,
          score: calculatedScore,
          mainLane: form.mainLane,
          subLane: form.subLane,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowModal(false);
      setForm({
        name: "",
        lolId: "",
        tier: "" as Tier | "",
        mainLane: "" as Lane,
        subLane: "" as Lane,
      });
      fetchPool();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data as ApiErrorResponse;
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          alert("플레이어 추가 실패");
        }
      } else {
        alert("플레이어 추가 실패");
      }
    }
  };

  const handleEditPlayer = async () => {
    try {
      setEditErrors([]); // 에러 초기화
      const token = localStorage.getItem("token");

      // 티어에 따른 스코어 계산
      const calculatedScore = editForm.score;

      await axios.put(
        `${API_BASE_URL}/api/pools/${poolId}/players/${editingPlayer?.playerId}`,
        {
          name: editForm.name,
          lolId: editForm.lolId,
          score: calculatedScore,
          mainLane: editForm.mainLane,
          subLane: editForm.subLane,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setShowEditModal(false);
      setEditForm({
        name: "",
        lolId: "",
        score: 0,
        mainLane: "" as Lane,
        subLane: "" as Lane,
      });
      setEditingPlayer(null);
      fetchPool();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data) {
        const errorData = err.response.data as ApiErrorResponse;
        if (errorData.errors) {
          setEditErrors(errorData.errors);
        } else {
          alert("플레이어 수정 실패");
        }
      } else {
        alert("플레이어 수정 실패");
      }
    }
  };

  const handleDeletePlayer = async () => {
    if (!editingPlayer) return;

    if (
      !window.confirm(
        `정말로 "${editingPlayer.name}" 플레이어를 삭제하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${API_BASE_URL}/api/players/${editingPlayer.playerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowEditModal(false);
      setEditForm({
        name: "",
        lolId: "",
        score: 0,
        mainLane: "" as Lane,
        subLane: "" as Lane,
      });
      setEditingPlayer(null);
      fetchPool();
      alert("플레이어가 성공적으로 삭제되었습니다.");
    } catch (error) {
      console.error("플레이어 삭제 실패:", error);
      alert("플레이어 삭제에 실패했습니다.");
    }
  };

  const handleDeletePool = async () => {
    if (!pool) return;

    if (
      !window.confirm(
        `정말로 "${pool.name}" 풀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/pools/${poolId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("풀이 성공적으로 삭제되었습니다.");
      navigate("/players");
    } catch (error: any) {
      console.error("풀 삭제 실패:", error);
      if (error.response?.data) {
        alert(error.response.data);
      } else {
        alert("풀 삭제에 실패했습니다.");
      }
    }
  };

  const getErrorMessage = (field: string) => {
    return errors.find((error) => error.field === field)?.message;
  };

  const getEditErrorMessage = (field: string) => {
    return editErrors.find((error) => error.field === field)?.message;
  };

  const handlePlayerClick = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      name: player.name,
      lolId: player.lolId,
      score: player.score,
      mainLane: player.mainLane,
      subLane: player.subLane,
    });
    setShowEditModal(true);
  };

  if (!pool) return <div>로딩중...</div>;

  return (
    <div className="container mx-auto px-4 py-8 pt-16">
      <div className="flex items-center justify-between mt-24 mb-6">
        <h1 className="text-3xl font-bold">{pool.name}</h1>
        <Button
          onClick={handleDeletePool}
          className="bg-red-500 hover:bg-red-400 dark:hover:bg-red-600 text-white"
        >
          풀 삭제
        </Button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">플레이어 목록</h2>
        <Button onClick={() => setShowModal(true)}>플레이어 추가</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.length === 0 ? (
          <div>아직 등록된 플레이어가 없습니다.</div>
        ) : (
          players.map((player) => (
            <PlayerCard
              key={player.playerId}
              id={player.playerId}
              name={player.name}
              score={player.score}
              mainLane={player.mainLane}
              subLane={player.subLane}
              onClick={() => handlePlayerClick(player)}
              onDelete={fetchPool}
              showDeleteButton={false}
            />
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-primary-light dark:bg-secondary-light p-8 rounded-lg w-full max-w-md shadow-md">
            <h3 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-secondary mb-6">
              플레이어 추가
            </h3>
            <div className="space-y-6">
              <Input
                type="text"
                className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
                label="이름"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={getErrorMessage("name")}
              />
              <Input
                type="text"
                className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
                label="롤 아이디"
                value={form.lolId}
                onChange={(e) => setForm({ ...form, lolId: e.target.value })}
                error={getErrorMessage("lolId")}
              />
              <div className="mb-4">
                <label
                  htmlFor="tier"
                  className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
                >
                  티어
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary border-secondary dark:border-primary"
                  value={form.tier}
                  onChange={(e) =>
                    setForm({ ...form, tier: e.target.value as Tier })
                  }
                >
                  <option value="">티어 선택</option>
                  {TIER_OPTIONS.map((tierOption) => (
                    <option key={tierOption.value} value={tierOption.value}>
                      {tierOption.label}
                    </option>
                  ))}
                </select>
                {form.tier && (
                  <p className="text-accent-yellow text-sm mt-1 font-medium">
                    예상 스코어: {getScoreFromTier(form.tier)}점
                  </p>
                )}
                {getErrorMessage("tier") && (
                  <p className="text-red-500 text-xs mt-1">
                    {getErrorMessage("tier")}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="mainLane"
                  className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
                >
                  주 라인
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary border-secondary dark:border-primary"
                  value={form.mainLane}
                  onChange={(e) =>
                    setForm({ ...form, mainLane: e.target.value as Lane })
                  }
                >
                  <option value="">주 라인 선택</option>
                  {LANE_OPTIONS.map((lane) => (
                    <option key={lane} value={lane}>
                      {lane}
                    </option>
                  ))}
                </select>
                {getErrorMessage("mainLane") && (
                  <p className="text-red-500 text-xs mt-1">
                    {getErrorMessage("mainLane")}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="subLane"
                  className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
                >
                  부 라인
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary border-secondary dark:border-primary"
                  value={form.subLane}
                  onChange={(e) =>
                    setForm({ ...form, subLane: e.target.value as Lane })
                  }
                >
                  <option value="">부 라인 선택</option>
                  {LANE_OPTIONS.map((lane) => (
                    <option key={lane} value={lane}>
                      {lane}
                    </option>
                  ))}
                </select>
                {getErrorMessage("subLane") && (
                  <p className="text-red-500 text-xs mt-1">
                    {getErrorMessage("subLane")}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button onClick={() => setShowModal(false)}>취소</Button>
                <Button onClick={handleAddPlayer}>추가</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-primary-light dark:bg-secondary-light p-8 rounded-lg w-full max-w-md shadow-md">
            <h3 className="text-center text-3xl font-extrabold text-text-primary dark:text-text-secondary mb-6">
              플레이어 수정
            </h3>
            <div className="space-y-6">
              <Input
                type="text"
                className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
                label="이름"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                error={getEditErrorMessage("name")}
              />
              <Input
                type="text"
                className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
                label="롤 아이디"
                value={editForm.lolId}
                onChange={(e) =>
                  setEditForm({ ...editForm, lolId: e.target.value })
                }
                error={getEditErrorMessage("lolId")}
              />
              <div className="mb-4">
                <label
                  htmlFor="editScore"
                  className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
                >
                  스코어
                </label>
                <Input
                  type="number"
                  className="bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary"
                  value={editForm.score.toString()}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      score: parseInt(e.target.value) || 0,
                    })
                  }
                  error={getEditErrorMessage("score")}
                />
                {getEditErrorMessage("score") && (
                  <p className="text-red-500 text-xs mt-1">
                    {getEditErrorMessage("score")}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="editMainLane"
                  className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
                >
                  주 라인
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary border-secondary dark:border-primary"
                  value={editForm.mainLane}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      mainLane: e.target.value as Lane,
                    })
                  }
                >
                  <option value="">주 라인 선택</option>
                  {LANE_OPTIONS.map((lane) => (
                    <option key={lane} value={lane}>
                      {lane}
                    </option>
                  ))}
                </select>
                {getEditErrorMessage("mainLane") && (
                  <p className="text-red-500 text-xs mt-1">
                    {getEditErrorMessage("mainLane")}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label
                  htmlFor="editSubLane"
                  className="block text-text-primary dark:text-text-secondary text-sm font-bold mb-2"
                >
                  부 라인
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-secondary bg-primary-light dark:bg-secondary-light text-text-primary dark:text-text-secondary border-secondary dark:border-primary"
                  value={editForm.subLane}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      subLane: e.target.value as Lane,
                    })
                  }
                >
                  <option value="">부 라인 선택</option>
                  {LANE_OPTIONS.map((lane) => (
                    <option key={lane} value={lane}>
                      {lane}
                    </option>
                  ))}
                </select>
                {getEditErrorMessage("subLane") && (
                  <p className="text-red-500 text-xs mt-1">
                    {getEditErrorMessage("subLane")}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button onClick={() => setShowEditModal(false)}>취소</Button>
                <Button onClick={handleEditPlayer}>수정</Button>
                <Button
                  onClick={handleDeletePlayer}
                  className="bg-red-500 hover:bg-red-400 dark:hover:bg-red-600 text-white"
                >
                  삭제
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoolDetail;
