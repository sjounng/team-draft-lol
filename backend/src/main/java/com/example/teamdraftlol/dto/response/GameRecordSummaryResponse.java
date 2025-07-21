package com.example.teamdraftlol.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRecordSummaryResponse {
    private Long gameId;
    private boolean team1Won;
    private int team1Kills;
    private int team2Kills;
    private int team1Gold;
    private int team2Gold;
    private boolean isApplied;
    private LocalDateTime createdAt;
} 