package com.example.teamdraftlol.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerGameRecordResponse {
    private Long playerId;
    private String playerName;
    private String lolId;
    private int teamNumber;
    private String assignedPosition;
    private int kills;
    private int deaths;
    private int assists;
    private int cs; // 미니언 처치 수 (서폿의 경우 시야점수)
    private int beforeScore; // 반영 전 점수
    private int afterScore; // 반영 후 점수
    private int scoreChange; // 점수 변화량
    private int streakBonus; // 연승/연패 보너스
} 