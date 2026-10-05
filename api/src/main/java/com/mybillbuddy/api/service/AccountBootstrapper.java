package com.mybillbuddy.api.service;

import com.mybillbuddy.api.model.Account;
import com.mybillbuddy.api.model.Bill;
import com.mybillbuddy.api.model.Customer;
import com.mybillbuddy.api.model.Invoice;
import com.mybillbuddy.api.model.Payment;
import com.mybillbuddy.api.model.Product;
import com.mybillbuddy.api.repository.AccountRepository;
import com.mybillbuddy.api.repository.BillRepository;
import com.mybillbuddy.api.repository.CustomerRepository;
import com.mybillbuddy.api.repository.InvoiceRepository;
import com.mybillbuddy.api.repository.PaymentRepository;
import com.mybillbuddy.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Component
public class AccountBootstrapper implements ApplicationRunner {
    @Value("${app.auth.username:}") private String bootstrapUsername;
    @Value("${app.auth.password:}") private String bootstrapPassword;
    private final AccountRepository accounts;
    private final BillRepository bills;
    private final CustomerRepository customers;
    private final ProductRepository products;
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    private final PasswordEncoder encoder;
    public AccountBootstrapper(AccountRepository accounts, BillRepository bills, CustomerRepository customers, ProductRepository products, InvoiceRepository invoices, PaymentRepository payments, PasswordEncoder encoder) {
        this.accounts = accounts; this.bills = bills; this.customers = customers; this.products = products; this.invoices = invoices; this.payments = payments; this.encoder = encoder;
    }
    @Override @Transactional
    public void run(ApplicationArguments args) {
        if (bootstrapUsername == null || bootstrapUsername.isBlank() || bootstrapPassword == null || bootstrapPassword.length() < 12) return;
        Account account = accounts.findByUsernameIgnoreCase(bootstrapUsername.trim()).orElseGet(() -> {
            Account created = new Account(); created.setUsername(bootstrapUsername.trim().toLowerCase()); created.setPasswordHash(encoder.encode(bootstrapPassword));
            int at = bootstrapUsername.indexOf('@'); created.setName(at > 0 ? bootstrapUsername.substring(0, at) : "Business owner"); created.setBusinessName("MyBillBuddy Workspace");
            return accounts.save(created);
        });
        List<Customer> legacyCustomers = customers.findAllByOwnerUsernameIsNull();
        List<Product> legacyProducts = products.findAllByOwnerUsernameIsNull();
        List<Invoice> legacyInvoices = invoices.findAllByOwnerUsernameIsNull();
        List<Payment> legacyPayments = payments.findAllByOwnerUsernameIsNull();
        List<Bill> legacyBills = bills.findAllByOwnerUsernameIsNull();
        claimLegacy(legacyCustomers, account.getUsername(), Customer::setOwnerUsername);
        claimLegacy(legacyProducts, account.getUsername(), Product::setOwnerUsername);
        claimLegacy(legacyInvoices, account.getUsername(), Invoice::setOwnerUsername);
        claimLegacy(legacyPayments, account.getUsername(), Payment::setOwnerUsername);
        claimLegacy(legacyBills, account.getUsername(), Bill::setOwnerUsername);
        customers.saveAll(legacyCustomers);
        products.saveAll(legacyProducts);
        invoices.saveAll(legacyInvoices);
        payments.saveAll(legacyPayments);
        bills.saveAll(legacyBills);
    }
    private <T> void claimLegacy(List<T> records, String owner, OwnerSetter<T> setter) { records.forEach(item -> setter.set(item, owner)); }
    @FunctionalInterface private interface OwnerSetter<T> { void set(T item, String owner); }
}
