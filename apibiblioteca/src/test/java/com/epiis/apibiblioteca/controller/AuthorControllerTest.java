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
import org.springframework.validation.BindingResult;

import com.epiis.apibiblioteca.business.BusinessAuthor;
import com.epiis.apibiblioteca.dto.request.RequestAuthorSave;
import com.epiis.apibiblioteca.entity.EntityAuthor;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class AuthorControllerTest {

    @Mock
    private BusinessAuthor businessAuthor;

    @InjectMocks
    private AuthorController authorController;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        ResponseDataGeneric<List<EntityAuthor>> res = new ResponseDataGeneric<>(new ArrayList<>());
        when(businessAuthor.getAll()).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<List<EntityAuthor>>> response = authorController.getAll();
        assertEquals(200, response.getStatusCode().value());
        assertEquals(res, response.getBody());
    }

    @Test
    public void testSaveSuccess() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("Gabriel");
        req.setSurName("Garcia");

        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.hasErrors()).thenReturn(false);

        ResponseDataGeneric<EntityAuthor> res = new ResponseDataGeneric<>(new EntityAuthor());
        res.success();
        when(businessAuthor.save(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<EntityAuthor>> response = authorController.save(req, bindingResult);
        assertEquals(200, response.getStatusCode().value());
    }

    @Test
    public void testSaveBindingResultError() {
        RequestAuthorSave req = new RequestAuthorSave();
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.hasErrors()).thenReturn(true);

        ResponseEntity<ResponseDataGeneric<EntityAuthor>> response = authorController.save(req, bindingResult);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    public void testSaveBusinessError() {
        RequestAuthorSave req = new RequestAuthorSave();
        BindingResult bindingResult = mock(BindingResult.class);
        when(bindingResult.hasErrors()).thenReturn(false);

        ResponseDataGeneric<EntityAuthor> res = new ResponseDataGeneric<>();
        res.error();
        when(businessAuthor.save(any())).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<EntityAuthor>> response = authorController.save(req, bindingResult);
        assertEquals(400, response.getStatusCode().value());
    }

    @Test
    public void testDelete() {
        ResponseDataGeneric<Boolean> res = new ResponseDataGeneric<>(true);
        when(businessAuthor.delete(1)).thenReturn(res);

        ResponseEntity<ResponseDataGeneric<Boolean>> response = authorController.delete(1);
        assertEquals(200, response.getStatusCode().value());
    }
}
