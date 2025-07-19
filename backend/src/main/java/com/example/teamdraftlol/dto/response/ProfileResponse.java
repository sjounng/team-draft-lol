package com.example.teamdraftlol.dto.response;

import com.example.teamdraftlol.entity.Profile;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileResponse {
    private UUID id;
    private String username;
    private String email;
    private Instant createdAt;

    public static ProfileResponse fromEntity(Profile p) {
        return ProfileResponse.builder()
                .id(p.getId())
                .username(p.getUsername())
                .email(p.getEmail())
                .createdAt(p.getCreatedAt())
                .build();
    }
}