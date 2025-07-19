package com.example.teamdraftlol.dto.response;

import com.example.teamdraftlol.entity.Pool;
import lombok.*;
import java.time.Instant;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PoolResponse {
    private Long poolId;
    private String name;
    private Instant createdAt;
    private List<PlayerResponse> players;
    private int playersCount;

    public static PoolResponse fromEntity(Pool pool) {
        List<PlayerResponse> list = pool.getPlayers().stream()
                .map(PlayerResponse::fromEntity)
                .toList();
        return PoolResponse.builder()
                .poolId(pool.getPoolId())
                .name(pool.getName())
                .createdAt(pool.getCreatedAt())
                .players(list)
                .playersCount(list.size())
                .build();
    }
}