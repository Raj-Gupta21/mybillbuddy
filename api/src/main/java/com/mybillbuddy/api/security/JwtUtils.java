package com.mybillbuddy.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import jakarta.annotation.PostConstruct;

import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Objects;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.issuer:mybillbuddy-api}")
    private String jwtIssuer;

    @Value("${app.jwt.expiration-ms:3600000}")
    private long jwtExpirationMs;

    @PostConstruct
    public void validateSecret() {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("Set JWT_SECRET to a random value at least 32 bytes long before starting the API.");
        }
        if (jwtExpirationMs < 60_000 || jwtExpirationMs > 86_400_000) {
            throw new IllegalStateException("JWT_EXPIRATION_MS must be between 60000 and 86400000 milliseconds.");
        }
        if (jwtIssuer == null || jwtIssuer.isBlank()) {
            throw new IllegalStateException("JWT_ISSUER must not be blank.");
        }
    }

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username) {

        Date issuedAt = new Date();
        return Jwts.builder()
                .setIssuer(jwtIssuer)
                .setSubject(Objects.requireNonNull(username, "username"))
                .setIssuedAt(issuedAt)
                .setExpiration(new Date(issuedAt.getTime() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsernameFromJwtToken(String token) {

        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .requireIssuer(jwtIssuer)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {

        try {

            String subject = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .requireIssuer(jwtIssuer)
                    .build()
                    .parseClaimsJws(authToken)
                    .getBody()
                    .getSubject();
            return subject != null && !subject.isBlank();
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
