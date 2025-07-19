package com.example.teamdraftlol.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.Valid;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRecordRequest {
    @NotNull
    private Boolean team1Won; // 1팀 승리 여부
    
    @NotNull
    @Min(0)
    private Integer team1Kills; // 1팀 전체 킬수
    
    @NotNull
    @Min(0)
    private Integer team2Kills; // 2팀 전체 킬수
    
    @NotNull
    @Min(0)
    private Integer team1Gold; // 1팀 획득 골드량
    
    @NotNull
    @Min(0)
    private Integer team2Gold; // 2팀 획득 골드량
    
    @Valid
    @NotNull
    private List<PlayerGameRecordRequest> playerRecords; // 10명의 플레이어 기록
} 