package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.AuthRequest;
import com.mybillbuddy.api.dto.CsrfResponse;
import com.mybillbuddy.api.dto.RegisterRequest;
import com.mybillbuddy.api.dto.SessionResponse;
import com.mybillbuddy.api.model.Account;
import com.mybillbuddy.api.security.JwtUtils;
import com.mybillbuddy.api.service.AccountService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.Duration;
import java.util.Map;
import java.security.SecureRandom;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AccountService accounts;
    private final SecureRandom random = new SecureRandom();
    @Value("${app.auth.cookie-secure:false}") private boolean secureCookie;
    @Value("${app.auth.cookie-same-site:Lax}") private String sameSite;
    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils, AccountService accounts) { this.authenticationManager = authenticationManager; this.jwtUtils = jwtUtils; this.accounts = accounts; }

    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(@RequestBody AuthRequest request) {
        try {
            Authentication auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            Account account = accounts.recordLogin(auth.getName());
            return withSession(account);
        } catch (AuthenticationException exception) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(@RequestBody RegisterRequest request) {
        Account account = accounts.register(request);
        return withSession(account);
    }

    @GetMapping("/me")
    public SessionResponse me(Principal principal) {
        Account account = accounts.get(principal.getName());
        return new SessionResponse(account.getUsername(), account.getBusinessName(), jwtUtils.getJwtExpirationMs() / 1000, null);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        ResponseCookie cookie = ResponseCookie.from("MYBILLBUDDY_SESSION", "").httpOnly(true).secure(secureCookie).path("/api").sameSite(sameSite).maxAge(Duration.ZERO).build();
        ResponseCookie csrf = ResponseCookie.from("MB_CSRF", "").httpOnly(false).secure(secureCookie).path("/api").sameSite(sameSite).maxAge(Duration.ZERO).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).header(HttpHeaders.SET_COOKIE, csrf.toString()).body(Map.of("message", "Signed out."));
    }

    @GetMapping("/csrf")
    public ResponseEntity<CsrfResponse> csrf() { return withCsrf(newCsrfToken()); }

    private ResponseEntity<SessionResponse> withSession(Account account) {
        String token = jwtUtils.generateToken(account.getUsername());
        ResponseCookie cookie = ResponseCookie.from("MYBILLBUDDY_SESSION", token).httpOnly(true).secure(secureCookie).path("/api").sameSite(sameSite).maxAge(Duration.ofMillis(jwtUtils.getJwtExpirationMs())).build();
        String csrfToken = newCsrfToken();
        ResponseCookie csrf = ResponseCookie.from("MB_CSRF", csrfToken).httpOnly(false).secure(secureCookie).path("/api").sameSite(sameSite).maxAge(Duration.ofMillis(jwtUtils.getJwtExpirationMs())).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).header(HttpHeaders.SET_COOKIE, csrf.toString()).body(new SessionResponse(account.getUsername(), account.getBusinessName(), jwtUtils.getJwtExpirationMs() / 1000, csrfToken));
    }

    private ResponseEntity<CsrfResponse> withCsrf(String token) {
        ResponseCookie cookie = ResponseCookie.from("MB_CSRF", token).httpOnly(false).secure(secureCookie).path("/api").sameSite(sameSite).maxAge(Duration.ofMillis(jwtUtils.getJwtExpirationMs())).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(new CsrfResponse(token));
    }
    private String newCsrfToken() { byte[] bytes = new byte[32]; random.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
}
