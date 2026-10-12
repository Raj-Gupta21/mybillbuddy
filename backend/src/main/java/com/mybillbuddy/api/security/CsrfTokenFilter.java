package com.mybillbuddy.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class CsrfTokenFilter extends OncePerRequestFilter {
    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getServletPath();
        return "GET".equals(method) || "HEAD".equals(method) || "OPTIONS".equals(method) || "TRACE".equals(method)
                || ("POST".equals(method) && ("/api/auth/login".equals(path) || "/api/auth/register".equals(path)));
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String cookieToken = null;
        if (request.getCookies() != null) for (Cookie cookie : request.getCookies()) if ("MB_CSRF".equals(cookie.getName())) cookieToken = cookie.getValue();
        String headerToken = request.getHeader("X-CSRF-TOKEN");
        if (!StringUtils.hasText(cookieToken) || !StringUtils.hasText(headerToken) || !MessageDigest.isEqual(cookieToken.getBytes(StandardCharsets.UTF_8), headerToken.getBytes(StandardCharsets.UTF_8))) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Missing or invalid request verification token.");
            return;
        }
        chain.doFilter(request, response);
    }
}
