package com.mybillbuddy.api.service;

import com.mybillbuddy.api.model.Product;
import com.mybillbuddy.api.model.StockMovement;
import com.mybillbuddy.api.repository.StockMovementRepository;
import com.mybillbuddy.api.repository.ProductRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class StockMovementService {
    private final StockMovementRepository repository;
    private final ProductRepository products;
    public StockMovementService(StockMovementRepository repository, ProductRepository products) { this.repository = repository; this.products = products; }
    public List<StockMovement> getAll(String owner) { return repository.findAllByOwnerUsernameOrderByCreatedAtDesc(owner); }
    public void record(Product product, int quantityChange, String reason, String owner) {
        if (quantityChange == 0) return;
        StockMovement movement = new StockMovement();
        movement.setProductId(product.getId()); movement.setProductName(product.getName()); movement.setVariant(product.getVariant());
        movement.setQuantityChange(quantityChange); movement.setReason(reason); movement.setOwnerUsername(owner);
        repository.save(movement);
    }
    public StockMovement restore(StockMovement source, String owner) {
        if (source.getProductName() == null || source.getProductName().isBlank() || source.getQuantityChange() == null || source.getReason() == null || source.getReason().isBlank()) throw new IllegalArgumentException("A product, quantity change and reason are required.");
        StockMovement movement = new StockMovement();
        movement.setProductName(source.getProductName()); movement.setVariant(source.getVariant()); movement.setQuantityChange(source.getQuantityChange());
        movement.setReason(source.getReason()); movement.setCreatedAt(source.getCreatedAt() == null ? java.time.LocalDateTime.now() : source.getCreatedAt()); movement.setOwnerUsername(owner);
        products.findAllByOwnerUsername(owner).stream().filter(product -> product.getName().equalsIgnoreCase(source.getProductName()) && java.util.Objects.equals(product.getVariant(), source.getVariant())).findFirst().ifPresent(product -> movement.setProductId(product.getId()));
        return repository.save(movement);
    }
}
