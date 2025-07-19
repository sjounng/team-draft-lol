package com.example.teamdraftlol.service;

import com.example.teamdraftlol.dto.response.TeamPlayerResponse;
import com.example.teamdraftlol.dto.response.TeamResponse;
import com.example.teamdraftlol.dto.response.TeamGenerationResponse;
import com.example.teamdraftlol.entity.Player;
import com.example.teamdraftlol.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
public class TeamGenerationService {
    
    private final PlayerRepository playerRepository;
    private static final List<String> POSITIONS = Arrays.asList("TOP", "JGL", "MID", "ADC", "SUP");
    
    // 캐시용 - 생성된 조합들을 저장
    private List<TeamGenerationResponse> cachedCombinations = new ArrayList<>();
    private List<Long> lastPlayerIds = new ArrayList<>(); // 마지막으로 생성된 플레이어 ID 목록을 저장
    
    public TeamGenerationResponse generateTeams(List<Long> playerIds, int combinationIndex) {
        // 플레이어 정보 조회
        List<Player> players = playerRepository.findAllById(playerIds);
        if (players.size() != 10) {
            throw new IllegalArgumentException("정확히 10명의 플레이어가 필요합니다.");
        }
        
        // 새로운 플레이어 조합이면 캐시 초기화
        List<Long> currentPlayerIds = players.stream()
                .map(Player::getPlayerId)
                .sorted()
                .collect(Collectors.toList());
        
        if (cachedCombinations.isEmpty() || !currentPlayerIds.equals(lastPlayerIds)) {
            cachedCombinations = calculateAllCombinations(players);
            lastPlayerIds = currentPlayerIds;
        }
        
        if (combinationIndex >= cachedCombinations.size()) {
            combinationIndex = 0;
        }
        
        TeamGenerationResponse result = cachedCombinations.get(combinationIndex);
        result.setCurrentCombination(combinationIndex + 1);
        result.setTotalCombinations(cachedCombinations.size());
        result.setAvailableCombinations(
            IntStream.rangeClosed(1, cachedCombinations.size())
                    .boxed()
                    .collect(Collectors.toList())
        );
        
        return result;
    }
    
    private List<TeamGenerationResponse> calculateAllCombinations(List<Player> players) {
        List<TeamGenerationResponse> combinations = new ArrayList<>();
        Set<String> uniqueCombinations = new HashSet<>(); // 중복 조합 체크용
        
        // 플레이어를 ID로 정렬하여 일관성 확보
        List<Player> sortedPlayers = players.stream()
                .sorted(Comparator.comparing(Player::getPlayerId))
                .collect(Collectors.toList());
        
        // 최고 점수 계산 (보너스 점수 계산용)
        int maxScore = players.stream()
                .mapToInt(Player::getScore)
                .max()
                .orElse(0);
        
        // 10명 중 5명을 선택하는 모든 조합 생성
        List<List<Player>> team1Combinations = generateCombinations(sortedPlayers, 5);
        
        for (List<Player> team1Players : team1Combinations) {
            List<Player> team2Players = new ArrayList<>(sortedPlayers);
            team2Players.removeAll(team1Players);
            
            // 중복 제거를 위한 고유 키 생성
            List<Long> team1Ids = team1Players.stream()
                    .map(Player::getPlayerId)
                    .sorted()
                    .collect(Collectors.toList());
            List<Long> team2Ids = team2Players.stream()
                    .map(Player::getPlayerId)
                    .sorted()
                    .collect(Collectors.toList());
            
            // 더 작은 ID 집합을 첫 번째로 정렬하여 중복 제거
            String combinationKey;
            List<Player> finalTeam1, finalTeam2;
            
            if (team1Ids.get(0) < team2Ids.get(0)) {
                combinationKey = team1Ids + ":" + team2Ids;
                finalTeam1 = team1Players;
                finalTeam2 = team2Players;
            } else {
                combinationKey = team2Ids + ":" + team1Ids;
                finalTeam1 = team2Players;
                finalTeam2 = team1Players;
            }
            
            // 이미 처리된 조합인지 확인
            if (uniqueCombinations.contains(combinationKey)) {
                continue;
            }
            uniqueCombinations.add(combinationKey);
            
            // 각 팀에 포지션 배정
            TeamResponse team1 = assignPositions(finalTeam1, 1);
            TeamResponse team2 = assignPositions(finalTeam2, 2);
            
            int scoreDifference = Math.abs(team1.getTotalScore() - team2.getTotalScore());
            
            // 주 포지션 관련 메트릭 계산
            int mainPositionCount = calculateMainPositionCount(team1, team2);
            int mainPositionLowScoreBonus = calculateMainPositionLowScoreBonus(team1, team2, maxScore);
            
            TeamGenerationResponse response = TeamGenerationResponse.builder()
                    .team1(team1)
                    .team2(team2)
                    .scoreDifference(scoreDifference)
                    .mainPositionCount(mainPositionCount)
                    .mainPositionLowScoreBonus(mainPositionLowScoreBonus)
                    .build();
            
            combinations.add(response);
        }
        
        // 정렬 우선순위: 1) 주 포지션 수 (높을수록 좋음), 2) 낮은 점수 보너스 (높을수록 좋음), 3) 점수 차이 (낮을수록 좋음)
        return combinations.stream()
                .sorted(Comparator
                        .comparingInt((TeamGenerationResponse r) -> -r.getMainPositionCount()) // 주 포지션 수가 많을수록 좋음
                        .thenComparingInt((TeamGenerationResponse r) -> -r.getMainPositionLowScoreBonus()) // 낮은 점수 보너스가 높을수록 좋음
                        .thenComparingInt(TeamGenerationResponse::getScoreDifference)) // 점수 차이가 낮을수록 좋음
                .limit(10)
                .collect(Collectors.toList());
    }
    
