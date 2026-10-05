package com.mybillbuddy.api.repository;

import com.mybillbuddy.api.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository
        extends JpaRepository<Customer, Long> {
    List<Customer> findAllByOwnerUsername(String ownerUsername);
    Optional<Customer> findByIdAndOwnerUsername(Long id, String ownerUsername);
    List<Customer> findAllByOwnerUsernameIsNull();
}
