package com.mybillbuddy.api.repository;

import com.mybillbuddy.api.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    java.util.List<Bill> findAllByOwnerUsername(String ownerUsername);
    java.util.List<Bill> findAllByOwnerUsernameIsNull();
    java.util.Optional<Bill> findByIdAndOwnerUsername(Long id, String ownerUsername);
}
