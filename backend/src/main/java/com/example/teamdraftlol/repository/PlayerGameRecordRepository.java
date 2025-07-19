package com.example.teamdraftlol.repository;

import com.example.teamdraftlol.entity.PlayerGameRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlayerGameRecordRepository extends JpaRepository<PlayerGameRecord, Long> {
    List<PlayerGameRecord> findByGameRecord_GameId(Long gameId);
} 