package com.example.teamdraftlol.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamPlayerResponse {
    private Long playerId;
    private String name;
    private String lolId;
    private int originalScore;
    private int adjustedScore;
    private String assignedPosition;
    private String mainLane;
    private String subLane;
    private String positionType; // "MAIN", "SUB", "FILL"
} 