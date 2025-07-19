package com.example.teamdraftlol.repository;

import com.example.teamdraftlol.entity.GameRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRecordRepository extends JpaRepository<GameRecord, Long> {
    List<GameRecord> findByUserIdOrderByCreatedAtDesc(String userId);
} 