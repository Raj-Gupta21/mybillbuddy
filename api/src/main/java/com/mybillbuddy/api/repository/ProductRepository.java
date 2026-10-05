package com.mybillbuddy.api.repository;

import com.mybillbuddy.api.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOwnerUsername(String ownerUsername);
    Optional<Product> findByIdAndOwnerUsername(Long id, String ownerUsername);
    List<Product> findAllByOwnerUsernameIsNull();
}
