package com.mybillbuddy.api.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "site_settings")
public class SiteSettings {
    @Id private Long id = 1L;
    private String supportEmail = "";
    private String announcement = "";
    private boolean registrationOpen = true;
    public Long getId() { return id; }
    public String getSupportEmail() { return supportEmail; }
    public void setSupportEmail(String value) { supportEmail = value == null ? "" : value; }
    public String getAnnouncement() { return announcement; }
    public void setAnnouncement(String value) { announcement = value == null ? "" : value; }
    public boolean isRegistrationOpen() { return registrationOpen; }
    public void setRegistrationOpen(boolean value) { registrationOpen = value; }
}
