package com.example.teamdraftlol.dto.response;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamResponse {
    private int teamNumber;
    private List<TeamPlayerResponse> players;
    private int totalScore;
    private TeamPlayerResponse topPlayer;
    private TeamPlayerResponse junglePlayer;
    private TeamPlayerResponse midPlayer;
    private TeamPlayerResponse adcPlayer;
    private TeamPlayerResponse supportPlayer;
} 