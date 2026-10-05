package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.CustomerRequest;
import com.mybillbuddy.api.model.Customer;
import com.mybillbuddy.api.service.CustomerService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerService service;

    public CustomerController(
            CustomerService service) {

        this.service = service;
    }

    @GetMapping
public List<Customer> getAllCustomers(Principal principal) {
    return service.getAllCustomers(principal.getName());
}
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomer(
            @PathVariable Long id, Principal principal) {

        try {
            return ResponseEntity.ok(
                    service.getCustomer(id, principal.getName())
            );
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public Customer createCustomer(
            @RequestBody CustomerRequest request, Principal principal) {

        return service.createCustomer(request, principal.getName());
    }

    @PutMapping("/{id}")
    public Customer updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerRequest request, Principal principal) {

        return service.updateCustomer(id, request, principal.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Long id, Principal principal) {

        service.deleteCustomer(id, principal.getName());

        return ResponseEntity.noContent().build();
    }
}
