package com.example.teamdraftlol.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatedScoreResponse {
    private Long playerId;
    private String playerName;
    private String lolId;
    private int beforeScore;
    private int afterScore;
    private Long gameId;
    private String assignedPosition;
    private int kills;
    private int deaths;
    private int assists;
    private int cs;
    private boolean isWinner;
} 