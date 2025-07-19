import type { FC } from "react";
import Button from "./Button";

interface PoolCardProps {
  poolId: string;
  name: string;
  playersCount: number;
  onClick?: () => void;
}

const PoolCard: FC<PoolCardProps> = ({
  poolId,
  name,
  playersCount,
  onClick,
}) => {
  return (
    <div className="relative">
      <Button
        onClick={onClick}
        fullWidth
        className="!text-left !p-4 !border-secondary-dark/20 dark:!border-primary-dark/20 hover:bg-primary dark:hover:bg-secondary !justify-start !items-start !min-h-[120px] !h-[120px] overflow-hidden"
      >
        <div className="flex flex-col h-full w-full">
          {/* 상단: 풀 이름과 ID */}
          <div className="flex-shrink-0 mb-2">
            {name && (
              <h3 className="text-lg font-semibold text-text-primary dark:text-text-secondary truncate">
                {name}
              </h3>
            )}
            {poolId && (
              <span className="text-text-muted font-normal text-sm">
                # {poolId}
              </span>
            )}
          </div>

          {/* 하단: 빈 공간 (플레이어 수는 파란색 태그로 표시) */}
          <div className="flex-grow"></div>
        </div>
      </Button>

      {/* 파란색 원형 태그 - 플레이어 수 */}
      {playersCount !== undefined && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          {playersCount}명
        </div>
      )}
    </div>
  );
};

export default PoolCard;
