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

import com.epiis.apibiblioteca.business.BusinessBook;
import com.epiis.apibiblioteca.dto.request.RequestBookSave;
import com.epiis.apibiblioteca.dto.response.ResponseBook;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class BookControllerTest {

    @Mock
    private BusinessBook businessBook;

    @InjectMocks
    private BookController bookController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        ResponseDataGeneric<List<ResponseBook>> res = new ResponseDataGeneric<>(new ArrayList<>());
        when(businessBook.getAll()).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<List<ResponseBook>>> response = bookController.getAll();
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testSave() {
        RequestBookSave req = new RequestBookSave();
        ResponseDataGeneric<ResponseBook> res = new ResponseDataGeneric<>(new ResponseBook());
        when(businessBook.save(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<ResponseBook>> response = bookController.save(req);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testDelete() {
        ResponseDataGeneric<Boolean> res = new ResponseDataGeneric<>(true);
        when(businessBook.delete(1)).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<Boolean>> response = bookController.delete(1);
        assertEquals(200, response.getStatusCode().value());
    }
}
