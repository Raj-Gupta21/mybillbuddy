package com.mybillbuddy.api.model;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "accounts")
public class Account implements UserDetails {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 190)
    private String username;
    @Column(nullable = false, length = 100)
    private String passwordHash;
    @Column(nullable = false)
    private String name = "Business owner";
    @Column(nullable = false)
    private String businessName = "My Business";
    private String mobile = "";
    @Column(length = 15)
    private String gstin = "";
    @Column(nullable = false, length = 3)
    private String currency = "INR";
    @Column(nullable = false)
    private boolean overdueReminders = true;
    @Column(nullable = false)
    private boolean lowStockAlerts = true;
    @Column(nullable = false)
    private boolean paymentAlerts = true;
    @Column(nullable = false)
    private boolean enabled = true;
    @Column(name = "site_admin", nullable = false)
    private boolean siteAdmin = false;
    @Column(name = "created_at", updatable = false)
    private java.time.Instant createdAt = java.time.Instant.now();
    @Column(name = "last_login_at")
    private java.time.Instant lastLoginAt;

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    @Override public String getPassword() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public boolean isOverdueReminders() { return overdueReminders; }
    public void setOverdueReminders(boolean value) { this.overdueReminders = value; }
    public boolean isLowStockAlerts() { return lowStockAlerts; }
    public void setLowStockAlerts(boolean value) { this.lowStockAlerts = value; }
    public boolean isPaymentAlerts() { return paymentAlerts; }
    public void setPaymentAlerts(boolean value) { this.paymentAlerts = value; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isSiteAdmin() { return siteAdmin; }
    public void setSiteAdmin(boolean siteAdmin) { this.siteAdmin = siteAdmin; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public java.time.Instant getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(java.time.Instant lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return siteAdmin ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN")) : List.of(new SimpleGrantedAuthority("ROLE_USER")); }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
