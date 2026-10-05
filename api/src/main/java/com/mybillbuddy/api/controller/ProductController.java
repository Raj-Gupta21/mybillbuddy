package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.ProductRequest;
import com.mybillbuddy.api.model.Product;
import com.mybillbuddy.api.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.security.Principal;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service) { this.service = service; }
    @GetMapping public List<Product> getAll(Principal user) { return service.getAll(user.getName()); }
    @GetMapping("/{id}") public Product get(@PathVariable Long id, Principal user) { return service.get(id, user.getName()); }
    @PostMapping public ResponseEntity<Product> create(@RequestBody ProductRequest request, Principal user) { return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request, user.getName())); }
    @PutMapping("/{id}") public Product update(@PathVariable Long id, @RequestBody ProductRequest request, Principal user) { return service.update(id, request, user.getName()); }
    @PatchMapping("/{id}/stock") public Product updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> request, Principal user) { return service.updateStock(id, request.get("stock"), user.getName()); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id, Principal user) { service.delete(id, user.getName()); return ResponseEntity.noContent().build(); }
}
