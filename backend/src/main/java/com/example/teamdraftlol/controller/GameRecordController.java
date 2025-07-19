package com.example.teamdraftlol.controller;

import com.example.teamdraftlol.dto.request.GameRecordRequest;
import com.example.teamdraftlol.dto.response.GameRecordResponse;
import com.example.teamdraftlol.dto.response.SimulatedScoreResponse;
import com.example.teamdraftlol.entity.GameRecord;
import com.example.teamdraftlol.service.GameRecordService;
import com.example.teamdraftlol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/game-records")
@RequiredArgsConstructor
public class GameRecordController {
    
    private final GameRecordService gameRecordService;
    
    @PostMapping
    public ResponseEntity<GameRecord> createGameRecord(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody GameRecordRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        GameRecord gameRecord = gameRecordService.createGameRecord(userId, request);
        return ResponseEntity.ok(gameRecord);
    }
    
    @GetMapping
    public ResponseEntity<List<GameRecordResponse>> getUserGameRecords(
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        List<GameRecordResponse> gameRecords = gameRecordService.getUserGameRecords(userId);
        return ResponseEntity.ok(gameRecords);
    }
    
    @GetMapping("/{gameId}")
    public ResponseEntity<GameRecordResponse> getGameRecordById(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long gameId
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        GameRecordResponse gameRecord = gameRecordService.getGameRecordById(gameId, userId);
        return ResponseEntity.ok(gameRecord);
    }
    
    @PostMapping("/{gameId}/apply")
    public ResponseEntity<String> applyGameResultToScores(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long gameId
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        try {
            gameRecordService.applyGameResultToScores(gameId, userId);
            return ResponseEntity.ok("점수가 성공적으로 반영되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/{gameId}/cancel")
    public ResponseEntity<String> cancelGameResultFromScores(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long gameId
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        try {
            gameRecordService.cancelGameResultFromScores(gameId, userId);
            return ResponseEntity.ok("점수 반영이 성공적으로 취소되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/{gameId}/delete")
    public ResponseEntity<String> deleteGameRecord(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long gameId
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        try {
            gameRecordService.deleteGameRecord(gameId, userId);
            return ResponseEntity.ok("전적이 성공적으로 삭제되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/recalculate-scores")
    public ResponseEntity<String> recalculateAllScores(
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        try {
            gameRecordService.recalculateAllScores(userId);
            return ResponseEntity.ok("모든 게임 기록의 점수가 새로운 시스템으로 재계산되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("점수 재계산 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @PutMapping("/{gameId}")
    public ResponseEntity<GameRecordResponse> updateGameRecord(
            @RequestHeader("Authorization") String authorization,
            @PathVariable Long gameId,
            @Valid @RequestBody GameRecordRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        
        try {
            GameRecordResponse updatedRecord = gameRecordService.updateGameRecord(gameId, userId, request);
            return ResponseEntity.ok(updatedRecord);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/simulate-scores")
    public ResponseEntity<List<SimulatedScoreResponse>> simulateScores(
            @RequestHeader("Authorization") String authorization
    ) {
        String token = authorization.replace("Bearer ", "");
        String userId = JwtUtil.getUserIdFromToken(token);
        List<SimulatedScoreResponse> simulated = gameRecordService.simulateScores(userId);
        return ResponseEntity.ok(simulated);
    }
} 