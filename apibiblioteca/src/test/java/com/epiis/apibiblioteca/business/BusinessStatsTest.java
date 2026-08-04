package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.entity.EntityLoan;
import com.epiis.apibiblioteca.entity.EntityReservation;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryLoan;
import com.epiis.apibiblioteca.repository.RepositoryReservation;

public class BusinessStatsTest {

    @Mock
    private RepositoryBook repositoryBook;
    @Mock
    private RepositoryReservation repositoryReservation;
    @Mock
    private RepositoryLoan repositoryLoan;

    @InjectMocks
    private BusinessStats businessStats;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAdminStats() {
        when(repositoryBook.count()).thenReturn(15L);

        EntityReservation r1 = new EntityReservation();
        r1.setStatus("Pendiente");
        EntityReservation r2 = new EntityReservation();
        r2.setStatus("Atendido");
        when(repositoryReservation.findAll()).thenReturn(Arrays.asList(r1, r2));

        EntityLoan l1 = new EntityLoan();
        l1.setStatus("Prestado");
        EntityLoan l2 = new EntityLoan();
        l2.setStatus("Vencido");

        EntityLoan l3 = new EntityLoan();
        l3.setStatus("Prestado");
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.DAY_OF_MONTH, -2);
        l3.setDueDate(cal.getTime()); // Overdue

        when(repositoryLoan.findAll()).thenReturn(Arrays.asList(l1, l2, l3));

        ResponseDataGeneric<Map<String, Object>> res = businessStats.getAdminStats();

        assertEquals("success", res.getType());
        Map<String, Object> stats = res.getData();
        assertEquals(15L, stats.get("totalBooks"));
        assertEquals(1L, stats.get("pendingReservationsCount"));
        assertEquals(2L, stats.get("activeLoansCount"));
        assertEquals(2L, stats.get("overdueLoansCount"));
    }
}
