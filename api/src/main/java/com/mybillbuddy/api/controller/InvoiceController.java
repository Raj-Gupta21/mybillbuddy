package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.InvoiceRequest;
import com.mybillbuddy.api.model.Invoice;
import com.mybillbuddy.api.service.InvoiceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {
    private final InvoiceService service;
    public InvoiceController(InvoiceService service) { this.service = service; }
    @GetMapping public List<Invoice> getAll(Principal user) { return service.getAll(user.getName()); }
    @GetMapping("/{id}") public Invoice get(@PathVariable Long id, Principal user) { return service.get(id, user.getName()); }
    @PostMapping public ResponseEntity<Invoice> create(@RequestBody InvoiceRequest request, Principal user) { return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, user.getName())); }
    @PutMapping("/{id}") public Invoice update(@PathVariable Long id, @RequestBody InvoiceRequest request, Principal user) { return service.update(id, request, user.getName()); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id, Principal user) { service.delete(id, user.getName()); return ResponseEntity.noContent().build(); }
}
