package com.mybillbuddy.api.service;

import com.mybillbuddy.api.dto.PaymentRequest;
import com.mybillbuddy.api.model.Invoice;
import com.mybillbuddy.api.model.Payment;
import com.mybillbuddy.api.repository.InvoiceRepository;
import com.mybillbuddy.api.repository.PaymentRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class PaymentService {
    private final PaymentRepository repository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceService invoiceService;
    public PaymentService(PaymentRepository repository, InvoiceRepository invoiceRepository, InvoiceService invoiceService) { this.repository = repository; this.invoiceRepository = invoiceRepository; this.invoiceService = invoiceService; }
    public List<Payment> getAll(String owner) { return repository.findAllByOwnerUsername(owner).stream().sorted(java.util.Comparator.comparing(Payment::getId).reversed()).toList(); }
    public Payment get(Long id, String owner) { return repository.findById(id).filter(item -> owner.equals(item.getOwnerUsername())).orElseThrow(() -> new NoSuchElementException("Payment not found")); }

    @Transactional
    public Payment create(PaymentRequest request, String owner) {
        validate(request); Invoice invoice = validateInvoice(request, owner); validateBalance(invoice, request, owner, null);
        Payment payment = apply(new Payment(), request); payment.setOwnerUsername(owner);
        Payment saved = repository.save(payment); updateInvoiceStatus(saved.getInvoiceNumber(), owner); return saved;
    }
    @Transactional
    public Payment update(Long id, PaymentRequest request, String owner) {
        validate(request); Payment existing = get(id, owner); Invoice invoice = validateInvoice(request, owner); validateBalance(invoice, request, owner, id);
        String previousInvoice = existing.getInvoiceNumber();
        Payment saved = repository.save(apply(existing, request));
        updateInvoiceStatus(previousInvoice, owner); updateInvoiceStatus(saved.getInvoiceNumber(), owner); return saved;
    }
    @Transactional
    public void delete(Long id, String owner) { Payment payment = get(id, owner); repository.delete(payment); updateInvoiceStatus(payment.getInvoiceNumber(), owner); }

    private Payment apply(Payment payment, PaymentRequest request) { payment.setCustomerName(request.getCustomerName().trim()); payment.setInvoiceNumber(request.getInvoiceNumber().trim()); payment.setAmount(request.getAmount()); payment.setMethod(request.getMethod()); payment.setStatus(request.getStatus() == null || request.getStatus().isBlank() ? "Completed" : request.getStatus()); payment.setDate(request.getDate()); return payment; }
    private void validate(PaymentRequest request) {
        if (request == null || blank(request.getCustomerName()) || blank(request.getInvoiceNumber()) || blank(request.getMethod()) || blank(request.getDate()) || request.getAmount() == null || request.getAmount().signum() <= 0) throw new IllegalArgumentException("Customer, invoice, method, date and a positive payment amount are required.");
        try { LocalDate.parse(request.getDate()); } catch (RuntimeException exception) { throw new IllegalArgumentException("Payment date must use YYYY-MM-DD format."); }
        if (!List.of("UPI", "Cash", "Bank transfer", "Card", "Other").contains(request.getMethod())) throw new IllegalArgumentException("Choose a supported payment method.");
        if (request.getStatus() != null && !List.of("Completed", "Pending", "Refunded").contains(request.getStatus())) throw new IllegalArgumentException("Payment status must be Completed, Pending or Refunded.");
    }
    private Invoice validateInvoice(PaymentRequest request, String owner) {
        Invoice invoice = invoiceRepository.findByInvoiceNumberAndOwnerUsername(request.getInvoiceNumber().trim(), owner).orElseThrow(() -> new IllegalArgumentException("Choose an existing invoice for this account."));
        if (!invoice.getCustomerName().equalsIgnoreCase(request.getCustomerName().trim())) throw new IllegalArgumentException("The selected customer does not match this invoice.");
        return invoice;
    }
    private void validateBalance(Invoice invoice, PaymentRequest request, String owner, Long exceptId) {
        if (request.getStatus() != null && !request.getStatus().isBlank() && !"Completed".equalsIgnoreCase(request.getStatus())) return;
        BigDecimal paid = repository.findAllByOwnerUsername(owner).stream().filter(p -> p.getInvoiceNumber().equals(invoice.getInvoiceNumber()) && "Completed".equalsIgnoreCase(p.getStatus()) && (exceptId == null || !exceptId.equals(p.getId()))).map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (request.getAmount().compareTo(invoice.getTotal().subtract(paid)) > 0) throw new IllegalArgumentException("Payment is greater than the invoice balance of " + invoice.getTotal().subtract(paid).max(BigDecimal.ZERO) + ".");
    }
    private void updateInvoiceStatus(String number, String owner) {
        invoiceRepository.findByInvoiceNumberAndOwnerUsername(number, owner).ifPresent(invoice -> {
            BigDecimal paid = repository.findAllByOwnerUsername(owner).stream().filter(payment -> number.equals(payment.getInvoiceNumber()) && "Completed".equalsIgnoreCase(payment.getStatus())).map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
            invoice.setStatus(invoiceService.statusFor(invoice, paid));
            invoiceRepository.save(invoice);
        });
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
