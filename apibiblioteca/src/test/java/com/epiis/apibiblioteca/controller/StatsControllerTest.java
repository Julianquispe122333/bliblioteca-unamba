package com.epiis.apibiblioteca.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;

import com.epiis.apibiblioteca.business.BusinessStats;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class StatsControllerTest {

    @Mock
    private BusinessStats businessStats;

    @InjectMocks
    private StatsController statsController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAdminStats() {
        ResponseDataGeneric<Map<String, Object>> res = new ResponseDataGeneric<>(new HashMap<>());
        when(businessStats.getAdminStats()).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<Map<String, Object>>> response = statsController.getAdminStats();
        assertEquals(200, response.getStatusCode().value());
    }
}
