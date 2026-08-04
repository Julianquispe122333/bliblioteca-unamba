package com.epiis.apibiblioteca.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import com.epiis.apibiblioteca.business.BusinessLoan;
import com.epiis.apibiblioteca.dto.request.RequestLoanCreate;
import com.epiis.apibiblioteca.dto.request.RequestLoanReturn;
import com.epiis.apibiblioteca.dto.response.ResponseLoan;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class LoanControllerTest {

    @Mock
    private BusinessLoan businessLoan;

    @InjectMocks
    private LoanController loanController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        ResponseDataGeneric<List<ResponseLoan>> res = new ResponseDataGeneric<>(new ArrayList<>());
        when(businessLoan.getAll()).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<List<ResponseLoan>>> response = loanController.getAll();
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testCreateFromReservation() {
        RequestLoanCreate req = new RequestLoanCreate();
        ResponseDataGeneric<ResponseLoan> res = new ResponseDataGeneric<>(new ResponseLoan());
        when(businessLoan.createFromReservation(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<ResponseLoan>> response = loanController.createFromReservation(req);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testReturnBooks() {
        RequestLoanReturn req = new RequestLoanReturn();
        ResponseDataGeneric<ResponseLoan> res = new ResponseDataGeneric<>(new ResponseLoan());
        when(businessLoan.returnBooks(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<ResponseLoan>> response = loanController.returnBooks(req);
        assertEquals(200, response.getStatusCode().value());
    }
}
