package com.example.teamdraftlol.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileRequest {
    
    private String username;

    @Email @NotBlank
    private String email;

    @NotBlank
    private String password;
}
