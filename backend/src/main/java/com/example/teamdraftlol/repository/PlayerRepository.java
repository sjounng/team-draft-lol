package com.example.teamdraftlol.repository;

import com.example.teamdraftlol.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByOwnerId(UUID ownerId);
}