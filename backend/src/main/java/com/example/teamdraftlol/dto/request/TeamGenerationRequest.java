package com.example.teamdraftlol.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamGenerationRequest {
    @NotNull
    @Size(min = 10, max = 10, message = "정확히 10명의 플레이어가 필요합니다.")
    private List<Long> playerIds;
} 