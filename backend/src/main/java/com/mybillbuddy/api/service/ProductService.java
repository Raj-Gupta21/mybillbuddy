package com.mybillbuddy.api.service;

import com.mybillbuddy.api.dto.ProductRequest;
import com.mybillbuddy.api.model.Product;
import com.mybillbuddy.api.repository.ProductRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class ProductService {
    private final ProductRepository repository;
    public ProductService(ProductRepository repository) { this.repository = repository; }
    public List<Product> getAll(String owner) { return repository.findAllByOwnerUsername(owner).stream().sorted(java.util.Comparator.comparing(Product::getId).reversed()).toList(); }
    public Product get(Long id, String owner) { return repository.findByIdAndOwnerUsername(id, owner).orElseThrow(() -> new NoSuchElementException("Product not found")); }
    public Product create(ProductRequest request, String owner) { validate(request); Product product = apply(new Product(), request); product.setOwnerUsername(owner); return repository.save(product); }
    public Product update(Long id, ProductRequest request, String owner) { validate(request); return repository.save(apply(get(id, owner), request)); }
    public Product updateStock(Long id, Integer stock, String owner) { if (stock == null || stock < 0) throw new IllegalArgumentException("Stock must be zero or more."); Product product = get(id, owner); product.setStock(stock); return repository.save(product); }
    public void delete(Long id, String owner) { repository.delete(get(id, owner)); }
    private Product apply(Product product, ProductRequest request) { product.setName(request.getName().trim()); product.setCategory(request.getCategory()); product.setStock(request.getStock()); product.setPrice(request.getPrice()); return product; }
    private void validate(ProductRequest request) { if (request == null || request.getName() == null || request.getName().isBlank() || request.getStock() == null || request.getStock() < 0 || request.getPrice() == null || request.getPrice().signum() < 0) throw new IllegalArgumentException("Product name, non-negative stock and non-negative price are required."); }
}
