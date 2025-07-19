package com.example.teamdraftlol.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name="players")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Player {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long playerId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="owner", nullable=false)
    private Profile owner;
    private String name;
    private String lolId;
    private String mainLane;
    private String subLane;
    private Integer score;
    private Integer winLossStreak;
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

}


