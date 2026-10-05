package com.mybillbuddy.api.service;

import com.mybillbuddy.api.dto.InvoiceRequest;
import com.mybillbuddy.api.model.Customer;
import com.mybillbuddy.api.model.Invoice;
import com.mybillbuddy.api.model.InvoiceLineItem;
import com.mybillbuddy.api.repository.CustomerRepository;
import com.mybillbuddy.api.repository.InvoiceRepository;
import com.mybillbuddy.api.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class InvoiceService {
    private static final List<BigDecimal> GST_RATES = List.of(BigDecimal.ZERO, new BigDecimal("5"), new BigDecimal("12"), new BigDecimal("18"), new BigDecimal("28"));
    private final InvoiceRepository repository;
    private final CustomerRepository customers;
    private final PaymentRepository payments;
    public InvoiceService(InvoiceRepository repository, CustomerRepository customers, PaymentRepository payments) { this.repository = repository; this.customers = customers; this.payments = payments; }

    public List<Invoice> getAll(String owner) { return repository.findAllByOwnerUsername(owner).stream().sorted(java.util.Comparator.comparing(Invoice::getId).reversed()).toList(); }
    public Invoice get(Long id, String owner) { return repository.findByIdAndOwnerUsername(id, owner).orElseThrow(() -> new NoSuchElementException("Invoice not found")); }

    @Transactional
    public Invoice create(InvoiceRequest request, String owner) {
        validate(request, owner);
        if (repository.existsByInvoiceNumberAndOwnerUsername(request.getInvoiceNumber().trim(), owner)) throw new IllegalArgumentException("That invoice number is already in use.");
        Invoice invoice = apply(new Invoice(), request);
        invoice.setOwnerUsername(owner);
        invoice.setStatus(statusFor(invoice, BigDecimal.ZERO));
        return repository.save(invoice);
    }

    @Transactional
    public Invoice update(Long id, InvoiceRequest request, String owner) {
        validate(request, owner);
        Invoice invoice = get(id, owner);
        repository.findByInvoiceNumberAndOwnerUsername(request.getInvoiceNumber().trim(), owner).filter(found -> !found.getId().equals(id)).ifPresent(found -> { throw new IllegalArgumentException("That invoice number is already in use."); });
        List<com.mybillbuddy.api.model.Payment> relatedPayments = payments.findAllByOwnerUsername(owner).stream().filter(payment -> invoice.getInvoiceNumber().equals(payment.getInvoiceNumber())).toList();
        if (!relatedPayments.isEmpty() && (!invoice.getInvoiceNumber().equals(request.getInvoiceNumber().trim()) || !invoice.getCustomerName().equalsIgnoreCase(request.getCustomerName().trim()))) throw new IllegalArgumentException("Invoice number and customer cannot be changed after a payment is recorded.");
        apply(invoice, request);
        BigDecimal paid = relatedPayments.stream().filter(payment -> "Completed".equalsIgnoreCase(payment.getStatus())).map(com.mybillbuddy.api.model.Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (paid.compareTo(invoice.getTotal()) > 0) throw new IllegalArgumentException("The new invoice total cannot be less than payments already recorded.");
        invoice.setStatus(statusFor(invoice, paid));
        return repository.save(invoice);
    }

    @Transactional
    public void delete(Long id, String owner) {
        Invoice invoice = get(id, owner);
        if (payments.existsByInvoiceNumberAndOwnerUsername(invoice.getInvoiceNumber(), owner)) throw new IllegalArgumentException("This invoice has payment history and cannot be deleted.");
        repository.delete(invoice);
    }

    public String statusFor(Invoice invoice, BigDecimal paid) {
        if (paid.compareTo(invoice.getTotal()) >= 0) return "Paid";
        if (invoice.getDueDate() != null && !invoice.getDueDate().isBlank() && LocalDate.parse(invoice.getDueDate()).isBefore(LocalDate.now())) return "Overdue";
        return "Pending";
    }

    private Invoice apply(Invoice invoice, InvoiceRequest request) {
        invoice.setInvoiceNumber(request.getInvoiceNumber().trim());
        invoice.setCustomerName(request.getCustomerName().trim());
        invoice.setDate(request.getDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setTaxMode(request.getTaxMode() == null || request.getTaxMode().isBlank() ? "IGST" : request.getTaxMode());
        List<InvoiceLineItem> items = normalizedItems(request);
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        for (InvoiceLineItem item : items) {
            BigDecimal base = item.getQuantity().multiply(item.getUnitPrice()).setScale(2, RoundingMode.HALF_UP);
            subtotal = subtotal.add(base);
            tax = tax.add(base.multiply(item.getGstRate()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
        }
        invoice.setLineItems(items);
        invoice.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        invoice.setTaxAmount(tax.setScale(2, RoundingMode.HALF_UP));
        invoice.setTotal(invoice.getSubtotal().add(invoice.getTaxAmount()).setScale(2, RoundingMode.HALF_UP));
        return invoice;
    }

    private List<InvoiceLineItem> normalizedItems(InvoiceRequest request) {
        if (request.getLineItems() != null && !request.getLineItems().isEmpty()) return new ArrayList<>(request.getLineItems());
        InvoiceLineItem legacy = new InvoiceLineItem();
        legacy.setDescription("Invoice total"); legacy.setQuantity(BigDecimal.ONE); legacy.setUnitPrice(request.getTotal()); legacy.setGstRate(BigDecimal.ZERO);
        return List.of(legacy);
    }

    private void validate(InvoiceRequest request, String owner) {
        if (request == null || blank(request.getInvoiceNumber()) || blank(request.getCustomerName()) || blank(request.getDate())) throw new IllegalArgumentException("Invoice number, customer and issue date are required.");
        try { LocalDate.parse(request.getDate()); } catch (RuntimeException exception) { throw new IllegalArgumentException("Invoice date must use YYYY-MM-DD format."); }
        if (request.getDueDate() != null && !request.getDueDate().isBlank()) {
            try { if (LocalDate.parse(request.getDueDate()).isBefore(LocalDate.parse(request.getDate()))) throw new IllegalArgumentException("The due date cannot be before the invoice date."); }
            catch (java.time.format.DateTimeParseException exception) { throw new IllegalArgumentException("Due date must use YYYY-MM-DD format."); }
        }
        Customer customer = customers.findAllByOwnerUsername(owner).stream().filter(item -> item.getName().equalsIgnoreCase(request.getCustomerName().trim())).findFirst().orElseThrow(() -> new IllegalArgumentException("Choose a customer from your customer list."));
        if (customer.getOwnerUsername() == null) throw new IllegalArgumentException("The selected customer is not assigned to this account.");
        if (request.getLineItems() != null) {
            if (request.getLineItems().isEmpty()) throw new IllegalArgumentException("Add at least one invoice line item.");
            for (InvoiceLineItem item : request.getLineItems()) {
                if (item == null || blank(item.getDescription()) || item.getQuantity() == null || item.getQuantity().signum() <= 0 || item.getUnitPrice() == null || item.getUnitPrice().signum() < 0 || item.getGstRate() == null || GST_RATES.stream().noneMatch(rate -> rate.compareTo(item.getGstRate()) == 0)) throw new IllegalArgumentException("Each item needs a description, positive quantity, non-negative price and supported GST rate (0%, 5%, 12%, 18% or 28%).");
            }
        } else if (request.getTotal() == null || request.getTotal().signum() < 0) throw new IllegalArgumentException("Invoice total must be zero or more.");
        if (request.getTaxMode() != null && !request.getTaxMode().isBlank() && !List.of("IGST", "CGST_SGST").contains(request.getTaxMode())) throw new IllegalArgumentException("Choose IGST or CGST + SGST.");
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
}
