import type { FC } from "react";
import Button from "./Button";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface PlayerCardProps {
  id: number;
  name: string;
  score: number;
  mainLane: string;
  subLane: string;
  onClick?: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, player: any) => void;
  playerData?: any;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
}

const PlayerCard: FC<PlayerCardProps> = ({
  id,
  name,
  score,
  mainLane,
  subLane,
  onClick,
  onDelete,
  showDeleteButton = true,
  className = "",
  draggable = false,
  onDragStart,
  playerData,
  showCheckbox = false,
  checked = false,
  onCheck,
}) => {
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 버블링 방지
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.delete(`http://localhost:8080/api/players/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (onDelete) {
        onDelete(); // 부모 컴포넌트에서 리스트 새로고침
      }
    } catch (error) {
      console.error("플레이어 삭제 실패:", error);
      alert("플레이어 삭제에 실패했습니다.");
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && playerData) {
      onDragStart(e, playerData);
    }
    // 드래그 중 투명도 효과
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // 드래그 종료 시 투명도 복원
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지
    if (onCheck) {
      onCheck(e.target.checked);
    }
  };

  return (
    <div
      className={`w-full bg-primary-light dark:bg-secondary-light rounded-lg shadow-md p-4 hover:shadow-lg transition-all duration-200 border border-secondary-dark/20 dark:border-primary-dark/20 hover:bg-primary dark:hover:bg-secondary ${className} ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-row justify-between items-center">
        {/* 왼쪽: 체크박스 (옵션) + 플레이어 정보 */}
        <div className="flex items-center flex-1">
          {showCheckbox && (
            <div className="mr-3 flex-shrink-0">
              <input
                type="checkbox"
                checked={checked}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}
          <div
            className="flex flex-col cursor-pointer flex-1"
            onClick={onClick}
          >
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-secondary">
              {name}
            </h3>
            {mainLane && (
              <p className="text-sm text-text-muted"> main: {mainLane}</p>
            )}
            {subLane && (
              <p className="text-sm text-text-muted"> sub: {subLane}</p>
            )}
          </div>
        </div>

        {/* 중간: 점수 */}
        <div className="flex flex-col justify-center items-center mr-8">
          <h1 className="text-2xl text-text-primary dark:text-text-secondary font-bold">
            {score}
          </h1>
        </div>

        {/* 오른쪽: 삭제 버튼 (옵션) */}
        {showDeleteButton && (
          <div className="ml-auto flex-shrink-0">
            <Button onClick={handleDelete}>삭제</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
