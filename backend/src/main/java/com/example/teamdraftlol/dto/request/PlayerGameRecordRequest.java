package com.example.teamdraftlol.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerGameRecordRequest {
    @NotNull
    private Long playerId;
    
    @NotNull
    private Integer teamNumber; // 1 또는 2
    
    @NotNull
    private String assignedPosition; // TOP, JGL, MID, ADC, SUP
    
    @NotNull
    @Min(0)
    private Integer kills;
    
    @NotNull
    @Min(0)
    private Integer deaths;
    
    @NotNull
    @Min(0)
    private Integer assists;

    @NotNull
    @Min(0)
    private Integer cs; // 미니언 처치 수 (서폿의 경우 시야점수)
} 