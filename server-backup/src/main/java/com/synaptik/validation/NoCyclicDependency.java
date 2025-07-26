package com.synaptik.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = NoCyclicDependencyValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface NoCyclicDependency {
    String message() default "Cyclic dependency detected";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}