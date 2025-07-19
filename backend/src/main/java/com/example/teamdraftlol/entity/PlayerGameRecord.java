package com.example.teamdraftlol.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "player_game_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerGameRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recordId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private GameRecord gameRecord;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;
    
    @Column(nullable = false)
    private int teamNumber; // 1 또는 2
    
    @Column(nullable = false)
    private String assignedPosition; // TOP, JGL, MID, ADC, SUP
    
    @Column(nullable = false)
    private int kills;
    
    @Column(nullable = false)
    private int deaths;
    
    @Column(nullable = false)
    private int assists;

    @Column(nullable = false)
    @Builder.Default
    private int cs = 0; // 미니언 처치 수 (서폿의 경우 시야점수)
    
    @Column
    private Integer winLossStreakAtGame; // 해당 게임 시점의 연승/연패 상태
} 