package com.example.teamdraftlol.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "game_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long gameId;
    
    @Column(nullable = false)
    private String userId; // 게임을 생성한 사용자
    
    @Column(nullable = false)
    private boolean team1Won; // 1팀 승리 여부
    
    @Column(nullable = false)
    private int team1Kills; // 1팀 전체 킬수
    
    @Column(nullable = false)
    private int team2Kills; // 2팀 전체 킬수
    
    @Column(nullable = false)
    private int team1Gold; // 1팀 획득 골드량
    
    @Column(nullable = false)
    private int team2Gold; // 2팀 획득 골드량
    
    @Column(nullable = false)
    @Builder.Default
    private boolean isApplied = false; // 점수 반영 여부
    
    @OneToMany(mappedBy = "gameRecord", cascade = {CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    private List<PlayerGameRecord> playerRecords;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
} 