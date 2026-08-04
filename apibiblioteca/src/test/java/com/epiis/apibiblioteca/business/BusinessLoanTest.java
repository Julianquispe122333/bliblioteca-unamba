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

import com.epiis.apibiblioteca.dto.request.RequestLoanCreate;
import com.epiis.apibiblioteca.dto.request.RequestLoanReturn;
import com.epiis.apibiblioteca.dto.response.ResponseLoan;
import com.epiis.apibiblioteca.entity.*;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.*;

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
    public void testGetAll() {
        EntityLoan loan = new EntityLoan();
        loan.setIdLoan(1);
        loan.setStatus("Prestado");

        EntityReservation res = new EntityReservation();
        res.setCode("RES111");
        EntityUser user = new EntityUser();
        user.setFirstName("Juan");
        user.setSurName("Perez");
        res.setUser(user);

        EntityBook book = new EntityBook();
        book.setTitle("Libro 1");
        res.setBook(book);

        loan.setReservation(res);

        when(repositoryLoan.findAll()).thenReturn(Arrays.asList(loan));
        when(repositoryReservation.findAllByCode("RES111")).thenReturn(Arrays.asList(res));

        ResponseDataGeneric<List<ResponseLoan>> response = businessLoan.getAll();

        assertEquals("success", response.getType());
        assertEquals(1, response.getData().size());
        assertEquals("RES111", response.getData().get(0).getReservationCode());
        assertEquals("Juan Perez", response.getData().get(0).getStudentName());
    }

    @Test
    public void testCreateFromReservationSuccess() {
        RequestLoanCreate req = new RequestLoanCreate();
        req.setReservationCode("RES1111");

        EntityReservation r = new EntityReservation();
        r.setIdReservation(10);
        r.setCode("RES1111");
        r.setStatus("Pendiente");

        when(repositoryReservation.findAllByCode("RES1111")).thenReturn(Arrays.asList(r));

        EntityLoan savedLoan = new EntityLoan();
        savedLoan.setIdLoan(100);
        savedLoan.setIdReservation(10);
        savedLoan.setStatus("Prestado");
        savedLoan.setReservation(r);

        when(repositoryLoan.save(any())).thenReturn(savedLoan);
        when(repositoryLoan.findById(100)).thenReturn(Optional.of(savedLoan));

        ResponseDataGeneric<ResponseLoan> res = businessLoan.createFromReservation(req);

        assertEquals("success", res.getType());
        assertEquals("Préstamo registrado exitosamente", res.getListMessage().get(0));
    }

    @Test
    public void testCreateFromReservationExpired() {
        RequestLoanCreate req = new RequestLoanCreate();
        req.setReservationCode("RES_EXP");

        EntityReservation r = new EntityReservation();
        r.setCode("RES_EXP");
        r.setStatus("Pendiente");

        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, -5);
        r.setExpirationDate(cal.getTime());

        EntityBook b = new EntityBook();
        b.setAvailableCopies(2);
        r.setBook(b);

        when(repositoryReservation.findAllByCode("RES_EXP")).thenReturn(Arrays.asList(r));

        ResponseDataGeneric<ResponseLoan> res = businessLoan.createFromReservation(req);

        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("Esta reserva ya expiró y no se puede atender"));
    }

    @Test
    public void testCreateFromReservationNotFound() {
        RequestLoanCreate req = new RequestLoanCreate();
        req.setReservationCode("RES0000");

        when(repositoryReservation.findAllByCode("RES0000")).thenReturn(new ArrayList<>());

        ResponseDataGeneric<ResponseLoan> res = businessLoan.createFromReservation(req);

        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("No existe ninguna reserva con ese código"));
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
        assertTrue(res.getListMessage().contains("Esta reserva ya fue atendida"));
    }

    @Test
    public void testReturnBooksSuccess() {
        RequestLoanReturn req = new RequestLoanReturn();
        req.setReservationCode("RES222");
        req.setBooksReturningNow(Arrays.asList("Libro Test"));

        EntityReservation res = new EntityReservation();
        res.setIdReservation(5);
        res.setCode("RES222");
        res.setStatus("Atendido");
        EntityBook book = new EntityBook();
        book.setTitle("Libro Test");
        book.setAvailableCopies(1);
        book.setTotalCopies(5);
        res.setBook(book);

        EntityLoan loan = new EntityLoan();
        loan.setIdLoan(50);
        loan.setIdReservation(5);
        loan.setStatus("Prestado");
        loan.setReservation(res);

        when(repositoryReservation.findAllByCode("RES222")).thenReturn(Arrays.asList(res));
        when(repositoryLoan.findByIdReservation(5)).thenReturn(Optional.of(loan));
        when(repositoryLoan.save(any())).thenReturn(loan);

        ResponseDataGeneric<ResponseLoan> response = businessLoan.returnBooks(req);

        assertEquals("success", response.getType());
        assertEquals("Devuelto", res.getStatus());
        assertEquals(2, book.getAvailableCopies());
    }

    @Test
    public void testReturnBooksReservationNotFound() {
        RequestLoanReturn req = new RequestLoanReturn();
        req.setReservationCode("RES0000");
        req.setBooksReturningNow(Arrays.asList("Python"));

        when(repositoryReservation.findAllByCode("RES0000")).thenReturn(new ArrayList<>());

        ResponseDataGeneric<ResponseLoan> res = businessLoan.returnBooks(req);

        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("No se encontró ninguna reserva/préstamo con ese código"));
    }
}
