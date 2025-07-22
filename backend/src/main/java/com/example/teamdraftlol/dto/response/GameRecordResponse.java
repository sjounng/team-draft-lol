package com.example.teamdraftlol.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRecordResponse {
    private Long gameId;
    private boolean team1Won;
    private int team1Kills;
    private int team2Kills;
    private int team1Gold;
    private int team2Gold;
    private boolean isApplied;
    private LocalDateTime createdAt;
    private List<PlayerGameRecordResponse> playerRecords;
    private boolean isOwner; // owner 여부
    private boolean isMember; // 멤버 여부
} 