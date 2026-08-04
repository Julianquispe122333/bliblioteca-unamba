package com.epiis.apibiblioteca.business;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestLoanCreate;
import com.epiis.apibiblioteca.dto.request.RequestLoanReturn;
import com.epiis.apibiblioteca.dto.response.ResponseLoan;
import com.epiis.apibiblioteca.dto.response.ResponseLoanBook;
import com.epiis.apibiblioteca.entity.EntityBook;
import com.epiis.apibiblioteca.entity.EntityLoan;
import com.epiis.apibiblioteca.entity.EntityReservation;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryLoan;
import com.epiis.apibiblioteca.repository.RepositoryReservation;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BusinessLoan {
    private static final String STATUS_DEVUELTO = "Devuelto";
    private static final String STATUS_PRESTADO = "Prestado";
    private static final String STATUS_VENCIDO = "Vencido";
    private static final String STATUS_ATENDIDO = "Atendido";
    private static final String MSG_RESERVATION_EXPIRED = "Esta reserva ya expiró y no se puede atender";

    private final RepositoryLoan repositoryLoan;
    private final RepositoryReservation repositoryReservation;
    private final RepositoryBook repositoryBook;

    public BusinessLoan(
        RepositoryLoan repositoryLoan,
        RepositoryReservation repositoryReservation,
        RepositoryBook repositoryBook
    ) {
        this.repositoryLoan = repositoryLoan;
        this.repositoryReservation = repositoryReservation;
        this.repositoryBook = repositoryBook;
    }

    public ResponseDataGeneric<List<ResponseLoan>> getAll() {
        checkExpirations();
        List<EntityLoan> list = repositoryLoan.findAll();
        List<ResponseLoan> resList = new ArrayList<>();
        for (EntityLoan l : list) {
            resList.add(convertToResponse(l));
        }
        return new ResponseDataGeneric<>(resList);
    }

    public ResponseDataGeneric<ResponseLoan> createFromReservation(RequestLoanCreate request) {
        ResponseDataGeneric<ResponseLoan> response = new ResponseDataGeneric<>();
        
        List<EntityReservation> resList = repositoryReservation.findAllByCode(request.getReservationCode().trim().toUpperCase());
        if (resList.isEmpty()) {
            response.error();
            response.getListMessage().add("No existe ninguna reserva con ese código");
            return response;
        }

        EntityReservation res = resList.get(0);
        Date now = new Date();
        if ("Pendiente".equalsIgnoreCase(res.getStatus()) && res.getExpirationDate() != null && res.getExpirationDate().before(now)) {
            expireReservations(resList, now);
            response.error();
            response.getListMessage().add(MSG_RESERVATION_EXPIRED);
            return response;
        }

        if (STATUS_ATENDIDO.equalsIgnoreCase(res.getStatus())) {
            response.error();
            response.getListMessage().add("Esta reserva ya fue atendida");
            return response;
        }
        if (STATUS_VENCIDO.equalsIgnoreCase(res.getStatus())) {
            response.error();
            response.getListMessage().add(MSG_RESERVATION_EXPIRED);
            return response;
        }

        for (EntityReservation r : resList) {
            r.setStatus(STATUS_ATENDIDO);
            r.setUpdatedAt(new Date());
            repositoryReservation.save(r);
        }

        now = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.DAY_OF_MONTH, 7);

        EntityLoan loan = new EntityLoan();
        loan.setIdReservation(res.getIdReservation());
        loan.setIdUser(1);
        loan.setLoanDate(now);
        loan.setDueDate(cal.getTime());
        loan.setStatus(STATUS_PRESTADO);
        loan.setCreatedAt(now);
        loan.setUpdatedAt(now);

        EntityLoan savedLoan = repositoryLoan.save(loan);
        savedLoan = repositoryLoan.findById(savedLoan.getIdLoan()).orElse(savedLoan);

        response.setData(convertToResponse(savedLoan));
        response.success();
        response.getListMessage().add("Préstamo registrado exitosamente");

        return response;
    }

    private void expireReservations(List<EntityReservation> resList, Date now) {
        for (EntityReservation r : resList) {
            r.setStatus(STATUS_VENCIDO);
            r.setUpdatedAt(now);
            repositoryReservation.save(r);
            
            if (r.getBook() != null) {
                EntityBook b = r.getBook();
                b.setAvailableCopies(b.getAvailableCopies() + 1);
                repositoryBook.save(b);
            }
        }
    }

    public ResponseDataGeneric<ResponseLoan> returnBooks(RequestLoanReturn request) {
        ResponseDataGeneric<ResponseLoan> response = new ResponseDataGeneric<>();
        
        List<EntityReservation> resList = repositoryReservation.findAllByCode(request.getReservationCode().trim().toUpperCase());
        if (resList.isEmpty()) {
            response.error();
            response.getListMessage().add("No se encontró ninguna reserva/préstamo con ese código");
            return response;
        }

        EntityReservation res = resList.get(0);
        Optional<EntityLoan> loanOpt = repositoryLoan.findByIdReservation(res.getIdReservation());
        if (loanOpt.isEmpty()) {
            response.error();
            response.getListMessage().add("No se encontró un préstamo activo asociado");
            return response;
        }

        EntityLoan loan = loanOpt.get();
        boolean anyUpdated = processReturns(resList, request.getBooksReturningNow());

        boolean allReturned = resList.stream().allMatch(r -> STATUS_DEVUELTO.equalsIgnoreCase(r.getStatus()));
        if (allReturned) {
            loan.setStatus(STATUS_DEVUELTO);
            loan.setReturnDate(new Date());
            loan.setUpdatedAt(new Date());
        }

        EntityLoan updatedLoan = repositoryLoan.save(loan);

        if (anyUpdated) {
            response.setData(convertToResponse(updatedLoan));
            response.success();
            response.getListMessage().add("Devolución registrada correctamente");
        } else {
            response.error();
            response.getListMessage().add("No se encontraron libros pendientes de devolución en la selección");
        }

        return response;
    }

    private boolean processReturns(List<EntityReservation> resList, List<String> returningTitles) {
        boolean anyUpdated = false;
        for (EntityReservation r : resList) {
            if (r.getBook() != null && returningTitles.contains(r.getBook().getTitle()) && !STATUS_DEVUELTO.equalsIgnoreCase(r.getStatus())) {
                r.setStatus(STATUS_DEVUELTO);
                r.setUpdatedAt(new Date());
                repositoryReservation.save(r);
                
                EntityBook b = r.getBook();
                if (b != null && b.getAvailableCopies() < b.getTotalCopies()) {
                    b.setAvailableCopies(b.getAvailableCopies() + 1);
                    repositoryBook.save(b);
                }
                anyUpdated = true;
            }
        }
        return anyUpdated;
    }

    private void checkExpirations() {
        Date today = new Date();
        List<EntityLoan> list = repositoryLoan.findAll();
        for (EntityLoan l : list) {
            if (STATUS_PRESTADO.equalsIgnoreCase(l.getStatus()) && l.getDueDate() != null && l.getDueDate().before(today)) {
                l.setStatus(STATUS_VENCIDO);
                l.setUpdatedAt(today);
                repositoryLoan.save(l);
            }
        }
    }

    private ResponseLoan convertToResponse(EntityLoan l) {
        ResponseLoan dto = new ResponseLoan();
        dto.setIdLoan(l.getIdLoan());
        
        if (l.getReservation() != null) {
            populateReservationData(l, dto);
        }

        dto.setLoanDate(l.getLoanDate() != null ? l.getLoanDate().toString() : "");
        dto.setDueDate(l.getDueDate() != null ? l.getDueDate().toString() : "");
        dto.setReturnDate(l.getReturnDate() != null ? l.getReturnDate().toString() : null);
        dto.setStatus(l.getStatus());

        return dto;
    }

    private void populateReservationData(EntityLoan l, ResponseLoan dto) {
        String reservationCode = l.getReservation().getCode();
        dto.setReservationCode(reservationCode);
        
        List<EntityReservation> allRes = repositoryReservation.findAllByCode(reservationCode);
        List<ResponseLoanBook> booksList = new ArrayList<>();
        StringBuilder titlesBuilder = new StringBuilder();
        
        for (EntityReservation r : allRes) {
            if (r.getBook() != null) {
                if (titlesBuilder.length() > 0) {
                    titlesBuilder.append(", ");
                }
                titlesBuilder.append(r.getBook().getTitle());
                
                ResponseLoanBook rlb = new ResponseLoanBook();
                rlb.setTitle(r.getBook().getTitle());
                rlb.setReturned(STATUS_DEVUELTO.equalsIgnoreCase(r.getStatus()) || STATUS_DEVUELTO.equalsIgnoreCase(l.getStatus()));
                booksList.add(rlb);
            }
        }
        
        dto.setBookTitle(titlesBuilder.toString());
        dto.setLoanBooks(booksList);
        
        if (l.getReservation().getUser() != null) {
            dto.setStudentName(l.getReservation().getUser().getFirstName() + " " + l.getReservation().getUser().getSurName());
        }
    }
}
