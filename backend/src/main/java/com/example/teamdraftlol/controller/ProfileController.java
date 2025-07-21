package com.example.teamdraftlol.controller;

import com.example.teamdraftlol.dto.request.ProfileRequest;
import com.example.teamdraftlol.dto.response.ProfileResponse;
import com.example.teamdraftlol.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profileService;

    @PostMapping("/register")
    public ResponseEntity<ProfileResponse> register(@Valid @RequestBody ProfileRequest req) {
        return ResponseEntity.ok(profileService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody ProfileRequest req) {
        try {
            return ResponseEntity.ok(profileService.login(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
