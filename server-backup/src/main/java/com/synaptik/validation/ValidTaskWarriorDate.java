package com.synaptik.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = TaskWarriorDateValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidTaskWarriorDate {
    String message() default "Invalid date format. Use ISO date format (YYYY-MM-DD) or TaskWarrior-style relative dates";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}