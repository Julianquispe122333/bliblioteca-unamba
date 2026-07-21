package com.epiis.apibiblioteca.business;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.entity.EntityLoan;
import com.epiis.apibiblioteca.entity.EntityReservation;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryLoan;
import com.epiis.apibiblioteca.repository.RepositoryReservation;

@Service
public class BusinessStats {
    private final RepositoryBook repositoryBook;
    private final RepositoryReservation repositoryReservation;
    private final RepositoryLoan repositoryLoan;

    public BusinessStats(
        RepositoryBook repositoryBook,
        RepositoryReservation repositoryReservation,
        RepositoryLoan repositoryLoan
    ) {
        this.repositoryBook = repositoryBook;
        this.repositoryReservation = repositoryReservation;
        this.repositoryLoan = repositoryLoan;
    }

    public ResponseDataGeneric<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalBooks = repositoryBook.count();
        
        List<EntityReservation> reservations = repositoryReservation.findAll();
        long pendingReservationsCount = reservations.stream().filter(r -> "Pendiente".equalsIgnoreCase(r.getStatus())).count();

        Date today = new Date();
        List<EntityLoan> loans = repositoryLoan.findAll();
        long activeLoansCount = loans.stream().filter(l -> "Prestado".equalsIgnoreCase(l.getStatus())).count();
        long overdueLoansCount = loans.stream().filter(l -> "Vencido".equalsIgnoreCase(l.getStatus()) || ("Prestado".equalsIgnoreCase(l.getStatus()) && l.getDueDate() != null && l.getDueDate().before(today))).count();

        stats.put("totalBooks", totalBooks);
        stats.put("pendingReservationsCount", pendingReservationsCount);
        stats.put("activeLoansCount", activeLoansCount);
        stats.put("overdueLoansCount", overdueLoansCount);

        return new ResponseDataGeneric<>(stats);
    }
}
