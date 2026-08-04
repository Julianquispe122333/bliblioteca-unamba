package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.dto.request.RequestLoanCreate;
import com.epiis.apibiblioteca.dto.request.RequestLoanReturn;
import com.epiis.apibiblioteca.dto.response.ResponseLoan;
import com.epiis.apibiblioteca.entity.EntityBook;
import com.epiis.apibiblioteca.entity.EntityLoan;
import com.epiis.apibiblioteca.entity.EntityReservation;
import com.epiis.apibiblioteca.entity.EntityUser;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryLoan;
import com.epiis.apibiblioteca.repository.RepositoryReservation;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

public class BusinessLoanTest {

    @Mock
    private RepositoryLoan repositoryLoan;

    @Mock
    private RepositoryReservation repositoryReservation;

    @Mock
    private RepositoryBook repositoryBook;

    @InjectMocks
    private BusinessLoan businessLoan;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testCreateFromReservationNotFound() {
        RequestLoanCreate req = new RequestLoanCreate();
        req.setReservationCode("RES0000");

        when(repositoryReservation.findAllByCode("RES0000")).thenReturn(new ArrayList<>());

        ResponseDataGeneric<ResponseLoan> res = businessLoan.createFromReservation(req);

        assertEquals("error", res.getType());
        assertTrue(res.listMessage.contains("No existe ninguna reserva con ese código"));
    }

    @Test
    public void testCreateFromReservationAlreadyAttended() {
        RequestLoanCreate req = new RequestLoanCreate();
        req.setReservationCode("RES1111");

        EntityReservation r = new EntityReservation();
        r.setCode("RES1111");
        r.setStatus("Atendido");

        when(repositoryReservation.findAllByCode("RES1111")).thenReturn(Arrays.asList(r));

        ResponseDataGeneric<ResponseLoan> res = businessLoan.createFromReservation(req);

        assertEquals("error", res.getType());
        assertTrue(res.listMessage.contains("Esta reserva ya fue atendida"));
    }

    @Test
    public void testReturnBooksReservationNotFound() {
        RequestLoanReturn req = new RequestLoanReturn();
        req.setReservationCode("RES0000");
        req.setBooksReturningNow(Arrays.asList("Python"));

        when(repositoryReservation.findAllByCode("RES0000")).thenReturn(new ArrayList<>());

        ResponseDataGeneric<ResponseLoan> res = businessLoan.returnBooks(req);

        assertEquals("error", res.getType());
        assertTrue(res.listMessage.contains("No se encontró ninguna reserva/préstamo con ese código"));
    }
}
