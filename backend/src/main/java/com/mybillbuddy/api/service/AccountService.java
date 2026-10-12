package com.mybillbuddy.api.service;

import com.mybillbuddy.api.dto.AccountSettingsRequest;
import com.mybillbuddy.api.dto.RegisterRequest;
import com.mybillbuddy.api.model.Account;
import com.mybillbuddy.api.repository.AccountRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Locale;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class AccountService implements UserDetailsService {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private final AccountRepository repository;
    private final PasswordEncoder encoder;
    public AccountService(AccountRepository repository, PasswordEncoder encoder) { this.repository = repository; this.encoder = encoder; }

    @Override public UserDetails loadUserByUsername(String username) {
        return repository.findByUsernameIgnoreCase(username).orElseThrow(() -> new UsernameNotFoundException("Account not found"));
    }
    public Account get(String username) { return repository.findByUsernameIgnoreCase(username).orElseThrow(() -> new UsernameNotFoundException("Account not found")); }

    @Transactional
    public Account register(RegisterRequest request) {
        if (request == null || request.getUsername() == null || !EMAIL.matcher(request.getUsername().trim()).matches()) throw new IllegalArgumentException("Enter a valid email address.");
        String email = request.getUsername().trim().toLowerCase(Locale.ROOT);
        if (request.getPassword() == null || request.getPassword().length() < 12) throw new IllegalArgumentException("Use a password with at least 12 characters.");
        if (request.getName() == null || request.getName().isBlank() || request.getBusinessName() == null || request.getBusinessName().isBlank()) throw new IllegalArgumentException("Your name and business name are required.");
        if (repository.existsByUsernameIgnoreCase(email)) throw new IllegalArgumentException("An account with that email already exists.");
        Account account = new Account();
        account.setUsername(email);
        account.setPasswordHash(encoder.encode(request.getPassword()));
        account.setName(request.getName().trim());
        account.setBusinessName(request.getBusinessName().trim());
        return repository.save(account);
    }

    @Transactional
    public Account saveSettings(String username, AccountSettingsRequest request) {
        if (request == null || blank(request.getName()) || blank(request.getBusinessName())) throw new IllegalArgumentException("Name and business name are required.");
        if (request.getGstin() != null && !request.getGstin().isBlank() && !request.getGstin().trim().matches("(?i)^[0-9]{2}[a-z]{5}[0-9]{4}[a-z][a-z0-9]z[a-z0-9]$")) throw new IllegalArgumentException("Enter a valid 15-character GSTIN.");
        String currency = request.getCurrency() == null ? "INR" : request.getCurrency().toUpperCase(Locale.ROOT);
        if (!List.of("INR", "USD", "EUR").contains(currency)) throw new IllegalArgumentException("Choose INR, USD or EUR.");
        Account account = get(username);
        account.setName(request.getName().trim());
        account.setMobile(request.getMobile() == null ? "" : request.getMobile().trim());
        account.setBusinessName(request.getBusinessName().trim());
        account.setGstin(request.getGstin() == null ? "" : request.getGstin().trim().toUpperCase(Locale.ROOT));
        account.setCurrency(currency);
        account.setOverdueReminders(request.isOverdueReminders());
        account.setLowStockAlerts(request.isLowStockAlerts());
        account.setPaymentAlerts(request.isPaymentAlerts());
        return repository.save(account);
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
