import type { FC } from "react";

interface TeamPlayerCardProps {
  name: string;
  lolId: string;
  originalScore: number;
  adjustedScore: number;
  assignedPosition: string;
  mainLane: string;
  subLane: string;
  positionType: "MAIN" | "SUB" | "FILL";
  // 드래그 앤 드롭 관련 props
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragged?: boolean;
  isCustomMode?: boolean;
}

const TeamPlayerCard: FC<TeamPlayerCardProps> = ({
  name,
  lolId,
  originalScore,
  adjustedScore,
  assignedPosition,
  mainLane,
  subLane,
  positionType,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged = false,
  isCustomMode = false,
}) => {
  const getPositionBadgeColor = () => {
    switch (positionType) {
      case "MAIN":
        return "bg-green-500 text-white";
      case "SUB":
        return "bg-yellow-500 text-white";
      case "FILL":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPositionText = () => {
    switch (positionType) {
      case "MAIN":
        return "주포지션";
      case "SUB":
        return "부포지션";
      case "FILL":
        return "필요포지션";
      default:
        return "";
    }
  };

  return (
    <div
      className={`bg-primary-light dark:bg-secondary-light rounded-lg p-3 border border-primary-dark/20 dark:border-secondary-dark/20 transition-all duration-200 ${
        isCustomMode ? "cursor-grab hover:shadow-lg" : ""
      } ${isDragged ? "opacity-50 scale-105" : ""}`}
      draggable={isCustomMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {isCustomMode && (
        <div className="text-xs text-center text-blue-600 dark:text-blue-400 mb-1 font-medium">
          드래그해서 이동
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-text-primary dark:text-text-secondary">
          {assignedPosition}
        </h3>
        <span
          className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${getPositionBadgeColor()}`}
        >
          {getPositionText()}
        </span>
      </div>

      <div className="space-y-0.5">
        <p className="font-semibold text-sm text-text-primary dark:text-text-secondary">
          {name}
        </p>
        <p className="text-xs text-text-muted">{lolId}</p>

        <div className="flex justify-between items-center mt-1">
          <div>
            <p className="text-xs text-text-muted">
              main: {mainLane} sub: {subLane}
            </p>
          </div>
          <div className="text-right">
            {adjustedScore !== originalScore ? (
              <>
                <p className="text-base font-bold text-accent-yellow">
                  {adjustedScore}
                </p>
                <p className="text-xs text-text-muted line-through">
                  {originalScore}
                </p>
              </>
            ) : (
              <p className="text-base font-bold text-text-primary dark:text-text-secondary">
                {originalScore}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPlayerCard;
