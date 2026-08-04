package com.epiis.apibiblioteca;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.business.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtFilterTest {

    @Mock
    private JwtService jwtService;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtFilter jwtFilter;

    @BeforeEach
    public void setUp() throws Exception {
        MockitoAnnotations.openMocks(this);
        when(objectMapper.writeValueAsString(any())).thenReturn("{\"error\":\"mock\"}");
        StringWriter writer = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(writer));
    }

    @Test
    public void testOptionsRequest() throws Exception {
        when(request.getMethod()).thenReturn("OPTIONS");

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    public void testMissingAuthorizationHeader() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    public void testExpiredToken() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("Authorization")).thenReturn("Bearer token123");
        when(jwtService.isTokenValid("token123")).thenReturn(false);
        when(jwtService.isTokenExpired("token123")).thenReturn(true);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    public void testInvalidToken() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("Authorization")).thenReturn("Bearer token123");
        when(jwtService.isTokenValid("token123")).thenReturn(false);
        when(jwtService.isTokenExpired("token123")).thenReturn(false);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }

    @Test
    public void testValidToken() throws Exception {
        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("Authorization")).thenReturn("Bearer validtoken");
        when(jwtService.isTokenValid("validtoken")).thenReturn(true);
        when(jwtService.extractEmail("validtoken")).thenReturn("user@unamba.edu.pe");
        when(jwtService.extractRole("validtoken")).thenReturn("admin");
        when(jwtService.generateToken("user@unamba.edu.pe", "admin")).thenReturn("newtoken");

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(response).setHeader("Authorization", "Bearer newtoken");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    public void testShouldNotFilter() {
        when(request.getRequestURI()).thenReturn("/auth/login");
        assertTrue(jwtFilter.shouldNotFilter(request));

        when(request.getRequestURI()).thenReturn("/book");
        assertFalse(jwtFilter.shouldNotFilter(request));
    }
}
