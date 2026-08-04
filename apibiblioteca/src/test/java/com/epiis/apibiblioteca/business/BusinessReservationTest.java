package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.dto.request.RequestReservationCreate;
import com.epiis.apibiblioteca.dto.response.ResponseReservation;
import com.epiis.apibiblioteca.entity.EntityBook;
import com.epiis.apibiblioteca.entity.EntityUser;
import com.epiis.apibiblioteca.entity.EntityReservation;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryReservation;
import com.epiis.apibiblioteca.repository.RepositoryUser;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

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
    public void testCreateReservationEmptyBooks() {
        RequestReservationCreate req = new RequestReservationCreate();
        req.setBookTitles(new ArrayList<>());
        req.setStudentName("Juan Pérez");

        ResponseDataGeneric<ResponseReservation> res = businessReservation.create(req);

        assertEquals("error", res.getType());
        assertTrue(res.listMessage.contains("Debe seleccionar al menos un libro"));
    }

    @Test
    public void testCreateReservationEmptyStudent() {
        RequestReservationCreate req = new RequestReservationCreate();
        req.setBookTitles(Arrays.asList("Python Book"));
        req.setStudentName("");

        ResponseDataGeneric<ResponseReservation> res = businessReservation.create(req);

        assertEquals("error", res.getType());
        assertTrue(res.listMessage.contains("El nombre del estudiante es obligatorio"));
    }

    @Test
    public void testCreateReservationSuccessNewUser() {
        RequestReservationCreate req = new RequestReservationCreate();
        req.setBookTitles(Arrays.asList("Introducción a la Programación con Python"));
        req.setStudentName("Juan Pérez");
        req.setEmail("juan@unamba.edu.pe");
        req.setUniversityCode("2024001");

        EntityUser user = new EntityUser();
        user.setIdUser(10);
        user.setFirstName("Juan");
        user.setSurName("Pérez");
        user.setEmail("juan@unamba.edu.pe");
        user.setUniversityCode("2024001");

        EntityBook book = new EntityBook();
        book.setIdBook(1);
        book.setTitle("Introducción a la Programación con Python");
        book.setAvailableCopies(5);

        EntityReservation savedRes = new EntityReservation();
        savedRes.setIdReservation(100);
        savedRes.setUser(user);
        savedRes.setBook(book);

        when(repositoryUser.findByEmail("juan@unamba.edu.pe")).thenReturn(Optional.empty());
        when(repositoryUser.findByUniversityCode("2024001")).thenReturn(Optional.empty());
        when(repositoryUser.save(any(EntityUser.class))).thenReturn(user);
        when(repositoryBook.findByTitleIgnoreCase("Introducción a la Programación con Python")).thenReturn(Optional.of(book));
        when(repositoryReservation.save(any(EntityReservation.class))).thenReturn(savedRes);

        ResponseDataGeneric<ResponseReservation> res = businessReservation.create(req);

        assertEquals("success", res.getType());
        assertNotNull(res.getData());
        assertEquals("Juan Pérez", res.getData().getStudentName());
    }
}
