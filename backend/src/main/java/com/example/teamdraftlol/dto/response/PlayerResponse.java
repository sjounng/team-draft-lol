package com.example.teamdraftlol.dto.response;

import com.example.teamdraftlol.entity.Player;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerResponse {
    private Long playerId;
    private String name;
    private String lolId;
    private String mainLane;
    private String subLane;
    private Integer score;
    private Integer winLossStreak;

    public static PlayerResponse fromEntity(Player p) {
        return PlayerResponse.builder()
                .playerId(p.getPlayerId())
                .name(p.getName())
                .lolId(p.getLolId())
                .mainLane(p.getMainLane())
                .subLane(p.getSubLane())
                .score(p.getScore())
                .winLossStreak(p.getWinLossStreak())
                .build();
    }
}