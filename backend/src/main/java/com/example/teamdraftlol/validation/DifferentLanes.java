package com.example.teamdraftlol.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = DifferentLanesValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface DifferentLanes {
    String message() default "주 라인과 부 라인은 같을 수 없습니다";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
} 