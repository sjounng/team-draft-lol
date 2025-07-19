package com.example.teamdraftlol.service;

import com.example.teamdraftlol.dto.request.PlayerRequest;
import com.example.teamdraftlol.dto.response.PlayerResponse;
import com.example.teamdraftlol.entity.Player;
import com.example.teamdraftlol.entity.Profile;
import com.example.teamdraftlol.repository.PlayerRepository;
import com.example.teamdraftlol.repository.ProfileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerService {
    private final PlayerRepository playerRepository;
    private final ProfileRepository profileRepository;
    private final PlayerRepository repo;

    @Transactional
    public PlayerResponse createPlayer(UUID ownerId, PlayerRequest req) {
        Profile owner = profileRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        Player p = Player.builder()
                .owner(owner)
                .name(req.getName())
                .lolId(req.getLolId())
                .mainLane(req.getMainLane())
                .subLane(req.getSubLane())
                .score(req.getScore())
                .createdAt(Instant.now())
                .build();

        Player saved = playerRepository.save(p);
        return PlayerResponse.fromEntity(saved);
    }

    public List<PlayerResponse> listPlayers(UUID ownerId) {
        return repo.findByOwnerId(ownerId).stream()
                .map(PlayerResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deletePlayer(UUID ownerId, Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));
        
        if (!player.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        
        playerRepository.delete(player);
    }
}