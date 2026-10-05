package com.mybillbuddy.api.dto;

import java.math.BigDecimal;

public class DashboardStats {
    private BigDecimal totalSales;
    private BigDecimal received;
    private BigDecimal outstanding;
    private long invoiceCount;
    private double salesGrowth;
    public DashboardStats(BigDecimal totalSales, BigDecimal received, BigDecimal outstanding, long invoiceCount, double salesGrowth) {
        this.totalSales = totalSales;
        this.received = received;
        this.outstanding = outstanding;
        this.invoiceCount = invoiceCount;
        this.salesGrowth = salesGrowth;
    }
    public BigDecimal getTotalSales() { return totalSales; }
    public BigDecimal getReceived() { return received; }
    public BigDecimal getOutstanding() { return outstanding; }
    public long getInvoiceCount() { return invoiceCount; }
    public double getSalesGrowth() { return salesGrowth; }
}
