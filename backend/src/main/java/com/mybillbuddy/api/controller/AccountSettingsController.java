package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.AccountSettingsRequest;
import com.mybillbuddy.api.model.Account;
import com.mybillbuddy.api.service.AccountService;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/account/settings")
public class AccountSettingsController {
    private final AccountService service;
    public AccountSettingsController(AccountService service) { this.service = service; }
    @GetMapping public AccountSettingsRequest get(Principal principal) { return toRequest(service.get(principal.getName())); }
    @PutMapping public AccountSettingsRequest update(@RequestBody AccountSettingsRequest request, Principal principal) { return toRequest(service.saveSettings(principal.getName(), request)); }
    private AccountSettingsRequest toRequest(Account account) {
        AccountSettingsRequest request = new AccountSettingsRequest();
        request.setName(account.getName()); request.setMobile(account.getMobile()); request.setBusinessName(account.getBusinessName()); request.setGstin(account.getGstin()); request.setCurrency(account.getCurrency());
        request.setOverdueReminders(account.isOverdueReminders()); request.setLowStockAlerts(account.isLowStockAlerts()); request.setPaymentAlerts(account.isPaymentAlerts());
        return request;
    }
}
