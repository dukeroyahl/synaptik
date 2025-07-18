package com.synaptik.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = TaskStateTransitionValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTaskStateTransition {
    String message() default "Invalid task state transition";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}