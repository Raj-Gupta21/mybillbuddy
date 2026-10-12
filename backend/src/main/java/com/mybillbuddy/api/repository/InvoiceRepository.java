package com.mybillbuddy.api.repository;

import com.mybillbuddy.api.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    boolean existsByInvoiceNumber(String invoiceNumber);
    List<Invoice> findAllByOwnerUsername(String ownerUsername);
    List<Invoice> findAllByOwnerUsernameOrderByIdDesc(String ownerUsername);
    Optional<Invoice> findByIdAndOwnerUsername(Long id, String ownerUsername);
    Optional<Invoice> findByInvoiceNumberAndOwnerUsername(String invoiceNumber, String ownerUsername);
    boolean existsByInvoiceNumberAndOwnerUsername(String invoiceNumber, String ownerUsername);
    List<Invoice> findAllByOwnerUsernameIsNull();
}
