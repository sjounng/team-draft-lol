package com.example.teamdraftlol.controller;

import com.example.teamdraftlol.dto.request.TeamGenerationRequest;
import com.example.teamdraftlol.dto.response.TeamGenerationResponse;
import com.example.teamdraftlol.service.TeamGenerationService;
import com.example.teamdraftlol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {
    
    private final TeamGenerationService teamGenerationService;
    
    @PostMapping("/generate")
    public ResponseEntity<TeamGenerationResponse> generateTeams(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody TeamGenerationRequest request
    ) {
        String token = authorization.replace("Bearer ", "");
        JwtUtil.getUserIdFromToken(token); // Token validation only
        
        TeamGenerationResponse response = teamGenerationService.generateTeams(request.getPlayerIds(), 0);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/reroll")
    public ResponseEntity<TeamGenerationResponse> rerollTeams(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody TeamGenerationRequest request,
            @RequestParam(defaultValue = "0") int combinationIndex
    ) {
        String token = authorization.replace("Bearer ", "");
        JwtUtil.getUserIdFromToken(token); // Token validation only
        
        TeamGenerationResponse response = teamGenerationService.generateTeams(request.getPlayerIds(), combinationIndex);
        return ResponseEntity.ok(response);
    }
} 