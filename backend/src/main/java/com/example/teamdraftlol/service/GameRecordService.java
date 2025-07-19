package com.example.teamdraftlol.service;

import com.example.teamdraftlol.dto.request.GameRecordRequest;
import com.example.teamdraftlol.dto.request.PlayerGameRecordRequest;
import com.example.teamdraftlol.dto.response.GameRecordResponse;
import com.example.teamdraftlol.dto.response.PlayerGameRecordResponse;
import com.example.teamdraftlol.dto.response.SimulatedScoreResponse;
import com.example.teamdraftlol.entity.GameRecord;
import com.example.teamdraftlol.entity.Player;
import com.example.teamdraftlol.entity.PlayerGameRecord;
import com.example.teamdraftlol.repository.GameRecordRepository;
import com.example.teamdraftlol.repository.PlayerGameRecordRepository;
import com.example.teamdraftlol.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameRecordService {
    
    private final GameRecordRepository gameRecordRepository;
    private final PlayerGameRecordRepository playerGameRecordRepository;
    private final PlayerRepository playerRepository;
    
    @Transactional
    public GameRecord createGameRecord(String userId, GameRecordRequest request) {
        // 게임 기록 생성
        GameRecord gameRecord = GameRecord.builder()
                .userId(userId)
                .team1Won(request.getTeam1Won())
                .team1Kills(request.getTeam1Kills())
                .team2Kills(request.getTeam2Kills())
                .team1Gold(request.getTeam1Gold())
                .team2Gold(request.getTeam2Gold())
                .isApplied(false)
                .build();
        
        GameRecord savedGameRecord = gameRecordRepository.save(gameRecord);
        
        // 플레이어 기록 생성
        List<Long> playerIds = request.getPlayerRecords().stream()
                .map(PlayerGameRecordRequest::getPlayerId)
                .collect(Collectors.toList());
        
        Map<Long, Player> playerMap = playerRepository.findAllById(playerIds)
                .stream()
                .collect(Collectors.toMap(Player::getPlayerId, player -> player));
        
        List<PlayerGameRecord> playerRecords = request.getPlayerRecords().stream()
                .map(pr -> PlayerGameRecord.builder()
                        .gameRecord(savedGameRecord)
                        .player(playerMap.get(pr.getPlayerId()))
                        .teamNumber(pr.getTeamNumber())
                        .assignedPosition(pr.getAssignedPosition())
                        .kills(pr.getKills())
                        .deaths(pr.getDeaths())
                        .assists(pr.getAssists())
                        .cs(pr.getCs())
                        .build())
                .collect(Collectors.toList());
        
        playerGameRecordRepository.saveAll(playerRecords);
        
        return savedGameRecord;
    }
    
    @Transactional
    public void applyGameResultToScores(Long gameId, String userId) {
        GameRecord gameRecord = gameRecordRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("게임 기록을 찾을 수 없습니다."));
        
        // 본인의 게임 기록인지 확인
        if (!gameRecord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        // 이미 반영된 게임인지 확인
        if (gameRecord.isApplied()) {
            throw new IllegalArgumentException("이미 점수에 반영된 게임입니다.");
        }
        
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameId);
        Map<Long, Player> playerMap = new HashMap<>();
        
        // 플레이어들을 미리 로드
        for (PlayerGameRecord record : playerRecords) {
            playerMap.put(record.getPlayer().getPlayerId(), record.getPlayer());
        }
        
        // 점수 계산 및 적용
        calculateAndApplyScores(gameRecord, playerRecords, playerMap);
        
        // 게임 기록을 반영됨으로 표시
        gameRecord.setApplied(true);
        gameRecordRepository.save(gameRecord);
    }
    
    @Transactional
    public void cancelGameResultFromScores(Long gameId, String userId) {
        GameRecord gameRecord = gameRecordRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("게임 기록을 찾을 수 없습니다."));
        
        // 본인의 게임 기록인지 확인
        if (!gameRecord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        // 반영되지 않은 게임인지 확인
        if (!gameRecord.isApplied()) {
            throw new IllegalArgumentException("아직 점수에 반영되지 않은 게임입니다.");
        }
        
        // 점수 되돌리기
        reverseGameResultFromScores(gameRecord);
        
        // 게임 기록을 반영되지 않음으로 표시
        gameRecord.setApplied(false);
        gameRecordRepository.save(gameRecord);
    }
    
    private void calculateAndApplyScores(GameRecord gameRecord, List<PlayerGameRecord> playerRecords, Map<Long, Player> playerMap) {
        // 골드 보너스 계산
        double goldBonus = Math.round(((double) gameRecord.getTeam1Gold() / gameRecord.getTeam2Gold()) * 0.5);
        
        // 각 플레이어의 점수 계산 및 적용
        for (PlayerGameRecord record : playerRecords) {
            Player player = playerMap.get(record.getPlayer().getPlayerId());
            
            // 승패에 따른 기본 점수 (승리 팀 +7점, 패배 팀 -7점)
            boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                              (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
            double baseWinLossScore = isWinner ? 7.0 : -7.0;
            
            // 기본 점수 계산: (킬수 + 어시스트) / 데스수 (데스가 0이면 킬+어시스트)
            double baseScore = record.getDeaths() == 0 ? 
            
                    record.getKills() + record.getAssists() : 
                    (double) (record.getKills() + record.getAssists()) / record.getDeaths();
            baseScore = Math.round(baseScore);
            
            // 포지션별 가중치 적용
            double positionMultiplier = getPositionMultiplier(record.getAssignedPosition());
            double weightedScore;
            
            if (isWinner) {
                // 승리 팀: 기존 방식 (KDA가 높을수록 높은 점수)
                weightedScore = baseScore * positionMultiplier;
                // 최소 +7점, 최대 +75점 보장
                weightedScore = Math.max(7.0, Math.min(75.0, weightedScore));
            } else {
                // 패배 팀: 포지션 가중치를 먼저 적용한 후 역수 처리
                // KDA가 높을수록 덜 깎임 (최소 -7점, 최대 -75점 보장)
                double weightedBaseScore = baseScore * positionMultiplier;
                double inverseScore = weightedBaseScore == 0 ? 7.0 : Math.min(75.0, 15.0 / weightedBaseScore);
                weightedScore = -inverseScore; // 음수로 만들어서 감소점수로 만듦
            }
            
            // 승패에 따른 점수 적용
            double finalScore = isWinner ? weightedScore : weightedScore; // 패배 팀은 이미 음수
            
            // 승패 기본 점수 추가
            finalScore += baseWinLossScore;
            
            // 골드 보너스 적용
            if (record.getTeamNumber() == 1) {
                finalScore += isWinner ? goldBonus : -goldBonus;
            } else {
                finalScore += isWinner ? goldBonus : -goldBonus;
            }
            
            // 서폿 시야 보너스 적용
            if ("SUP".equals(record.getAssignedPosition())) {
                // 같은 팀의 서폿과 상대팀의 서폿 찾기
                PlayerGameRecord opponentSupport = playerRecords.stream()
                        .filter(p -> "SUP".equals(p.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                        .findFirst()
                        .orElse(null);
                
                if (opponentSupport != null) {
                    double visionDiff = (double) (record.getCs() - opponentSupport.getCs()) / 10;
                    finalScore += isWinner ? visionDiff : -visionDiff;
                }
            }
            
            // CS 보너스 적용 (서폿 제외)
            if (!"SUP".equals(record.getAssignedPosition())) {
                double csBonus = calculateCsBonus(record, playerRecords, gameRecord.isTeam1Won());
                finalScore += csBonus;
            }
            
            // 상대방과의 점수 격차 보너스/페널티 적용
            PlayerGameRecord opponent = playerRecords.stream()
                    .filter(p -> p.getAssignedPosition().equals(record.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                    .findFirst()
                    .orElse(null);
            
            if (opponent != null) {
                double myScore = record.getKills() + record.getAssists(); // 내 점수 (KDA 기반)
                double opponentScore = opponent.getKills() + opponent.getAssists(); // 상대 점수 (KDA 기반)
                
                if (opponentScore > myScore) {
                    // 상대방 점수가 높은 경우
                    if (isWinner) {
                        // 이긴 경우: (상대 점수 / 내 점수) * 2 추가
                        double bonus = (opponentScore / myScore) * 2;
                        finalScore += bonus;
                    } else {
                        // 진 경우: (내 점수 / 상대 점수) * 2 추가
                        double bonus = (myScore / opponentScore) * 2;
                        finalScore += bonus;
                    }
                } else if (myScore > opponentScore) {
                    // 내 점수가 높은 경우
                    if (isWinner) {
                        // 이긴 경우: (상대 점수 / 내 점수) * 2 빼기
                        double penalty = (opponentScore / myScore) * 2;
                        finalScore -= penalty;
                    } else {
                        // 진 경우: (내 점수 / 상대 점수) * 2 빼기
                        double penalty = (myScore / opponentScore) * 2;
                        finalScore -= penalty;
                    }
                }
            }
            
            // 최종 점수 제한 적용
            if (isWinner) {
                finalScore = Math.max(7, Math.min(75, finalScore)); // 승리 팀 최소 +7점, 최대 +75점
            } else {
                finalScore = Math.min(-7, Math.max(-75, finalScore)); // 패배 팀 최소 -7점, 최대 -75점
            }
            
            // 플레이어 점수 업데이트
            int currentScore = player.getScore();
            int newScore = Math.max(0, currentScore + (int) Math.round(finalScore)); 
            player.setScore(newScore);
            
            // 연승/연패 업데이트
            Integer currentStreak = player.getWinLossStreak();
            if (currentStreak == null) currentStreak = 0;
            
            // 현재 게임의 PlayerGameRecord에 연승/연패 상태 저장
            record.setWinLossStreakAtGame(currentStreak);
            
            if (isWinner) {
                // 승리 시
                if (currentStreak < 0) {
                    // 연패 중이었다면 1로 리셋
                    player.setWinLossStreak(1);
                } else {
                    // 연승 중이었다면 +1
                    player.setWinLossStreak(currentStreak + 1);
                }
            } else {
                // 패배 시
                if (currentStreak > 0) {
                    // 연승 중이었다면 -1로 리셋
                    player.setWinLossStreak(-1);
                } else {
                    // 연패 중이었다면 -1
                    player.setWinLossStreak(currentStreak - 1);
                }
            }
            
            playerRepository.save(player);
        }
        
        // PlayerGameRecord 업데이트 저장
        playerGameRecordRepository.saveAll(playerRecords);
    }
    
    private double getPositionMultiplier(String position) {
        switch (position) {
            case "TOP":
                return 3.0;
            case "JGL":
            case "MID":
                return 2.5;
            case "ADC":
            case "SUP":
                return 2.0;
            default:
                return 0.5;
        }
    }

    private double calculateCsBonus(PlayerGameRecord currentPlayer, List<PlayerGameRecord> allPlayerRecords, boolean team1Won) {
        // 같은 포지션의 상대방 찾기
        PlayerGameRecord opponent = allPlayerRecords.stream()
                .filter(p -> p.getAssignedPosition().equals(currentPlayer.getAssignedPosition()) 
                        && p.getTeamNumber() != currentPlayer.getTeamNumber())
                .findFirst()
                .orElse(null);
        
        if (opponent == null) {
            return 0; // 상대방이 없으면 보너스 없음
        }
        
        // CS 차이 계산
        int csDifference = currentPlayer.getCs() - opponent.getCs();
        
        // 차이 / 5를 정수화
        int csBonus = csDifference / 5;
        
        // 승패에 따른 보너스 적용
        boolean isWinner = (currentPlayer.getTeamNumber() == 1 && team1Won) ||
                          (currentPlayer.getTeamNumber() == 2 && !team1Won);
        
        // 이긴 팀은 보너스, 진 팀은 페널티
        return isWinner ? csBonus : -csBonus;
    }
    
    public List<GameRecordResponse> getUserGameRecords(String userId) {
        // 게임 기록 조회
        List<GameRecord> gameRecords = gameRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return gameRecords.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public GameRecordResponse getGameRecordById(Long gameId, String userId) {
        GameRecord gameRecord = gameRecordRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("게임 기록을 찾을 수 없습니다."));
        
        // 본인의 게임 기록인지 확인
        if (!gameRecord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        return convertToResponse(gameRecord);
    }

    @Transactional
    public GameRecordResponse updateGameRecord(Long gameId, String userId, GameRecordRequest request) {
        GameRecord gameRecord = gameRecordRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("게임 기록을 찾을 수 없습니다."));
        
        // 본인의 게임 기록인지 확인
        if (!gameRecord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        // 이미 점수가 반영된 게임이면 먼저 점수를 되돌림
        if (gameRecord.isApplied()) {
            reverseGameResultFromScores(gameRecord);
        }
        
        // 기존 플레이어 기록들 삭제
        List<PlayerGameRecord> existingPlayerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameId);
        playerGameRecordRepository.deleteAll(existingPlayerRecords);
        
        // 게임 기록 업데이트
        gameRecord.setTeam1Won(request.getTeam1Won());
        gameRecord.setTeam1Kills(request.getTeam1Kills());
        gameRecord.setTeam2Kills(request.getTeam2Kills());
        gameRecord.setTeam1Gold(request.getTeam1Gold());
        gameRecord.setTeam2Gold(request.getTeam2Gold());
        gameRecord.setApplied(false); // 수정했으므로 반영 상태를 초기화
        
        GameRecord savedGameRecord = gameRecordRepository.save(gameRecord);
        
        // 새로운 플레이어 기록들 생성
        List<Long> playerIds = request.getPlayerRecords().stream()
                .map(PlayerGameRecordRequest::getPlayerId)
                .collect(Collectors.toList());
        
        Map<Long, Player> playerMap = playerRepository.findAllById(playerIds)
                .stream()
                .collect(Collectors.toMap(Player::getPlayerId, player -> player));
        
        List<PlayerGameRecord> newPlayerRecords = request.getPlayerRecords().stream()
                .map(pr -> PlayerGameRecord.builder()
                        .gameRecord(savedGameRecord)
                        .player(playerMap.get(pr.getPlayerId()))
                        .teamNumber(pr.getTeamNumber())
                        .assignedPosition(pr.getAssignedPosition())
                        .kills(pr.getKills())
                        .deaths(pr.getDeaths())
                        .assists(pr.getAssists())
                        .cs(pr.getCs())
                        .build())
                .collect(Collectors.toList());
        
        playerGameRecordRepository.saveAll(newPlayerRecords);
        
        return convertToResponse(savedGameRecord);
    }

    private GameRecordResponse convertToResponse(GameRecord gameRecord) {
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
        
        List<PlayerGameRecordResponse> playerResponses = playerRecords.stream()
                .map(pr -> {
                    // 시뮬레이션 점수 계산
                    Player player = pr.getPlayer();
                    int beforeScore = player.getScore();
                    int simulatedScore = calculateSimulatedScore(pr, playerRecords, gameRecord);
                    int afterScore = Math.max(0, beforeScore + simulatedScore);
                    
                    // 연승/연패 보너스 계산
                    boolean isWinner = (pr.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                                     (pr.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
                    
                    // 반영된 게임의 경우 저장된 streakBonus 사용, 반영되지 않은 게임의 경우 계산
                    int streakBonus;
                    if (gameRecord.isApplied()) {
                        // 반영된 게임: 저장된 winLossStreakAtGame 값을 사용하여 계산
                        streakBonus = calculateStreakBonusFromStoredData(pr, isWinner);
                    } else {
                        // 반영되지 않은 게임: 현재 상태로 계산
                        streakBonus = calculateStreakBonus(gameRecord.getUserId(), player.getPlayerId(), isWinner, gameRecord);
                    }
                    
                    return PlayerGameRecordResponse.builder()
                            .playerId(pr.getPlayer().getPlayerId())
                            .playerName(pr.getPlayer().getName())
                            .lolId(pr.getPlayer().getLolId())
                            .teamNumber(pr.getTeamNumber())
                            .assignedPosition(pr.getAssignedPosition())
                            .kills(pr.getKills())
                            .deaths(pr.getDeaths())
                            .assists(pr.getAssists())
                            .cs(pr.getCs())
                            .beforeScore(beforeScore)
                            .afterScore(afterScore)
                            .scoreChange(simulatedScore)
                            .streakBonus(streakBonus)
                            .build();
                })
                .collect(Collectors.toList());
        
        return GameRecordResponse.builder()
                .gameId(gameRecord.getGameId())
                .team1Won(gameRecord.isTeam1Won())
                .team1Kills(gameRecord.getTeam1Kills())
                .team2Kills(gameRecord.getTeam2Kills())
                .team1Gold(gameRecord.getTeam1Gold())
                .team2Gold(gameRecord.getTeam2Gold())
                .isApplied(gameRecord.isApplied())
                .createdAt(gameRecord.getCreatedAt())
                .playerRecords(playerResponses)
                .build();
    }
    
    private int calculateSimulatedScore(PlayerGameRecord record, List<PlayerGameRecord> playerRecords, GameRecord gameRecord) {
        // 승패에 따른 기본 점수 (승리 팀 +7점, 패배 팀 -7점)
        boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                          (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
        double baseWinLossScore = isWinner ? 7.0 : -7.0;
        
        // 기본 점수 계산: (킬수 + 어시스트) / 데스수 (데스가 0이면 킬+어시스트)
        double baseScore = record.getDeaths() == 0 ? 
                record.getKills() + record.getAssists() : 
                (double) (record.getKills() + record.getAssists()) / record.getDeaths();
        baseScore = Math.round(baseScore);
        
        // 포지션별 가중치 적용
        double positionMultiplier = getPositionMultiplier(record.getAssignedPosition());
        double weightedScore;
        
        if (isWinner) {
            // 승리 팀: 기존 방식 (KDA가 높을수록 높은 점수)
            weightedScore = baseScore * positionMultiplier;
            // 최소 +7점, 최대 +75점 보장
            weightedScore = Math.max(7.0, Math.min(75.0, weightedScore));
        } else {
            // 패배 팀: 포지션 가중치를 먼저 적용한 후 역수 처리
            // KDA가 높을수록 덜 깎임 (최소 -7점, 최대 -75점 보장)
            double weightedBaseScore = baseScore * positionMultiplier;
            double inverseScore = weightedBaseScore == 0 ? 7.0 : Math.min(75.0, 15.0 / weightedBaseScore);
            weightedScore = -inverseScore; // 음수로 만들어서 감소점수로 만듦
        }
        
        // 승패에 따른 점수 적용
        double finalScore = isWinner ? weightedScore : weightedScore; // 패배 팀은 이미 음수
        
        // 승패 기본 점수 추가
        finalScore += baseWinLossScore;
        
        // 골드 보너스 적용
        double goldBonus = Math.round(((double) gameRecord.getTeam1Gold() / gameRecord.getTeam2Gold()) * 0.5);
        if (record.getTeamNumber() == 1) {
            finalScore += isWinner ? goldBonus : -goldBonus;
        } else {
            finalScore += isWinner ? goldBonus : -goldBonus;
        }
        
        // 서폿 시야 보너스 적용
        if ("SUP".equals(record.getAssignedPosition())) {
            PlayerGameRecord opponentSupport = playerRecords.stream()
                    .filter(p -> "SUP".equals(p.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                    .findFirst()
                    .orElse(null);
            
            if (opponentSupport != null) {
                double visionDiff = (double) (record.getCs() - opponentSupport.getCs()) / 10;
                finalScore += isWinner ? visionDiff : -visionDiff;
            }
        }
        
        // CS 보너스 적용 (서폿 제외)
        if (!"SUP".equals(record.getAssignedPosition())) {
            double csBonus = calculateCsBonus(record, playerRecords, gameRecord.isTeam1Won());
            finalScore += csBonus;
        }
        
        // 상대방과의 점수 격차 보너스/페널티 적용
        PlayerGameRecord opponent = playerRecords.stream()
                .filter(p -> p.getAssignedPosition().equals(record.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                .findFirst()
                .orElse(null);
        
        if (opponent != null) {
            double myScore = record.getKills() + record.getAssists(); // 내 점수 (KDA 기반)
            double opponentScore = opponent.getKills() + opponent.getAssists(); // 상대 점수 (KDA 기반)
            
            if (opponentScore > myScore) {
                // 상대방 점수가 높은 경우
                if (isWinner) {
                    // 이긴 경우: (상대 점수 / 내 점수) * 2 추가
                    double bonus = (opponentScore / myScore) * 2;
                    finalScore += bonus;
                } else {
                    // 진 경우: (내 점수 / 상대 점수) * 2 추가
                    double bonus = (myScore / opponentScore) * 2;
                    finalScore += bonus;
                }
            } else if (myScore > opponentScore) {
                // 내 점수가 높은 경우
                if (isWinner) {
                    // 이긴 경우: (상대 점수 / 내 점수) * 2 빼기
                    double penalty = (opponentScore / myScore) * 2;
                    finalScore -= penalty;
                } else {
                    // 진 경우: (내 점수 / 상대 점수) * 2 빼기
                    double penalty = (myScore / opponentScore) * 2;
                    finalScore -= penalty;
                }
            }
        }
        
        // 최종 점수 제한 적용
        if (isWinner) {
            finalScore = Math.max(7, Math.min(75, finalScore)); // 승리 팀 최소 +7점, 최대 +75점
        } else {
            finalScore = Math.min(-7, Math.max(-75, finalScore)); // 패배 팀 최소 -7점, 최대 -75점
        }
        
        // 연승/연패 보너스 추가
        int streakBonus = calculateStreakBonus(gameRecord.getUserId(), record.getPlayer().getPlayerId(), isWinner, gameRecord);
        finalScore += streakBonus;
        
        return (int) Math.round(finalScore);
    }

    @Transactional
    public void deleteGameRecord(Long gameId, String userId) {
        GameRecord gameRecord = gameRecordRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("게임 기록을 찾을 수 없습니다."));
        
        // 본인의 게임 기록인지 확인
        if (!gameRecord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        
        // 이미 반영된 게임이라면 점수를 되돌림
        if (gameRecord.isApplied()) {
            reverseGameResultFromScores(gameRecord);
        }
        
        // 연관된 PlayerGameRecord들을 먼저 삭제
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameId);
        playerGameRecordRepository.deleteAll(playerRecords);
        
        // 그 다음 GameRecord 삭제
        gameRecordRepository.delete(gameRecord);
    }
    
    private void reverseGameResultFromScores(GameRecord gameRecord) {
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
        Map<Long, Player> playerMap = new HashMap<>();
        
        // 플레이어들을 미리 로드
        for (PlayerGameRecord record : playerRecords) {
            playerMap.put(record.getPlayer().getPlayerId(), record.getPlayer());
        }
        
        // 점수 계산 및 역적용 (빼기)
        reverseScoreChanges(gameRecord, playerRecords, playerMap);
    }
    
    private void reverseScoreChanges(GameRecord gameRecord, List<PlayerGameRecord> playerRecords, Map<Long, Player> playerMap) {
        // 골드 보너스 계산
        double goldBonus = Math.round(((double) gameRecord.getTeam1Gold() / gameRecord.getTeam2Gold()) * 0.5);
        
        // 각 플레이어의 점수 계산 및 역적용 (빼기)
        for (PlayerGameRecord record : playerRecords) {
            Player player = playerMap.get(record.getPlayer().getPlayerId());
            
            // 승패에 따른 기본 점수 (승리 팀 +7점, 패배 팀 -7점)
            boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                              (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
            double baseWinLossScore = isWinner ? 7.0 : -7.0;
            
            // 기본 점수 계산: (킬수 + 어시스트) / 데스수 (데스가 0이면 킬+어시스트)
            double baseScore = record.getDeaths() == 0 ? 
                    record.getKills() + record.getAssists() : 
                    (double) (record.getKills() + record.getAssists()) / record.getDeaths();
            baseScore = Math.round(baseScore);
            
            // 포지션별 가중치 적용
            double positionMultiplier = getPositionMultiplier(record.getAssignedPosition());
            double weightedScore;
            
            if (isWinner) {
                // 승리 팀: 기존 방식 (KDA가 높을수록 높은 점수)
                weightedScore = baseScore * positionMultiplier;
                // 최소 +7점, 최대 +75점 보장
                weightedScore = Math.max(7.0, Math.min(75.0, weightedScore));
            } else {
                // 패배 팀: 포지션 가중치를 먼저 적용한 후 역수 처리
                // KDA가 높을수록 덜 깎임 (최소 -7점, 최대 -75점 보장)
                double weightedBaseScore = baseScore * positionMultiplier;
                double inverseScore = weightedBaseScore == 0 ? 7.0 : Math.min(75.0, 15.0 / weightedBaseScore);
                weightedScore = -inverseScore; // 음수로 만들어서 감소점수로 만듦
            }
            
            // 승패에 따른 점수 적용
            double finalScore = isWinner ? weightedScore : weightedScore; // 패배 팀은 이미 음수
            
            // 승패 기본 점수 추가
            finalScore += baseWinLossScore;
            
            // 골드 보너스 적용
            if (record.getTeamNumber() == 1) {
                finalScore += isWinner ? goldBonus : -goldBonus;
            } else {
                finalScore += isWinner ? goldBonus : -goldBonus;
            }
            
            // 서폿 시야 보너스 적용
            if ("SUP".equals(record.getAssignedPosition())) {
                // 같은 팀의 서폿과 상대팀의 서폿 찾기
                PlayerGameRecord opponentSupport = playerRecords.stream()
                        .filter(p -> "SUP".equals(p.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                        .findFirst()
                        .orElse(null);
                
                if (opponentSupport != null) {
                    double visionDiff = (double) (record.getCs() - opponentSupport.getCs()) / 10;
                    finalScore += isWinner ? visionDiff : -visionDiff;
                }
            }
            
            // CS 보너스 역적용 (서폿 제외)
            if (!"SUP".equals(record.getAssignedPosition())) {
                double csBonus = calculateCsBonus(record, playerRecords, gameRecord.isTeam1Won());
                finalScore += csBonus; // 역적용이므로 그대로 더함 (나중에 빼기 때문)
            }
            
            // 상대방과의 점수 격차 보너스/페널티 적용
            PlayerGameRecord opponent = playerRecords.stream()
                    .filter(p -> p.getAssignedPosition().equals(record.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                    .findFirst()
                    .orElse(null);
            
            if (opponent != null) {
                double myScore = record.getKills() + record.getAssists(); // 내 점수 (KDA 기반)
                double opponentScore = opponent.getKills() + opponent.getAssists(); // 상대 점수 (KDA 기반)
                
                if (opponentScore > myScore) {
                    // 상대방 점수가 높은 경우
                    if (isWinner) {
                        // 이긴 경우: (상대 점수 / 내 점수) * 3 추가
                        double bonus = (opponentScore / myScore) * 3;
                        finalScore += bonus;
                    } else {
                        // 진 경우: (내 점수 / 상대 점수) * 3 추가
                        double bonus = (myScore / opponentScore) * 3;
                        finalScore += bonus;
                    }
                } else if (myScore > opponentScore) {
                    // 내 점수가 높은 경우
                    if (isWinner) {
                        // 이긴 경우: (상대 점수 / 내 점수) 빼기
                        double penalty = opponentScore / myScore;
                        finalScore -= penalty;
                    } else {
                        // 진 경우: (내 점수 / 상대 점수) 빼기
                        double penalty = myScore / opponentScore;
                        finalScore -= penalty;
                    }
                }
            }
            
            // 최종 점수 제한 적용
            if (isWinner) {
                finalScore = Math.max(7, Math.min(75, finalScore)); // 승리 팀 최소 +7점, 최대 +75점
            } else {
                finalScore = Math.min(-7, Math.max(-75, finalScore)); // 패배 팀 최소 -7점, 최대 -75점
            }
            
            // 플레이어 점수 역업데이트 (빼기)
            int currentScore = player.getScore();
            int newScore = Math.max(0, currentScore - (int) Math.round(finalScore)); // 음수 방지
            player.setScore(newScore);
            
            // 연승/연패 역업데이트 (빼기)
            Integer currentStreak = player.getWinLossStreak();
            if (currentStreak == null) currentStreak = 0;
            
            if (isWinner) {
                // 승리 시 역업데이트 (빼기)
                if (currentStreak > 1) {
                    // 연승 중이었다면 -1
                    player.setWinLossStreak(currentStreak - 1);
                } else if (currentStreak == 1) {
                    // 1연승이었다면 0으로
                    player.setWinLossStreak(0);
                } else {
                    // 연패 중이었다면 +1
                    player.setWinLossStreak(currentStreak + 1);
                }
            } else {
                // 패배 시 역업데이트 (빼기)
                if (currentStreak < -1) {
                    // 연패 중이었다면 +1
                    player.setWinLossStreak(currentStreak + 1);
                } else if (currentStreak == -1) {
                    // 1연패이었다면 0으로
                    player.setWinLossStreak(0);
                } else {
                    // 연승 중이었다면 -1
                    player.setWinLossStreak(currentStreak - 1);
                }
            }
            
            playerRepository.save(player);
        }
    }

    @Transactional
    public void recalculateAllScores(String userId) {
        // 사용자의 모든 게임 기록 조회
        List<GameRecord> gameRecords = gameRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        for (GameRecord gameRecord : gameRecords) {
            // 이미 반영된 게임이면 먼저 점수를 되돌림
            if (gameRecord.isApplied()) {
                reverseGameResultFromScores(gameRecord);
            }
            
            // 새로운 점수 시스템으로 다시 적용
            List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
            Map<Long, Player> playerMap = new HashMap<>();
            
            // 플레이어들을 미리 로드
            for (PlayerGameRecord record : playerRecords) {
                playerMap.put(record.getPlayer().getPlayerId(), record.getPlayer());
            }
            
            // 점수 계산 및 적용
            calculateAndApplyScores(gameRecord, playerRecords, playerMap);
            
            // 게임 기록을 반영됨으로 표시
            gameRecord.setApplied(true);
            gameRecordRepository.save(gameRecord);
        }
    }
    
    @Transactional
    public void recalculateScoresOnly(String userId) {
        // 사용자의 모든 게임 기록 조회
        List<GameRecord> gameRecords = gameRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        
        for (GameRecord gameRecord : gameRecords) {
            // 이미 반영된 게임이면 먼저 점수를 되돌림
            if (gameRecord.isApplied()) {
                reverseGameResultFromScores(gameRecord);
            }
            
            // 새로운 점수 시스템으로 다시 적용
            List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
            Map<Long, Player> playerMap = new HashMap<>();
            
            // 플레이어들을 미리 로드
            for (PlayerGameRecord record : playerRecords) {
                playerMap.put(record.getPlayer().getPlayerId(), record.getPlayer());
            }
            
            // 점수 계산 및 적용
            calculateAndApplyScores(gameRecord, playerRecords, playerMap);
            
            // 게임 기록을 반영됨으로 표시
            gameRecord.setApplied(true);
            gameRecordRepository.save(gameRecord);
        }
    }

    public List<SimulatedScoreResponse> simulateScores(String userId) {
        List<GameRecord> gameRecords = gameRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<SimulatedScoreResponse> result = new ArrayList<>();
        for (GameRecord gameRecord : gameRecords) {
            List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
            for (PlayerGameRecord record : playerRecords) {
                Player player = record.getPlayer();
                int beforeScore = player.getScore();
                // 점수 계산 로직 복사 (DB 반영 X)
                boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                                  (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
                double baseWinLossScore = isWinner ? 7.0 : -7.0;
                double baseScore = record.getDeaths() == 0 ? 
                        record.getKills() + record.getAssists() : 
                        (double) (record.getKills() + record.getAssists()) / record.getDeaths();
                baseScore = Math.round(baseScore);
                double positionMultiplier = getPositionMultiplier(record.getAssignedPosition());
                double weightedScore;
                if (isWinner) {
                    weightedScore = baseScore * positionMultiplier;
                    // 최소 +7점 보장
                    weightedScore = Math.max(7.0, weightedScore);
                } else {
                    double weightedBaseScore = baseScore * positionMultiplier;
                    double inverseScore = weightedBaseScore == 0 ? 5.0 : Math.min(5.0, 10.0 / weightedBaseScore);
                    weightedScore = -inverseScore; // 음수로 만들어서 감소점수로 만듦
                }
                double finalScore = isWinner ? weightedScore : weightedScore; // 패배 팀은 이미 음수
                finalScore += baseWinLossScore;
                double goldBonus = Math.round(((double) gameRecord.getTeam1Gold() / gameRecord.getTeam2Gold()) * 0.5);
                if (record.getTeamNumber() == 1) {
                    finalScore += isWinner ? goldBonus : -goldBonus;
                } else {
                    finalScore += isWinner ? goldBonus : -goldBonus;
                }
                if ("SUP".equals(record.getAssignedPosition())) {
                    PlayerGameRecord opponentSupport = playerRecords.stream()
                            .filter(p -> "SUP".equals(p.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                            .findFirst()
                            .orElse(null);
                    if (opponentSupport != null) {
                        double visionDiff = (double) (record.getCs() - opponentSupport.getCs()) / 10;
                        finalScore += isWinner ? visionDiff : -visionDiff;
                    }
                }
                if (!"SUP".equals(record.getAssignedPosition())) {
                    double csBonus = calculateCsBonus(record, playerRecords, gameRecord.isTeam1Won());
                    finalScore += csBonus;
                }
                
                // 상대방과의 점수 격차 보너스/페널티 적용
                PlayerGameRecord opponent = playerRecords.stream()
                        .filter(p -> p.getAssignedPosition().equals(record.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                        .findFirst()
                        .orElse(null);
                
                if (opponent != null) {
                    double myScore = record.getKills() + record.getAssists(); // 내 점수 (KDA 기반)
                    double opponentScore = opponent.getKills() + opponent.getAssists(); // 상대 점수 (KDA 기반)
                    
                    if (opponentScore > myScore) {
                        // 상대방 점수가 높은 경우
                        if (isWinner) {
                            // 이긴 경우: (상대 점수 / 내 점수) * 2 추가
                            double bonus = (opponentScore / myScore) * 2;
                            finalScore += bonus;
                        } else {
                            // 진 경우: (내 점수 / 상대 점수) * 2 추가
                            double bonus = (myScore / opponentScore) * 2;
                            finalScore += bonus;
                        }
                    } else if (myScore > opponentScore) {
                        // 내 점수가 높은 경우
                        if (isWinner) {
                            // 이긴 경우: (상대 점수 / 내 점수) * 2 빼기
                            double penalty = (opponentScore / myScore) * 2;
                            finalScore -= penalty;
                        } else {
                            // 진 경우: (내 점수 / 상대 점수) * 2 빼기
                            double penalty = (myScore / opponentScore) * 2;
                            finalScore -= penalty;
                        }
                    }
                }
                
                // 최종 점수 제한 적용
                if (isWinner) {
                    finalScore = Math.max(7, finalScore); // 승리 팀 최소 +7점
                } else {
                    finalScore = Math.min(-5, finalScore); // 패배 팀 최소 -5점
                }
                
                int afterScore = Math.max(0, beforeScore + (int) Math.round(finalScore));
                result.add(SimulatedScoreResponse.builder()
                        .playerId(player.getPlayerId())
                        .playerName(player.getName())
                        .lolId(player.getLolId())
                        .beforeScore(beforeScore)
                        .afterScore(afterScore)
                        .gameId(gameRecord.getGameId())
                        .assignedPosition(record.getAssignedPosition())
                        .kills(record.getKills())
                        .deaths(record.getDeaths())
                        .assists(record.getAssists())
                        .cs(record.getCs())
                        .isWinner(isWinner)
                        .build());
            }
        }
        return result;
    }

    private int calculateStreakBonus(String userId, Long playerId, boolean isWinner, GameRecord currentGame) {
        // PlayerGameRecord에서 해당 플레이어의 기록 찾기
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(currentGame.getGameId());
        PlayerGameRecord playerRecord = playerRecords.stream()
                .filter(pr -> pr.getPlayer().getPlayerId().equals(playerId))
                .findFirst()
                .orElse(null);
        
        if (playerRecord == null) return 0;
        
        // 저장된 연승/연패 상태 사용 (없으면 현재 상태 사용)
        Integer currentStreak = playerRecord.getWinLossStreakAtGame();
        if (currentStreak == null) {
            // 저장된 값이 없으면 현재 플레이어 상태 사용 (기존 게임 기록들)
            Player player = playerRepository.findById(playerId).orElse(null);
            if (player == null) return 0;
            currentStreak = player.getWinLossStreak();
            if (currentStreak == null) currentStreak = 0;
        }
        
        // 이번 게임을 반영했을 때의 연승/연패 상태 계산
        int futureStreak;
        if (isWinner) {
            // 승리 시
            if (currentStreak < 0) {
                // 연패 중이었다면 1로 리셋
                futureStreak = 1;
            } else {
                // 연승 중이었다면 +1
                futureStreak = currentStreak + 1;
            }
        } else {
            // 패배 시
            if (currentStreak > 0) {
                // 연승 중이었다면 -1로 리셋
                futureStreak = -1;
            } else {
                // 연패 중이었다면 -1
                futureStreak = currentStreak - 1;
            }
        }
        
        // 연승/연패 보너스 계산 (미래 상태 기준)
        if (isWinner) {
            // 승리 시 연승 보너스 (연승이 2 이상일 때만)
            if (futureStreak >= 6) return 5; // 6연승 이상
            else if (futureStreak >= 4) return 3; // 4-5연승
            else if (futureStreak >= 2) return 2; // 2-3연승
            else return 0;
        } else {
            // 패배 시 연패 페널티 (연패가 -2 이하일 때만)
            if (futureStreak <= -6) return -5; // 6연패 이상
            else if (futureStreak <= -4) return -3; // 4-5연패
            else if (futureStreak <= -2) return -2; // 2-3연패
            else return 0;
        }
    }

    // 저장된 winLossStreakAtGame 값을 사용하여 streakBonus 계산
    private int calculateStreakBonusFromStoredData(PlayerGameRecord playerRecord, boolean isWinner) {
        Integer storedStreak = playerRecord.getWinLossStreakAtGame();
        if (storedStreak == null) {
            return 0; // 저장된 값이 없으면 0 반환
        }
        
        // 저장된 연승/연패 상태를 기반으로 미래 상태 계산
        int futureStreak;
        if (isWinner) {
            // 승리 시
            if (storedStreak < 0) {
                // 연패 중이었다면 1로 리셋
                futureStreak = 1;
            } else {
                // 연승 중이었다면 +1
                futureStreak = storedStreak + 1;
            }
        } else {
            // 패배 시
            if (storedStreak > 0) {
                // 연승 중이었다면 -1로 리셋
                futureStreak = -1;
            } else {
                // 연패 중이었다면 -1
                futureStreak = storedStreak - 1;
            }
        }
        
        // 연승/연패 보너스 계산 (미래 상태 기준)
        if (isWinner) {
            // 승리 시 연승 보너스 (연승이 2 이상일 때만)
            if (futureStreak >= 6) return 5; // 6연승 이상
            else if (futureStreak >= 4) return 3; // 4-5연승
            else if (futureStreak >= 2) return 2; // 2-3연승
            else return 0;
        } else {
            // 패배 시 연패 페널티 (연패가 -2 이하일 때만)
            if (futureStreak <= -6) return -5; // 6연패 이상
            else if (futureStreak <= -4) return -3; // 4-5연패
            else if (futureStreak <= -2) return -2; // 2-3연패
            else return 0;
        }
    }
} 