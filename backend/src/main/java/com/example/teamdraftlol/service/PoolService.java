package com.example.teamdraftlol.service;

import com.example.teamdraftlol.dto.request.PoolRequest;
import com.example.teamdraftlol.dto.request.PlayerRequest;
import com.example.teamdraftlol.dto.response.PoolResponse;
import com.example.teamdraftlol.dto.response.PlayerResponse;
import com.example.teamdraftlol.entity.Player;
import com.example.teamdraftlol.entity.Pool;
import com.example.teamdraftlol.entity.Profile;
import com.example.teamdraftlol.repository.PlayerRepository;
import com.example.teamdraftlol.repository.PoolRepository;
import com.example.teamdraftlol.repository.ProfileRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@Service
@RequiredArgsConstructor
public class PoolService {
    private final PoolRepository poolRepository;
    private final ProfileRepository profileRepository;
    private final PlayerRepository playerRepository;

    @Transactional
    public PoolResponse createPool(UUID ownerId, PoolRequest req) {
        Profile owner = profileRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));

        Pool pool = Pool.builder()
                .owner(owner)
                .name(req.getName())
                .createdAt(Instant.now())
                .players(new HashSet<>())
                .members(new HashSet<>())
                .build();

        Pool saved = poolRepository.save(pool);

        if (req.getPlayerIds() != null && !req.getPlayerIds().isEmpty()) {
            Set<Player> players = new HashSet<>(
                    playerRepository.findAllById(req.getPlayerIds())
            );
            saved.getPlayers().addAll(players);
            saved = poolRepository.save(saved);
        }

        return PoolResponse.fromEntity(saved);
    }

    public List<PoolResponse> listPools(UUID userId) {
        return poolRepository.findByOwnerIdOrMemberId(userId).stream()
                .map(PoolResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PoolResponse getPool(UUID userId, Long poolId) {
        Pool pool = poolRepository.findById(poolId)
                .orElseThrow(() -> new IllegalArgumentException("Pool not found"));
        
        // 소유자이거나 멤버인지 확인
        boolean hasAccess = pool.getOwner().getId().equals(userId) || 
                           pool.getMembers().stream().anyMatch(member -> member.getId().equals(userId));
        
        if (!hasAccess) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        return PoolResponse.fromEntity(pool);
    }

    @Transactional
    public PlayerResponse addPlayer(UUID userId, Long poolId, PlayerRequest req) {
        // 비관적 락을 걸고 풀을 조회
        Pool pool = poolRepository.findByIdForUpdate(poolId);
        if (pool == null) {
            throw new IllegalArgumentException("Pool not found");
        }
        // 소유자이거나 멤버인지 확인
        boolean hasAccess = pool.getOwner().getId().equals(userId) ||
                pool.getMembers().stream().anyMatch(member -> member.getId().equals(userId));
        if (!hasAccess) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        // 중복 lolId 체크
        boolean alreadyExists = pool.getPlayers().stream()
                .anyMatch(p -> p.getLolId().equals(req.getLolId()));
        if (alreadyExists) {
            throw new IllegalArgumentException("이미 동일한 LOL ID의 플레이어가 등록되어 있습니다.");
        }
        Profile owner = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
        Player player = Player.builder()
                .owner(owner)
                .name(req.getName())
                .lolId(req.getLolId())
                .mainLane(req.getMainLane())
                .subLane(req.getSubLane())
                .score(req.getScore())
                .winLossStreak(0)
                .createdAt(Instant.now())
                .build();
        Player savedPlayer = playerRepository.save(player);
        pool.getPlayers().add(savedPlayer);
        poolRepository.save(pool);
        return PlayerResponse.fromEntity(savedPlayer);
    }

    @Transactional
    public PlayerResponse updatePlayer(UUID userId, Long poolId, Long playerId, PlayerRequest req) {
        Pool pool = poolRepository.findById(poolId)
                .orElseThrow(() -> new IllegalArgumentException("Pool not found"));
        
        // 소유자만 수정 가능하도록 변경
        if (!pool.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("풀의 소유자만 플레이어 정보를 수정할 수 있습니다.");
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        // 플레이어가 해당 풀에 속해 있는지 확인
        if (!pool.getPlayers().contains(player)) {
            throw new IllegalArgumentException("해당 플레이어는 이 풀에 속해 있지 않습니다.");
        }

        // 플레이어 정보 업데이트
        player.setName(req.getName());
        player.setLolId(req.getLolId());
        player.setMainLane(req.getMainLane());
        player.setSubLane(req.getSubLane());
        player.setScore(req.getScore());

        Player updatedPlayer = playerRepository.save(player);
        return PlayerResponse.fromEntity(updatedPlayer);
    }

    @Transactional
    public void deletePool(UUID userId, Long poolId) {
        Pool pool = poolRepository.findById(poolId)
                .orElseThrow(() -> new IllegalArgumentException("Pool not found"));
        
        // 소유자만 삭제할 수 있음
        if (!pool.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException("풀을 삭제할 권한이 없습니다. 풀의 소유자만 삭제할 수 있습니다.");
        }
        
        // 풀 삭제 (플레이어들은 삭제되지 않고 풀에서만 제거됨)
        poolRepository.delete(pool);
    }

    @Transactional
    public PoolResponse joinPool(UUID userId, Long poolId, String poolName) {
        // 풀 ID와 이름으로 풀 찾기
        Pool pool = poolRepository.findByPoolIdAndName(poolId, poolName)
                .orElseThrow(() -> new IllegalArgumentException("해당 풀을 찾을 수 없습니다."));
        
        Profile user = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        
        // 이미 소유자이거나 멤버인지 확인
        boolean isAlreadyMember = pool.getOwner().getId().equals(userId) || 
                                 pool.getMembers().stream().anyMatch(member -> member.getId().equals(userId));
        
        if (isAlreadyMember) {
            throw new IllegalArgumentException("이미 해당 풀의 멤버입니다.");
        }
        
        // 멤버로 추가
        pool.getMembers().add(user);
        Pool savedPool = poolRepository.save(pool);
        
        return PoolResponse.fromEntity(savedPool);
    }
}
