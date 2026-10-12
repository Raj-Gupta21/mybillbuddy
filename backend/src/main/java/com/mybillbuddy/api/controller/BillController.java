package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.model.Bill;
import com.mybillbuddy.api.repository.BillRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bills")
public class BillController {
    private final BillRepository repository;
    public BillController(BillRepository repository) { this.repository = repository; }
    @GetMapping public List<Bill> getAll(Principal user) { return repository.findAllByOwnerUsername(user.getName()); }
    @GetMapping("/{id}") public ResponseEntity<Bill> get(@PathVariable Long id, Principal user) { return repository.findByIdAndOwnerUsername(id, user.getName()).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @PostMapping public Bill create(@RequestBody Bill bill, Principal user) { bill.setOwnerUsername(user.getName()); bill.setId(null); return repository.save(bill); }
    @PutMapping("/{id}") public ResponseEntity<Bill> update(@PathVariable Long id, @RequestBody Bill details, Principal user) {
        return repository.findByIdAndOwnerUsername(id, user.getName()).map(bill -> { bill.setCustomerName(details.getCustomerName()); bill.setCustomerEmail(details.getCustomerEmail()); bill.setBillNumber(details.getBillNumber()); bill.setAmount(details.getAmount()); bill.setStatus(details.getStatus()); return ResponseEntity.ok(repository.save(bill)); }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id, Principal user) {
        return repository.findByIdAndOwnerUsername(id, user.getName()).map(bill -> { repository.delete(bill); return ResponseEntity.noContent().<Void>build(); }).orElse(ResponseEntity.notFound().build());
    }
}
