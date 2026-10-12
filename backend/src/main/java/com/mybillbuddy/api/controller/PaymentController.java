package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.PaymentRequest;
import com.mybillbuddy.api.model.Payment;
import com.mybillbuddy.api.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService service;
    public PaymentController(PaymentService service) { this.service = service; }
    @GetMapping public List<Payment> getAll(Principal user) { return service.getAll(user.getName()); }
    @GetMapping("/{id}") public Payment get(@PathVariable Long id, Principal user) { return service.get(id, user.getName()); }
    @PostMapping public ResponseEntity<Payment> create(@RequestBody PaymentRequest request, Principal user) { return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, user.getName())); }
    @PutMapping("/{id}") public Payment update(@PathVariable Long id, @RequestBody PaymentRequest request, Principal user) { return service.update(id, request, user.getName()); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id, Principal user) { service.delete(id, user.getName()); return ResponseEntity.noContent().build(); }
}
