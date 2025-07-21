package com.example.teamdraftlol.service;

import com.example.teamdraftlol.dto.request.GameRecordRequest;
import com.example.teamdraftlol.dto.request.PlayerGameRecordRequest;
import com.example.teamdraftlol.dto.response.GameRecordResponse;
import com.example.teamdraftlol.dto.response.GameRecordSummaryResponse;
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
    
    private int getStreakBonus(Integer streak, boolean isWinner) {
        int s = streak != null ? streak : 0;
        int futureStreak = isWinner
            ? (s < 0 ? 1 : s + 1)
            : (s > 0 ? -1 : s - 1);
        if (isWinner) {
            if (futureStreak >= 6) return 5;
            else if (futureStreak >= 4) return 3;
            else if (futureStreak >= 2) return 2;
            else return 0;
        } else {
            if (futureStreak <= -6) return -5;
            else if (futureStreak <= -4) return -3;
            else if (futureStreak <= -2) return -2;
            else return 0;
        }
    }

    private void calculateAndApplyScores(GameRecord gameRecord, List<PlayerGameRecord> playerRecords, Map<Long, Player> playerMap) {
        for (PlayerGameRecord record : playerRecords) {
            Player player = playerMap.get(record.getPlayer().getPlayerId());
            boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                    (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
            int total = isWinner ? 7 : -7;
            double kda = record.getDeaths() == 0 ? record.getKills() + record.getAssists() : (double) (record.getKills() + record.getAssists()) / record.getDeaths();
            PlayerGameRecord opponent = playerRecords.stream()
                    .filter(p -> p.getAssignedPosition().equals(record.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                    .findFirst().orElse(null);
            double kdaOpponent = opponent != null ? (opponent.getDeaths() == 0 ? opponent.getKills() + opponent.getAssists() : (double) (opponent.getKills() + opponent.getAssists()) / opponent.getDeaths()) : 1.0;
            double coef = getLaneCoef(record.getAssignedPosition());
            if (isWinner) {
                total += Math.round(kda * coef);
            } else {
                total -= Math.round((kdaOpponent / (kda == 0 ? 1 : kda)) * coef);
            }
            int myTeamGold = record.getTeamNumber() == 1 ? gameRecord.getTeam1Gold() : gameRecord.getTeam2Gold();
            int oppTeamGold = record.getTeamNumber() == 1 ? gameRecord.getTeam2Gold() : gameRecord.getTeam1Gold();
            int goldDiff = (int) Math.round(((double) myTeamGold / (oppTeamGold == 0 ? 1 : oppTeamGold)) * 5);
            total += isWinner ? goldDiff : -goldDiff;
            int myTeamKills = record.getTeamNumber() == 1 ? gameRecord.getTeam1Kills() : gameRecord.getTeam2Kills();
            int oppTeamKills = record.getTeamNumber() == 1 ? gameRecord.getTeam2Kills() : gameRecord.getTeam1Kills();
            int killDiff = (int) Math.round((myTeamKills - oppTeamKills) * 0.5);
            total += isWinner ? killDiff : -killDiff;
            if (opponent != null) {
                int cs = record.getCs();
                int csOpponent = opponent.getCs();
                int csCoef = (int) Math.round(((double) Math.max(cs, csOpponent) / Math.max(Math.min(cs, csOpponent), 1)) * 5);
                total += cs > csOpponent ? csCoef : -csCoef;
            }
            if (opponent != null) {
                int kdaCoef = (int) Math.round((Math.max(kda, kdaOpponent) / Math.max(Math.min(kda, kdaOpponent), 1)) * 5);
                total += kda > kdaOpponent ? kdaCoef : -kdaCoef;
            }
            if (opponent != null) {
                int myScore = player.getScore();
                int oppScore = opponent.getPlayer().getScore();
                double scoreCoef = (double) Math.max(myScore, oppScore) / Math.max(Math.min(myScore, oppScore), 1);
                if (myScore < oppScore) {
                    if (!isWinner) {
                        total += Math.round(scoreCoef);
                        total -= Math.round(scoreCoef * 3);
                    } else {
                        total += Math.round(scoreCoef * 3);
                        total -= Math.round(scoreCoef * 5);
                    }
                }
            }
            if (isWinner) total = Math.max(10, Math.min(75, total));
            else total = Math.max(-75, Math.min(-10, total));
            // streakBonus 적용
            int streak = record.getWinLossStreakAtGame() != null ? record.getWinLossStreakAtGame() : 0;
            int streakBonus = getStreakBonus(streak, isWinner);
            total += streakBonus;
            int currentScore = player.getScore();
            int newScore = Math.max(0, currentScore + total);
            player.setScore(newScore);
            Integer currentStreak = player.getWinLossStreak();
            if (currentStreak == null) currentStreak = 0;
            record.setWinLossStreakAtGame(currentStreak);
            if (isWinner) {
                if (currentStreak < 0) {
                    player.setWinLossStreak(1);
                } else {
                    player.setWinLossStreak(currentStreak + 1);
                }
            } else {
                if (currentStreak > 0) {
                    player.setWinLossStreak(-1);
                } else {
                    player.setWinLossStreak(currentStreak - 1);
                }
            }
            playerRepository.save(player);
        }
        playerGameRecordRepository.saveAll(playerRecords);
    }

    private double getLaneCoef(String position) {
        switch (position) {
            case "TOP": return 2.0;
            case "JGL": return 1.5;
            case "MID": return 1.5;
            case "ADC": return 1.2;
            case "SUP": return 1.0;
            default: return 1.0;
        }
    }

    private int calculateSimulatedScore(PlayerGameRecord record, List<PlayerGameRecord> playerRecords, GameRecord gameRecord) {
        boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
        int total = isWinner ? 7 : -7;
        double kda = record.getDeaths() == 0 ? record.getKills() + record.getAssists() : (double) (record.getKills() + record.getAssists()) / record.getDeaths();
        PlayerGameRecord opponent = playerRecords.stream()
                .filter(p -> p.getAssignedPosition().equals(record.getAssignedPosition()) && p.getTeamNumber() != record.getTeamNumber())
                .findFirst().orElse(null);
        double kdaOpponent = opponent != null ? (opponent.getDeaths() == 0 ? opponent.getKills() + opponent.getAssists() : (double) (opponent.getKills() + opponent.getAssists()) / opponent.getDeaths()) : 1.0;
        double coef = getLaneCoef(record.getAssignedPosition());
        if (isWinner) {
            total += Math.round(kda * coef);
        } else {
            total -= Math.round((kdaOpponent / (kda == 0 ? 1 : kda)) * coef);
        }
        int myTeamGold = record.getTeamNumber() == 1 ? gameRecord.getTeam1Gold() : gameRecord.getTeam2Gold();
        int oppTeamGold = record.getTeamNumber() == 1 ? gameRecord.getTeam2Gold() : gameRecord.getTeam1Gold();
        int goldDiff = (int) Math.round(((double) myTeamGold / (oppTeamGold == 0 ? 1 : oppTeamGold)) * 5);
        total += isWinner ? goldDiff : -goldDiff;
        int myTeamKills = record.getTeamNumber() == 1 ? gameRecord.getTeam1Kills() : gameRecord.getTeam2Kills();
        int oppTeamKills = record.getTeamNumber() == 1 ? gameRecord.getTeam2Kills() : gameRecord.getTeam1Kills();
        int killDiff = (int) Math.round((myTeamKills - oppTeamKills) * 0.5);
        total += isWinner ? killDiff : -killDiff;
        if (opponent != null) {
            int cs = record.getCs();
            int csOpponent = opponent.getCs();
            int csCoef = (int) Math.round(((double) Math.max(cs, csOpponent) / Math.max(Math.min(cs, csOpponent), 1)) * 5);
            total += cs > csOpponent ? csCoef : -csCoef;
        }
        if (opponent != null) {
            int kdaCoef = (int) Math.round((Math.max(kda, kdaOpponent) / Math.max(Math.min(kda, kdaOpponent), 1)) * 5);
            total += kda > kdaOpponent ? kdaCoef : -kdaCoef;
        }
        if (opponent != null) {
            int myScore = record.getPlayer().getScore();
            int oppScore = opponent.getPlayer().getScore();
            double scoreCoef = (double) Math.max(myScore, oppScore) / Math.max(Math.min(myScore, oppScore), 1);
            if (myScore < oppScore) {
                if (!isWinner) {
                    total += Math.round(scoreCoef);
                    total -= Math.round(scoreCoef * 3);
                } else {
                    total += Math.round(scoreCoef * 3);
                    total -= Math.round(scoreCoef * 5);
                }
            }
        }
        if (isWinner) total = Math.max(10, Math.min(75, total));
        else total = Math.max(-75, Math.min(-10, total));
        // streakBonus 적용
        int streak = record.getWinLossStreakAtGame() != null ? record.getWinLossStreakAtGame() : 0;
        int streakBonus = getStreakBonus(streak, isWinner);
        total += streakBonus;
        return total;
    }
    
    public List<GameRecordSummaryResponse> getUserGameRecords(String userId) {
        // 게임 기록 조회
        List<GameRecord> gameRecords = gameRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return gameRecords.stream()
                .map(gr -> GameRecordSummaryResponse.builder()
                        .gameId(gr.getGameId())
                        .team1Won(gr.isTeam1Won())
                        .team1Kills(gr.getTeam1Kills())
                        .team2Kills(gr.getTeam2Kills())
                        .team1Gold(gr.getTeam1Gold())
                        .team2Gold(gr.getTeam2Gold())
                        .isApplied(gr.isApplied())
                        .createdAt(gr.getCreatedAt())
                        .build())
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
            if (futureStreak >= 2) return futureStreak;
            else return 0;
        } else {
            if (futureStreak <= -2) return -futureStreak;
            else return 0;
        }
    }

    private void reverseGameResultFromScores(GameRecord gameRecord) {
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
        Map<Long, Player> playerMap = new HashMap<>();
        for (PlayerGameRecord record : playerRecords) {
            playerMap.put(record.getPlayer().getPlayerId(), record.getPlayer());
        }
        // 점수 계산 및 역적용 (빼기)
        // reverseScoreChanges(gameRecord, playerRecords, playerMap); // 삭제됨
    }

    @Transactional
    public void deleteGameRecord(Long gameId, String userId) {
        GameRecord gameRecord = gameRecordRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("게임 기록을 찾을 수 없습니다."));
        if (!gameRecord.getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }
        // 점수 되돌리기 없이 바로 삭제
        List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameId);
        playerGameRecordRepository.deleteAll(playerRecords);
        gameRecordRepository.delete(gameRecord);
    }

    public List<SimulatedScoreResponse> simulateScores(String userId) {
        List<GameRecord> gameRecords = gameRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<SimulatedScoreResponse> result = new ArrayList<>();
        for (GameRecord gameRecord : gameRecords) {
            List<PlayerGameRecord> playerRecords = playerGameRecordRepository.findByGameRecord_GameId(gameRecord.getGameId());
            for (PlayerGameRecord record : playerRecords) {
                Player player = record.getPlayer();
                int beforeScore = player.getScore();
                int simulatedScore = calculateSimulatedScore(record, playerRecords, gameRecord);
                int afterScore = Math.max(0, beforeScore + simulatedScore);
                boolean isWinner = (record.getTeamNumber() == 1 && gameRecord.isTeam1Won()) ||
                                   (record.getTeamNumber() == 2 && !gameRecord.isTeam1Won());
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
} 