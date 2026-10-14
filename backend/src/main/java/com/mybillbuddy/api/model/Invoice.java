package com.mybillbuddy.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices", uniqueConstraints = @UniqueConstraint(columnNames = {"owner_username", "invoice_number"}))
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;
    @Column(name = "customer_name", nullable = false)
    private String customerName;
    @Column(nullable = false)
    private String date;
    @Column(name = "due_date")
    private String dueDate;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(name = "tax_mode", nullable = false)
    private String taxMode = "IGST";
    @Column(nullable = false)
    private String status = "Pending";
    @Column(nullable = false)
    private boolean inventoryAdjusted = false;
    @Column(name = "owner_username")
    private String ownerUsername;
    @ElementCollection
    @CollectionTable(name = "invoice_line_items", joinColumns = @JoinColumn(name = "invoice_id"))
    @OrderColumn(name = "line_order")
    private List<InvoiceLineItem> lineItems = new ArrayList<>();

    public Invoice() { }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total == null ? BigDecimal.ZERO : total; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal == null ? BigDecimal.ZERO : subtotal; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount == null ? BigDecimal.ZERO : taxAmount; }
    public String getTaxMode() { return taxMode; }
    public void setTaxMode(String taxMode) { this.taxMode = taxMode; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isInventoryAdjusted() { return inventoryAdjusted; }
    public void setInventoryAdjusted(boolean inventoryAdjusted) { this.inventoryAdjusted = inventoryAdjusted; }
    public String getOwnerUsername() { return ownerUsername; }
    public void setOwnerUsername(String ownerUsername) { this.ownerUsername = ownerUsername; }
    public List<InvoiceLineItem> getLineItems() { return lineItems; }
    public void setLineItems(List<InvoiceLineItem> lineItems) { this.lineItems = lineItems == null ? new ArrayList<>() : new ArrayList<>(lineItems); }
}
