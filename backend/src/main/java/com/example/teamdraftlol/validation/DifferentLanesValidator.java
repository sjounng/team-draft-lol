package com.example.teamdraftlol.validation;

import com.example.teamdraftlol.dto.request.PlayerRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class DifferentLanesValidator implements ConstraintValidator<DifferentLanes, PlayerRequest> {
    @Override
    public boolean isValid(PlayerRequest request, ConstraintValidatorContext context) {
        if (request.getMainLane() == null || request.getSubLane() == null) {
            return true; // null 체크는 @NotBlank에서 처리
        }
        return !request.getMainLane().equals(request.getSubLane());
    }
} 