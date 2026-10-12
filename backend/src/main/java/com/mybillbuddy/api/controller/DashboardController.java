package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.dto.DashboardStats;
import com.mybillbuddy.api.model.Invoice;
import com.mybillbuddy.api.model.Payment;
import com.mybillbuddy.api.repository.InvoiceRepository;
import com.mybillbuddy.api.repository.PaymentRepository;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    public DashboardController(InvoiceRepository invoices, PaymentRepository payments) { this.invoices = invoices; this.payments = payments; }

    @GetMapping("/summary")
    public DashboardStats summary(Principal user) {
        List<Invoice> all = invoices.findAllByOwnerUsername(user.getName());
        List<Payment> receivedPayments = payments.findAllByOwnerUsername(user.getName()).stream().filter(item -> "Completed".equalsIgnoreCase(item.getStatus())).toList();
        BigDecimal total = all.stream().map(Invoice::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal received = receivedPayments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal outstanding = all.stream().map(invoice -> balance(invoice, receivedPayments)).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardStats(total, received, outstanding, all.stream().filter(invoice -> balance(invoice, receivedPayments).signum() > 0).count(), 0);
    }

    @GetMapping("/sales")
    public List<Map<String, Object>> sales(@RequestParam(defaultValue = "7days") String period, Principal user) {
        int days = period.toLowerCase(Locale.ROOT).contains("30") ? 30 : period.toLowerCase(Locale.ROOT).contains("year") ? 365 : 7;
        LocalDate start = LocalDate.now().minusDays(days - 1L);
        Map<LocalDate, BigDecimal> grouped = new TreeMap<>();
        for (Invoice invoice : invoices.findAllByOwnerUsername(user.getName())) {
            try { LocalDate date = LocalDate.parse(invoice.getDate()); if (!date.isBefore(start) && !date.isAfter(LocalDate.now())) grouped.merge(date, invoice.getTotal(), BigDecimal::add); }
            catch (RuntimeException ignored) { }
        }
        return grouped.entrySet().stream().map(entry -> Map.<String, Object>of("date", entry.getKey().getDayOfWeek().getDisplayName(java.time.format.TextStyle.SHORT, Locale.ENGLISH), "sales", entry.getValue())).toList();
    }

    @GetMapping("/recent-transactions")
    public List<Map<String, Object>> recentTransactions(Principal user) {
        var invoiceItems = invoices.findAllByOwnerUsernameOrderByIdDesc(user.getName()).stream().map(item -> activity(item.getCustomerName(), item.getInvoiceNumber() + " · " + item.getStatus(), item.getTotal(), item.getDate(), "invoice"));
        var paymentItems = payments.findAllByOwnerUsernameOrderByIdDesc(user.getName()).stream().map(item -> activity(item.getCustomerName(), "Payment · " + item.getMethod(), item.getAmount(), item.getDate(), "payment"));
        return java.util.stream.Stream.concat(invoiceItems, paymentItems).sorted(Comparator.comparing((Map<String, Object> item) -> String.valueOf(item.get("date"))).reversed()).limit(8).toList();
    }

    private BigDecimal balance(Invoice invoice, List<Payment> payments) {
        BigDecimal paid = payments.stream().filter(item -> invoice.getInvoiceNumber().equals(item.getInvoiceNumber())).map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return invoice.getTotal().subtract(paid).max(BigDecimal.ZERO);
    }
    private Map<String, Object> activity(String customer, String description, BigDecimal amount, String date, String type) { return Map.of("customerName", customer, "description", description, "amount", amount, "date", date, "type", type); }
}