    private int calculateMainPositionCount(TeamResponse team1, TeamResponse team2) {
        int count = 0;
        
        // 1팀 주 포지션 카운트
        count += (int) team1.getPlayers().stream()
                .filter(p -> "MAIN".equals(p.getPositionType()))
                .count();
        
        // 2팀 주 포지션 카운트
        count += (int) team2.getPlayers().stream()
                .filter(p -> "MAIN".equals(p.getPositionType()))
                .count();
        
        return count;
    }
    
    private int calculateMainPositionLowScoreBonus(TeamResponse team1, TeamResponse team2, int maxScore) {
        int bonus = 0;
        
        // 1팀 주 포지션 플레이어들의 보너스 계산
        bonus += team1.getPlayers().stream()
                .filter(p -> "MAIN".equals(p.getPositionType()))
                .mapToInt(p -> maxScore - p.getOriginalScore())
                .sum();
        
        // 2팀 주 포지션 플레이어들의 보너스 계산
        bonus += team2.getPlayers().stream()
                .filter(p -> "MAIN".equals(p.getPositionType()))
                .mapToInt(p -> maxScore - p.getOriginalScore())
                .sum();
        
        return bonus;
    }
    
    private TeamResponse assignPositions(List<Player> teamPlayers, int teamNumber) {
        Map<String, TeamPlayerResponse> assignedPositions = new HashMap<>();
        List<TeamPlayerResponse> teamPlayerResponses = new ArrayList<>();
        Set<Long> assignedPlayerIds = new HashSet<>();
        
        // 1단계: 각 포지션별로 해당 포지션을 주포지션으로 하는 플레이어들 중 점수가 가장 낮은 사람을 배정
        for (String position : POSITIONS) {
            Player bestPlayer = teamPlayers.stream()
                    .filter(p -> !assignedPlayerIds.contains(p.getPlayerId()))
                    .filter(p -> position.equals(p.getMainLane()))
                    .min(Comparator.comparingInt(Player::getScore))
                    .orElse(null);
            
            if (bestPlayer != null) {
                TeamPlayerResponse teamPlayer = createTeamPlayer(bestPlayer, position, "MAIN", 1.0);
                assignedPositions.put(position, teamPlayer);
                teamPlayerResponses.add(teamPlayer);
                assignedPlayerIds.add(bestPlayer.getPlayerId());
            }
        }
        
        // 2단계: 남은 포지션에 대해 해당 포지션을 부포지션으로 하는 플레이어들 중 점수가 가장 낮은 사람을 배정
        for (String position : POSITIONS) {
            if (!assignedPositions.containsKey(position)) {
                Player bestPlayer = teamPlayers.stream()
                        .filter(p -> !assignedPlayerIds.contains(p.getPlayerId()))
                        .filter(p -> position.equals(p.getSubLane()))
                        .min(Comparator.comparingInt(Player::getScore))
                        .orElse(null);
                
                if (bestPlayer != null) {
                    double scoreRatio = "SUP".equals(bestPlayer.getMainLane()) ? 0.75 : 0.85; // 서폿 메인이면 75%, 아니면 85%
                    TeamPlayerResponse teamPlayer = createTeamPlayer(bestPlayer, position, "SUB", scoreRatio);
                    assignedPositions.put(position, teamPlayer);
                    teamPlayerResponses.add(teamPlayer);
                    assignedPlayerIds.add(bestPlayer.getPlayerId());
                }
            }
        }
        
        // 3단계: 남은 플레이어들을 남은 포지션에 점수가 낮은 순으로 배정
        List<Player> remainingPlayers = teamPlayers.stream()
                .filter(p -> !assignedPlayerIds.contains(p.getPlayerId()))
                .sorted(Comparator.comparingInt(Player::getScore))
                .collect(Collectors.toList());
        
        for (Player player : remainingPlayers) {
            for (String position : POSITIONS) {
                if (!assignedPositions.containsKey(position)) {
                    double scoreRatio = "SUP".equals(player.getMainLane()) ? 0.60 : 0.70; // 서폿 메인이면 60%, 아니면 70%
                    TeamPlayerResponse teamPlayer = createTeamPlayer(player, position, "FILL", scoreRatio);
                    assignedPositions.put(position, teamPlayer);
                    teamPlayerResponses.add(teamPlayer);
                    assignedPlayerIds.add(player.getPlayerId());
                    break;
                }
            }
        }
        
        int totalScore = teamPlayerResponses.stream()
                .mapToInt(TeamPlayerResponse::getAdjustedScore)
                .sum();
        
        return TeamResponse.builder()
                .teamNumber(teamNumber)
                .players(teamPlayerResponses)
                .totalScore(totalScore)
                .topPlayer(assignedPositions.get("TOP"))
                .junglePlayer(assignedPositions.get("JGL"))
                .midPlayer(assignedPositions.get("MID"))
                .adcPlayer(assignedPositions.get("ADC"))
                .supportPlayer(assignedPositions.get("SUP"))
                .build();
    }
    
    private TeamPlayerResponse createTeamPlayer(Player player, String position, String positionType, double scoreRatio) {
        int adjustedScore = (int) Math.round(player.getScore() * scoreRatio);
        
        return TeamPlayerResponse.builder()
                .playerId(player.getPlayerId())
                .name(player.getName())
                .lolId(player.getLolId())
                .originalScore(player.getScore())
                .adjustedScore(adjustedScore)
                .assignedPosition(position)
                .mainLane(player.getMainLane())
                .subLane(player.getSubLane())
                .positionType(positionType)
                .build();
    }
    
    private List<List<Player>> generateCombinations(List<Player> players, int r) {
        List<List<Player>> combinations = new ArrayList<>();
        generateCombinationsHelper(players, r, 0, new ArrayList<>(), combinations);
        return combinations;
    }
    
    private void generateCombinationsHelper(List<Player> players, int r, int start, 
                                          List<Player> current, List<List<Player>> combinations) {
        if (current.size() == r) {
            combinations.add(new ArrayList<>(current));
            return;
        }
        
        for (int i = start; i < players.size(); i++) {
            current.add(players.get(i));
            generateCombinationsHelper(players, r, i + 1, current, combinations);
            current.remove(current.size() - 1);
        }
    }
} 