package com.example.teamdraftlol.dto.request;

import com.example.teamdraftlol.validation.DifferentLanes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@DifferentLanes
public class PlayerRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String lolId;

    @NotBlank
    private String mainLane;

    @NotBlank
    private String subLane;

    @NotNull
    @Min(1)
    @Max(1000)
    private Integer score;
}