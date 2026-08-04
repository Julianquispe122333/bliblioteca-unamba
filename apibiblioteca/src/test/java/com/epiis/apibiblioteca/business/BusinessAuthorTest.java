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

import com.epiis.apibiblioteca.dto.request.RequestAuthorSave;
import com.epiis.apibiblioteca.entity.EntityAuthor;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryAuthor;

public class BusinessAuthorTest {

    @Mock
    private RepositoryAuthor repositoryAuthor;

    @InjectMocks
    private BusinessAuthor businessAuthor;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        EntityAuthor a1 = new EntityAuthor();
        a1.setIdAuthor(1);
        a1.setFirstName("Gabriel");
        a1.setSurName("García");

        when(repositoryAuthor.findAll()).thenReturn(Arrays.asList(a1));

        ResponseDataGeneric<List<EntityAuthor>> result = businessAuthor.getAll();
        assertEquals("success", result.getType());
        assertEquals(1, result.getData().size());
    }

    @Test
    public void testSaveNewAuthorSuccess() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("Gabriel");
        req.setSurName("García");

        when(repositoryAuthor.findByFirstNameAndSurName("Gabriel", "García")).thenReturn(Optional.empty());
        EntityAuthor saved = new EntityAuthor();
        saved.setIdAuthor(1);
        saved.setFirstName("Gabriel");
        saved.setSurName("García");
        when(repositoryAuthor.save(any())).thenReturn(saved);

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("success", result.getType());
        assertNotNull(result.getData());
    }

    @Test
    public void testSaveAuthorEmptyFirstName() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("  ");
        req.setSurName("García");

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("El nombre es obligatorio"));
    }

    @Test
    public void testSaveAuthorEmptySurName() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("Gabriel");
        req.setSurName("  ");

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("El apellido es obligatorio"));
    }

    @Test
    public void testSaveAuthorFirstNameTooLong() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("A".repeat(51));
        req.setSurName("García");

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("El nombre no puede tener más de 50 caracteres"));
    }

    @Test
    public void testSaveAuthorSurNameTooLong() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("Gabriel");
        req.setSurName("G".repeat(41));

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("El apellido no puede tener más de 40 caracteres"));
    }

    @Test
    public void testSaveAuthorDuplicate() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setFirstName("Gabriel");
        req.setSurName("García");

        EntityAuthor existing = new EntityAuthor();
        existing.setIdAuthor(5);
        when(repositoryAuthor.findByFirstNameAndSurName("Gabriel", "García")).thenReturn(Optional.of(existing));

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("El autor con este nombre y apellido ya está registrado"));
    }

    @Test
    public void testSaveAuthorUpdateSuccess() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setIdAuthor(1);
        req.setFirstName("Gabriel");
        req.setSurName("García");

        EntityAuthor existing = new EntityAuthor();
        existing.setIdAuthor(1);
        existing.setFirstName("Gabriel");
        existing.setSurName("García");

        when(repositoryAuthor.findByFirstNameAndSurName("Gabriel", "García")).thenReturn(Optional.of(existing));
        when(repositoryAuthor.findById(1)).thenReturn(Optional.of(existing));
        when(repositoryAuthor.save(any())).thenReturn(existing);

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("success", result.getType());
    }

    @Test
    public void testSaveAuthorUpdateNotFound() {
        RequestAuthorSave req = new RequestAuthorSave();
        req.setIdAuthor(99);
        req.setFirstName("Gabriel");
        req.setSurName("García");

        when(repositoryAuthor.findByFirstNameAndSurName("Gabriel", "García")).thenReturn(Optional.empty());
        when(repositoryAuthor.findById(99)).thenReturn(Optional.empty());

        ResponseDataGeneric<EntityAuthor> result = businessAuthor.save(req);
        assertEquals("error", result.getType());
        assertTrue(result.getListMessage().contains("El autor no existe"));
    }

    @Test
    public void testDeleteAuthorSuccess() {
        when(repositoryAuthor.existsById(1)).thenReturn(true);
        doNothing().when(repositoryAuthor).deleteById(1);

        ResponseDataGeneric<Boolean> result = businessAuthor.delete(1);
        assertEquals("success", result.getType());
        assertTrue(result.getData());
    }

    @Test
    public void testDeleteAuthorNotFound() {
        when(repositoryAuthor.existsById(99)).thenReturn(false);

        ResponseDataGeneric<Boolean> result = businessAuthor.delete(99);
        assertEquals("error", result.getType());
        assertFalse(result.getData());
    }
}
