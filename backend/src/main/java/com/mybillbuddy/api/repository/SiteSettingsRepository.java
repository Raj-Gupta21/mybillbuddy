package com.mybillbuddy.api.repository;

import com.mybillbuddy.api.model.SiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteSettingsRepository extends JpaRepository<SiteSettings, Long> { }
