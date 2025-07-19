package com.example.teamdraftlol.controller;

import com.example.teamdraftlol.dto.request.PlayerRequest;
import com.example.teamdraftlol.dto.response.PlayerResponse;
import com.example.teamdraftlol.service.PlayerService;
import com.example.teamdraftlol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/players")
public class PlayerController {
    private final PlayerService playerService;

    @PostMapping
    public ResponseEntity<PlayerResponse> createPlayer(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody PlayerRequest req
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(playerService.createPlayer(UUID.fromString(userId), req));
    }

    @GetMapping
    public ResponseEntity<List<PlayerResponse>> listPlayers(
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(playerService.listPlayers(UUID.fromString(userId)));
    }

    @DeleteMapping("/{playerId}")
    public ResponseEntity<Void> deletePlayer(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long playerId) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        playerService.deletePlayer(UUID.fromString(userId), playerId);
        return ResponseEntity.ok().build();
    }
}
