package com.example.teamdraftlol.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamGenerationResponse {
    private TeamResponse team1;
    private TeamResponse team2;
    private int scoreDifference;
    private int mainPositionCount; // 주 포지션에 배정된 플레이어 수
    private int mainPositionLowScoreBonus; // 주 포지션에 배정된 낮은 점수 플레이어들의 보너스
    private int currentCombination;
    private int totalCombinations;
    private List<Integer> availableCombinations; // 리롤 가능한 조합들의 순위
}