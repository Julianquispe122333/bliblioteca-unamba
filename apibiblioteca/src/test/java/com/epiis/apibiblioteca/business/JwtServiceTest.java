package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    public void setUp() {
        jwtService = new JwtService();
    }

    @Test
    public void testGenerateAndValidateToken() {
        String token = jwtService.generateToken("test@unamba.edu.pe", "admin");
        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token));
        assertEquals("test@unamba.edu.pe", jwtService.extractEmail(token));
        assertEquals("admin", jwtService.extractRole(token));
        assertFalse(jwtService.isTokenExpired(token));
    }

    @Test
    public void testInvalidToken() {
        assertFalse(jwtService.isTokenValid("invalid.token.str"));
        assertFalse(jwtService.isTokenExpired("invalid.token.str"));
    }
}
