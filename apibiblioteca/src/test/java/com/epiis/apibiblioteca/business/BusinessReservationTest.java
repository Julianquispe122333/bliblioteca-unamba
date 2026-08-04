package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.dto.request.RequestReservationCreate;
import com.epiis.apibiblioteca.dto.response.ResponseReservation;
import com.epiis.apibiblioteca.entity.*;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.*;

public class BusinessReservationTest {

    @Mock
    private RepositoryReservation repositoryReservation;
    @Mock
    private RepositoryBook repositoryBook;
    @Mock
    private RepositoryUser repositoryUser;

    @InjectMocks
    private BusinessReservation businessReservation;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        EntityReservation res = new EntityReservation();
        res.setIdReservation(1);
        res.setCode("RES999");
        res.setStatus("Pendiente");

        EntityUser user = new EntityUser();
        user.setFirstName("Maria");
        user.setSurName("Lopez");
        user.setUniversityCode("U111");
        user.setEmail("m@m.com");
        res.setUser(user);

        EntityBook book = new EntityBook();
        book.setTitle("Algebra");
        res.setBook(book);

        when(repositoryReservation.findAll()).thenReturn(Arrays.asList(res));

        ResponseDataGeneric<List<ResponseReservation>> response = businessReservation.getAll();

        assertEquals("success", response.getType());
        assertEquals(1, response.getData().size());
        assertEquals("Algebra", response.getData().get(0).getBookTitle());
    }

    @Test
    public void testGetByStudentFoundAndNotFound() {
        EntityUser user = new EntityUser();
        user.setIdUser(5);
        user.setFirstName("Juan");
        user.setSurName("Perez");
        user.setEmail("juan.perez@unamba.edu.pe");

        when(repositoryUser.findAll()).thenReturn(Arrays.asList(user));
        when(repositoryReservation.findByIdUserOrderByCreatedAtDesc(5)).thenReturn(new ArrayList<>());

        ResponseDataGeneric<List<ResponseReservation>> res1 = businessReservation.getByStudent("Juan Perez");
        assertEquals("success", res1.getType());

        ResponseDataGeneric<List<ResponseReservation>> res2 = businessReservation.getByStudent("Inexistente");
        assertEquals("success", res2.getType());
        assertTrue(res2.getData().isEmpty());
    }

    @Test
    public void testGetByCodeFoundAndNotFound() {
        EntityReservation res = new EntityReservation();
        res.setCode("RES123");
        res.setStatus("Pendiente");

        when(repositoryReservation.findAllByCode("RES123")).thenReturn(Arrays.asList(res));
        when(repositoryReservation.findAllByCode("RES_NONE")).thenReturn(new ArrayList<>());

        ResponseDataGeneric<ResponseReservation> res1 = businessReservation.getByCode("RES123");
        assertEquals("success", res1.getType());
        assertEquals("RES123", res1.getData().getCode());

        ResponseDataGeneric<ResponseReservation> res2 = businessReservation.getByCode("RES_NONE");
        assertEquals("error", res2.getType());
    }

    @Test
    public void testCreateValidation() {
        RequestReservationCreate req1 = new RequestReservationCreate();
        ResponseDataGeneric<ResponseReservation> res1 = businessReservation.create(req1);
        assertEquals("error", res1.getType());
        assertTrue(res1.getListMessage().contains("Debe seleccionar al menos un libro"));

        req1.setBookTitles(Arrays.asList("Book 1"));
        ResponseDataGeneric<ResponseReservation> res2 = businessReservation.create(req1);
        assertEquals("error", res2.getType());
        assertTrue(res2.getListMessage().contains("El nombre del estudiante es obligatorio"));
    }

    @Test
    public void testCreateSuccessCreatingUser() {
        RequestReservationCreate req = new RequestReservationCreate();
        req.setStudentName("Carlos Gomez");
        req.setBookTitles(Arrays.asList("Calculo"));

        EntityUser newUser = new EntityUser();
        newUser.setIdUser(20);
        newUser.setFirstName("Carlos");
        newUser.setSurName("Gomez");
        when(repositoryUser.save(any())).thenReturn(newUser);

        EntityBook book = new EntityBook();
        book.setIdBook(1);
        book.setTitle("Calculo");
        book.setAvailableCopies(5);
        when(repositoryBook.findByTitle("Calculo")).thenReturn(Optional.of(book));

        EntityReservation savedRes = new EntityReservation();
        savedRes.setCode("RES7777");
        savedRes.setBook(book);
        savedRes.setUser(newUser);
        savedRes.setStatus("Pendiente");

        when(repositoryReservation.findAllByCode(anyString())).thenReturn(new ArrayList<>()).thenReturn(Arrays.asList(savedRes));
        when(repositoryReservation.save(any())).thenReturn(savedRes);

        ResponseDataGeneric<ResponseReservation> res = businessReservation.create(req);

        assertEquals("success", res.getType());
        verify(repositoryUser).save(any());
        verify(repositoryBook).save(any());
        assertEquals(4, book.getAvailableCopies());
    }
}
