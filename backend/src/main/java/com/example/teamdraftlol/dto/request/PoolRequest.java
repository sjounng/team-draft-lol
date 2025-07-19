package com.example.teamdraftlol.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;


import java.util.*;


@Data
@NoArgsConstructor @AllArgsConstructor @Builder
public class PoolRequest {
    @NotBlank
    private String name;

    @NotNull
    @Size(min = 0)
    private Set<Long> playerIds;
}