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

import com.epiis.apibiblioteca.business.BusinessReservation;
import com.epiis.apibiblioteca.dto.request.RequestReservationCreate;
import com.epiis.apibiblioteca.dto.response.ResponseReservation;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class ReservationControllerTest {

    @Mock
    private BusinessReservation businessReservation;

    @InjectMocks
    private ReservationController reservationController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        ResponseDataGeneric<List<ResponseReservation>> res = new ResponseDataGeneric<>(new ArrayList<>());
        when(businessReservation.getAll()).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<List<ResponseReservation>>> response = reservationController.getAll();
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testGetByStudent() {
        ResponseDataGeneric<List<ResponseReservation>> res = new ResponseDataGeneric<>(new ArrayList<>());
        when(businessReservation.getByStudent("Juan")).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<List<ResponseReservation>>> response = reservationController.getByStudent("Juan");
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testGetByCode() {
        ResponseDataGeneric<ResponseReservation> res = new ResponseDataGeneric<>(new ResponseReservation());
        when(businessReservation.getByCode("RES123")).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<ResponseReservation>> response = reservationController.getByCode("RES123");
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testCreate() {
        RequestReservationCreate req = new RequestReservationCreate();
        ResponseDataGeneric<ResponseReservation> res = new ResponseDataGeneric<>(new ResponseReservation());
        when(businessReservation.create(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<ResponseReservation>> response = reservationController.create(req);
        assertEquals(200, response.getStatusCode().value());
    }
}
