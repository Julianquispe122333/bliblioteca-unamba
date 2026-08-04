package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.dto.request.RequestCategorySave;
import com.epiis.apibiblioteca.entity.EntityCategory;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryCategory;

public class BusinessCategoryTest {

    @Mock
    private RepositoryCategory repositoryCategory;

    @InjectMocks
    private BusinessCategory businessCategory;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        EntityCategory c1 = new EntityCategory();
        c1.setIdCategory(1);
        c1.setName("Ciencias");

        when(repositoryCategory.findAll()).thenReturn(Arrays.asList(c1));

        ResponseDataGeneric<List<EntityCategory>> result = businessCategory.getAll();
        assertEquals("success", result.getType());
        assertEquals(1, result.getData().size());
    }

    @Test
    public void testSaveNewCategorySuccess() {
        RequestCategorySave req = new RequestCategorySave();
        req.setName("Matemáticas");

        EntityCategory saved = new EntityCategory();
        saved.setIdCategory(1);
        saved.setName("Matemáticas");
        when(repositoryCategory.save(any())).thenReturn(saved);

        ResponseDataGeneric<EntityCategory> result = businessCategory.save(req);
        assertEquals("success", result.getType());
        assertEquals("Matemáticas", result.getData().getName());
    }

    @Test
    public void testSaveUpdateCategorySuccess() {
        RequestCategorySave req = new RequestCategorySave();
        req.setIdCategory(1);
        req.setName("Física");

        EntityCategory existing = new EntityCategory();
        existing.setIdCategory(1);
        existing.setName("Ciencias");

        when(repositoryCategory.findById(1)).thenReturn(Optional.of(existing));
        when(repositoryCategory.save(any())).thenReturn(existing);

        ResponseDataGeneric<EntityCategory> result = businessCategory.save(req);
        assertEquals("success", result.getType());
    }

    @Test
    public void testSaveUpdateCategoryNotFound() {
        RequestCategorySave req = new RequestCategorySave();
        req.setIdCategory(99);
        req.setName("Física");

        when(repositoryCategory.findById(99)).thenReturn(Optional.empty());

        ResponseDataGeneric<EntityCategory> result = businessCategory.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("La categoría no existe"));
    }

    @Test
    public void testDeleteCategorySuccess() {
        when(repositoryCategory.existsById(1)).thenReturn(true);
        doNothing().when(repositoryCategory).deleteById(1);

        ResponseDataGeneric<Boolean> result = businessCategory.delete(1);
        assertEquals("success", result.getType());
        assertTrue(result.getData());
    }

    @Test
    public void testDeleteCategoryNotFound() {
        when(repositoryCategory.existsById(99)).thenReturn(false);

        ResponseDataGeneric<Boolean> result = businessCategory.delete(99);
        assertEquals("error", result.getType());
        assertFalse(result.getData());
    }
}
