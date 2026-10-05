package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.model.Invoice;
import com.mybillbuddy.api.model.Payment;
import com.mybillbuddy.api.repository.InvoiceRepository;
import com.mybillbuddy.api.repository.PaymentRepository;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    public ReportController(InvoiceRepository invoices, PaymentRepository payments) { this.invoices = invoices; this.payments = payments; }
    @GetMapping("/sales")
    public Map<String, Object> sales(Principal user) {
        List<Invoice> all = invoices.findAllByOwnerUsername(user.getName());
        List<Payment> completed = payments.findAllByOwnerUsername(user.getName()).stream().filter(item -> "Completed".equalsIgnoreCase(item.getStatus())).toList();
        BigDecimal total = all.stream().map(Invoice::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal received = completed.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = all.stream().map(invoice -> invoice.getTotal().subtract(completed.stream().filter(payment -> invoice.getInvoiceNumber().equals(payment.getInvoiceNumber())).map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add)).max(BigDecimal.ZERO)).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("totalSales", total, "received", received, "outstanding", outstanding, "invoiceCount", all.size());
    }
}
