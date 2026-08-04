package com.epiis.apibiblioteca.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;

import com.epiis.apibiblioteca.business.BusinessAuth;
import com.epiis.apibiblioteca.dto.request.RequestLogin;
import com.epiis.apibiblioteca.dto.response.ResponseLogin;

public class AuthControllerTest {

    @Mock
    private BusinessAuth businessAuth;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testLoginSuccess() {
        RequestLogin req = new RequestLogin();
        req.setEmail("test@unamba.edu.pe");
        req.setCode("123456");
        req.setRole("student");

        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.hasErrors()).thenReturn(false);

        ResponseLogin res = new ResponseLogin();
        res.success();
        when(businessAuth.login(any())).thenReturn(res);

        ResponseEntity<ResponseLogin> response = authController.login(req, bindingResult);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testLoginBindingResultError() {
        RequestLogin req = new RequestLogin();
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.hasErrors()).thenReturn(true);

        ResponseEntity<ResponseLogin> response = authController.login(req, bindingResult);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    public void testLoginBusinessError() {
        RequestLogin req = new RequestLogin();
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.hasErrors()).thenReturn(false);

        ResponseLogin res = new ResponseLogin();
        res.error();
        when(businessAuth.login(any())).thenReturn(res);

        ResponseEntity<ResponseLogin> response = authController.login(req, bindingResult);
        assertEquals(400, response.getStatusCode().value());
    }
}
