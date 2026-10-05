package com.mybillbuddy.api.dto;

import java.math.BigDecimal;
import java.util.List;
import com.mybillbuddy.api.model.InvoiceLineItem;

public class InvoiceRequest {
    private String invoiceNumber;
    private String customerName;
    private String date;
    private String dueDate;
    private BigDecimal total;
    private String status;
    private String taxMode;
    private List<InvoiceLineItem> lineItems;
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTaxMode() { return taxMode; }
    public void setTaxMode(String taxMode) { this.taxMode = taxMode; }
    public List<InvoiceLineItem> getLineItems() { return lineItems; }
    public void setLineItems(List<InvoiceLineItem> lineItems) { this.lineItems = lineItems; }
}
