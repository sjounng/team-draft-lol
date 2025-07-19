package com.example.teamdraftlol.controller;

import com.example.teamdraftlol.dto.request.PoolRequest;
import com.example.teamdraftlol.dto.request.PlayerRequest;
import com.example.teamdraftlol.dto.response.PoolResponse;
import com.example.teamdraftlol.dto.response.PlayerResponse;
import com.example.teamdraftlol.service.PoolService;
import com.example.teamdraftlol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/pools")
@RequiredArgsConstructor
public class PoolController {
    private final PoolService poolService;

    @PostMapping
    public ResponseEntity<PoolResponse> createPool(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody PoolRequest req
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(poolService.createPool(UUID.fromString(userId), req));
    }

    @GetMapping
    public ResponseEntity<List<PoolResponse>> listPools(
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(poolService.listPools(UUID.fromString(userId)));
    }

    @GetMapping("/{poolId}")
    public ResponseEntity<PoolResponse> getPool(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long poolId
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(poolService.getPool(UUID.fromString(userId), poolId));
    }

    @PostMapping("/{poolId}/players")
    public ResponseEntity<PlayerResponse> addPlayer(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long poolId,
            @Valid @RequestBody PlayerRequest req
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(poolService.addPlayer(UUID.fromString(userId), poolId, req));
    }

    @PostMapping("/join")
    public ResponseEntity<PoolResponse> joinPool(
            @RequestHeader("Authorization") String authorization,
            @RequestParam Long poolId,
            @RequestParam String poolName
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(poolService.joinPool(UUID.fromString(userId), poolId, poolName));
    }

    @PutMapping("/{poolId}/players/{playerId}")
    public ResponseEntity<PlayerResponse> updatePlayer(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long poolId,
            @PathVariable Long playerId,
            @Valid @RequestBody PlayerRequest req
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        return ResponseEntity.ok(poolService.updatePlayer(UUID.fromString(userId), poolId, playerId, req));
    }

    @DeleteMapping("/{poolId}")
    public ResponseEntity<String> deletePool(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long poolId
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        poolService.deletePool(UUID.fromString(userId), poolId);
        return ResponseEntity.ok("풀이 성공적으로 삭제되었습니다.");
    }
}