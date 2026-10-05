package com.mybillbuddy.api.repository;

import com.mybillbuddy.api.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findAllByOwnerUsername(String ownerUsername);
    List<Payment> findAllByOwnerUsernameOrderByIdDesc(String ownerUsername);
    boolean existsByInvoiceNumberAndOwnerUsername(String invoiceNumber, String ownerUsername);
    List<Payment> findAllByOwnerUsernameIsNull();
}
