package com.mybillbuddy.api.service;

import com.mybillbuddy.api.dto.ProductRequest;
import com.mybillbuddy.api.model.Product;
import com.mybillbuddy.api.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {
    private final ProductRepository repository;
    private final StockMovementService movements;
    public ProductService(ProductRepository repository, StockMovementService movements) { this.repository = repository; this.movements = movements; }
    public List<Product> getAll(String owner) { return repository.findAllByOwnerUsername(owner).stream().sorted(java.util.Comparator.comparing(Product::getId).reversed()).toList(); }
    public Product get(Long id, String owner) { return repository.findByIdAndOwnerUsername(id, owner).orElseThrow(() -> new NoSuchElementException("Product not found")); }
    @Transactional public Product create(ProductRequest request, String owner) { validate(request); Product product = apply(new Product(), request); product.setOwnerUsername(owner); Product saved = repository.save(product); movements.record(saved, saved.getStock(), "Opening stock", owner); return saved; }
    @Transactional public Product update(Long id, ProductRequest request, String owner) { validate(request); Product product = get(id, owner); int oldStock = product.getStock(); apply(product, request); Product saved = repository.save(product); movements.record(saved, saved.getStock() - oldStock, "Stock adjustment", owner); return saved; }
    @Transactional public Product updateStock(Long id, Integer stock, String owner) { if (stock == null || stock < 0) throw new IllegalArgumentException("Stock must be zero or more."); Product product = get(id, owner); int oldStock = product.getStock(); product.setStock(stock); Product saved = repository.save(product); movements.record(saved, stock - oldStock, "Stock adjustment", owner); return saved; }
    @Transactional public void delete(Long id, String owner) { Product product = get(id, owner); movements.record(product, -product.getStock(), "Product removed", owner); repository.delete(product); }
    private Product apply(Product product, ProductRequest request) { product.setName(request.getName().trim()); product.setCategory(request.getCategory()); product.setVariant(request.getVariant()); product.setStock(request.getStock()); product.setReorderLevel(request.getReorderLevel()); product.setPrice(request.getPrice()); return product; }
    private void validate(ProductRequest request) { if (request == null || request.getName() == null || request.getName().isBlank() || request.getStock() == null || request.getStock() < 0 || request.getReorderLevel() != null && request.getReorderLevel() < 0 || request.getPrice() == null || request.getPrice().signum() < 0) throw new IllegalArgumentException("Product name, non-negative stock, reorder level and price are required."); }
}
