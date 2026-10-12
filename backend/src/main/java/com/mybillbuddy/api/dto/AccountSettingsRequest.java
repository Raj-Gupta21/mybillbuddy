package com.mybillbuddy.api.dto;

public class AccountSettingsRequest {
    private String name;
    private String mobile;
    private String businessName;
    private String gstin;
    private String currency;
    private boolean overdueReminders;
    private boolean lowStockAlerts;
    private boolean paymentAlerts;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public boolean isOverdueReminders() { return overdueReminders; }
    public void setOverdueReminders(boolean value) { this.overdueReminders = value; }
    public boolean isLowStockAlerts() { return lowStockAlerts; }
    public void setLowStockAlerts(boolean value) { this.lowStockAlerts = value; }
    public boolean isPaymentAlerts() { return paymentAlerts; }
    public void setPaymentAlerts(boolean value) { this.paymentAlerts = value; }
}
