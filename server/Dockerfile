# Multi-stage build for Quarkus API server
FROM gradle:8-jdk21 AS build

WORKDIR /app

# Copy Gradle files
COPY build.gradle ./
COPY gradle.properties ./
COPY settings.gradle ./
COPY gradle/ gradle/

# Copy source code
COPY src/ src/

# Build the application
RUN gradle build -x test

# Runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR
COPY --from=build /app/build/quarkus-app/ ./

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "quarkus-run.jar"]