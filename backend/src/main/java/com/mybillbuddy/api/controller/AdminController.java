package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.model.Account;
import com.mybillbuddy.api.model.SiteSettings;
import com.mybillbuddy.api.repository.AccountRepository;
import com.mybillbuddy.api.repository.SiteSettingsRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.security.Principal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AccountRepository accounts;
    private final SiteSettingsRepository settings;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();
    @Value("${app.admin.email:}") private String adminEmail;

    public AdminController(AccountRepository accounts, SiteSettingsRepository settings, PasswordEncoder encoder) {
        this.accounts = accounts; this.settings = settings; this.encoder = encoder;
    }

    @GetMapping("/status") public Map<String, Boolean> status(Principal user) {
        return Map.of("admin", isAdmin(user));
    }

    @GetMapping("/notice") public Map<String, String> notice() {
        SiteSettings site = settings.findById(1L).orElseGet(SiteSettings::new);
        return Map.of("announcement", site.getAnnouncement(), "supportEmail", site.getSupportEmail());
    }

    @GetMapping("/overview") public Map<String, Object> overview(Principal user) {
        requireAdmin(user);
        List<Account> all = accounts.findAllByOrderByIdAsc();
        List<Map<String, Object>> users = all.stream().map(this::accountView).toList();
        List<Map<String, Object>> activity = all.stream().filter(a -> a.getLastLoginAt() != null)
                .sorted(Comparator.comparing(Account::getLastLoginAt).reversed()).limit(12)
                .map(a -> Map.<String, Object>of("type", "Sign in", "username", a.getUsername(), "at", a.getLastLoginAt())).toList();
        SiteSettings site = settings.findById(1L).orElseGet(SiteSettings::new);
        return Map.of("accounts", users, "activity", activity, "health", Map.of("api", "UP", "database", accounts.count() >= 0 ? "UP" : "DOWN", "checkedAt", Instant.now()), "settings", site);
    }

    @PatchMapping("/accounts/{id}/enabled") public Map<String, Object> setEnabled(@PathVariable Long id, @RequestBody Map<String, Boolean> body, Principal user) {
        requireAdmin(user);
        Account account = accounts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));
        if (account.getUsername().equalsIgnoreCase(adminEmail)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The site administrator cannot be disabled here.");
        account.setEnabled(Boolean.TRUE.equals(body.get("enabled")));
        return accountView(accounts.save(account));
    }

    @PostMapping("/accounts/{id}/reset-password") public Map<String, String> resetPassword(@PathVariable Long id, Principal user) {
        requireAdmin(user);
        Account account = accounts.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));
        if (account.getUsername().equalsIgnoreCase(adminEmail)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The administrator password must be changed through the account itself.");
        byte[] bytes = new byte[18]; random.nextBytes(bytes);
        String temporaryPassword = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes) + "A9!";
        account.setPasswordHash(encoder.encode(temporaryPassword)); account.setEnabled(true); accounts.save(account);
        return Map.of("username", account.getUsername(), "temporaryPassword", temporaryPassword);
    }

    @PutMapping("/settings") public SiteSettings saveSettings(@RequestBody SiteSettings input, Principal user) {
        requireAdmin(user);
        SiteSettings site = settings.findById(1L).orElseGet(SiteSettings::new);
        site.setSupportEmail(input.getSupportEmail());
        site.setAnnouncement(input.getAnnouncement());
        site.setRegistrationOpen(input.isRegistrationOpen());
        return settings.save(site);
    }

    private Map<String, Object> accountView(Account account) {
        Map<String, Object> view = new LinkedHashMap<>();
        view.put("id", account.getId()); view.put("username", account.getUsername()); view.put("name", account.getName());
        view.put("businessName", account.getBusinessName()); view.put("enabled", account.isEnabled());
        view.put("createdAt", account.getCreatedAt()); view.put("lastLoginAt", account.getLastLoginAt());
        return view;
    }
    private boolean isAdmin(Principal user) { return user != null && accounts.findByUsernameIgnoreCase(user.getName()).map(Account::isSiteAdmin).orElse(false); }
    private void requireAdmin(Principal user) { if (!isAdmin(user)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrator access required."); }
}
