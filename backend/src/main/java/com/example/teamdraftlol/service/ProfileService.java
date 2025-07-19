package com.example.teamdraftlol.service;

import com.example.teamdraftlol.dto.request.ProfileRequest;
import com.example.teamdraftlol.dto.response.ProfileResponse;
import com.example.teamdraftlol.entity.Profile;
import com.example.teamdraftlol.repository.ProfileRepository;
import com.example.teamdraftlol.util.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final ProfileRepository profileRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public ProfileResponse register(ProfileRequest req) {

        if (profileRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        Profile p = Profile.builder()
                .id(UUID.randomUUID())
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .createdAt(Instant.now())
                .build();
        Profile saved = profileRepository.save(p);
        return ProfileResponse.fromEntity(saved);
    }

    public Map<String, Object> login(ProfileRequest req) {
        Profile profile = profileRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(req.getPassword(), profile.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        String token = JwtUtil.generateToken(profile.getId().toString());
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("profile", ProfileResponse.fromEntity(profile));
        return result;
    }

    public ProfileResponse getProfile(UUID userId) {
        Profile p = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));
        return ProfileResponse.fromEntity(p);
    }
}