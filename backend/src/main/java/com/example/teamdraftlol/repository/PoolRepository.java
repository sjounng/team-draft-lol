package com.example.teamdraftlol.repository;

import com.example.teamdraftlol.entity.Pool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import jakarta.persistence.LockModeType;

public interface PoolRepository extends JpaRepository<Pool, Long> {
    List<Pool> findByOwnerId(UUID ownerId);
    
    // 풀 ID와 이름으로 풀 찾기
    Optional<Pool> findByPoolIdAndName(Long poolId, String name);
    
    // 사용자가 소유하거나 멤버인 모든 풀 찾기
    @Query("SELECT DISTINCT p FROM Pool p WHERE p.owner.id = :userId OR :userId IN (SELECT m.id FROM p.members m)")
    List<Pool> findByOwnerIdOrMemberId(@Param("userId") UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pool p where p.poolId = :poolId")
    Pool findByIdForUpdate(@Param("poolId") Long poolId);
}