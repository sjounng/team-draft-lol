package com.example.teamdraftlol.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.Set;

@Entity
@Table(name = "pools")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pool {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long poolId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="owner", nullable=false)
    private Profile owner;
    private String name;
    @Column(name="created_at", updatable=false)
    private Instant createdAt;
    @ManyToMany
    @JoinTable(
            name="pool_players",
            joinColumns=@JoinColumn(name="pool_id"),
            inverseJoinColumns=@JoinColumn(name="player_id")
    )
    private Set<Player> players;
    
    @ManyToMany
    @JoinTable(
            name="pool_members",
            joinColumns=@JoinColumn(name="pool_id"),
            inverseJoinColumns=@JoinColumn(name="profile_id")
    )
    private Set<Profile> members;
}
