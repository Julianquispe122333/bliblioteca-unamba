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

import com.epiis.apibiblioteca.business.BusinessCategory;
import com.epiis.apibiblioteca.dto.request.RequestCategorySave;
import com.epiis.apibiblioteca.entity.EntityCategory;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class CategoryControllerTest {

    @Mock
    private BusinessCategory businessCategory;

    @InjectMocks
    private CategoryController categoryController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        ResponseDataGeneric<List<EntityCategory>> res = new ResponseDataGeneric<>(new ArrayList<>());
        when(businessCategory.getAll()).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<List<EntityCategory>>> response = categoryController.getAll();
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testSave() {
        RequestCategorySave req = new RequestCategorySave();
        ResponseDataGeneric<EntityCategory> res = new ResponseDataGeneric<>(new EntityCategory());
        when(businessCategory.save(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<EntityCategory>> response = categoryController.save(req);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testDelete() {
        ResponseDataGeneric<Boolean> res = new ResponseDataGeneric<>(true);
        when(businessCategory.delete(1)).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<Boolean>> response = categoryController.delete(1);
        assertEquals(200, response.getStatusCode().value());
    }
}
