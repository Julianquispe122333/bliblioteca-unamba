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

@Service
public class BusinessLoan {
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
        
        Optional<EntityReservation> resOpt = repositoryReservation.findByCode(request.getReservationCode().trim().toUpperCase());
        if (!resOpt.isPresent()) {
            response.error();
            response.listMessage.add("No existe ninguna reserva con ese código");
            return response;
        }

        EntityReservation res = resOpt.get();
        if ("Atendido".equalsIgnoreCase(res.getStatus())) {
            response.error();
            response.listMessage.add("Esta reserva ya fue atendida");
            return response;
        }
        if ("Vencido".equalsIgnoreCase(res.getStatus())) {
            response.error();
            response.listMessage.add("Esta reserva ya expiró y no se puede atender");
            return response;
        }

        res.setStatus("Atendido");
        res.setUpdatedAt(new Date());
        repositoryReservation.save(res);

        Date now = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.DAY_OF_MONTH, 7); // Plazo de 7 días

        EntityLoan loan = new EntityLoan();
        loan.setIdReservation(res.getIdReservation());
        loan.setIdUser(1); // Bibliotecario Principal
        loan.setLoanDate(now);
        loan.setDueDate(cal.getTime());
        loan.setStatus("Prestado");
        loan.setCreatedAt(now);
        loan.setUpdatedAt(now);

        EntityLoan savedLoan = repositoryLoan.save(loan);
        savedLoan = repositoryLoan.findById(savedLoan.getIdLoan()).orElse(savedLoan);

        response.setData(convertToResponse(savedLoan));
        response.success();
        response.listMessage.add("Préstamo registrado exitosamente");

        return response;
    }

    public ResponseDataGeneric<ResponseLoan> returnBooks(RequestLoanReturn request) {
        ResponseDataGeneric<ResponseLoan> response = new ResponseDataGeneric<>();
        
        Optional<EntityReservation> resOpt = repositoryReservation.findByCode(request.getReservationCode().trim().toUpperCase());
        if (!resOpt.isPresent()) {
            response.error();
            response.listMessage.add("No se encontró ninguna reserva/préstamo con ese código");
            return response;
        }

        EntityReservation res = resOpt.get();
        Optional<EntityLoan> loanOpt = repositoryLoan.findByIdReservation(res.getIdReservation());

        if (!loanOpt.isPresent()) {
            response.error();
            response.listMessage.add("No se encontró un préstamo activo asociado");
            return response;
        }

        EntityLoan loan = loanOpt.get();
        loan.setStatus("Devuelto");
        loan.setReturnDate(new Date());
        loan.setUpdatedAt(new Date());

        if (res.getBook() != null) {
            EntityBook b = res.getBook();
            b.setAvailableCopies(b.getAvailableCopies() + 1);
            repositoryBook.save(b);
        }

        EntityLoan updatedLoan = repositoryLoan.save(loan);
        response.setData(convertToResponse(updatedLoan));
        response.success();
        response.listMessage.add("Devolución registrada correctamente");

        return response;
    }

    private void checkExpirations() {
        Date today = new Date();
        List<EntityLoan> list = repositoryLoan.findAll();
        for (EntityLoan l : list) {
            if ("Prestado".equalsIgnoreCase(l.getStatus()) && l.getDueDate() != null && l.getDueDate().before(today)) {
                l.setStatus("Vencido");
                l.setUpdatedAt(today);
                repositoryLoan.save(l);
            }
        }
    }

    private ResponseLoan convertToResponse(EntityLoan l) {
        ResponseLoan dto = new ResponseLoan();
        dto.setIdLoan(l.getIdLoan());
        
        if (l.getReservation() != null) {
            dto.setReservationCode(l.getReservation().getCode());
            if (l.getReservation().getBook() != null) {
                dto.setBookTitle(l.getReservation().getBook().getTitle());
            }
            if (l.getReservation().getUser() != null) {
                dto.setStudentName(l.getReservation().getUser().getFirstName() + " " + l.getReservation().getUser().getSurName());
            }
        }

        dto.setLoanDate(l.getLoanDate() != null ? l.getLoanDate().toString() : "");
        dto.setDueDate(l.getDueDate() != null ? l.getDueDate().toString() : "");
        dto.setReturnDate(l.getReturnDate() != null ? l.getReturnDate().toString() : null);
        dto.setStatus(l.getStatus());

        List<ResponseLoanBook> booksList = new ArrayList<>();
        ResponseLoanBook rlb = new ResponseLoanBook();
        rlb.setTitle(dto.getBookTitle() != null ? dto.getBookTitle() : "Libro en Préstamo");
        rlb.setReturned("Devuelto".equalsIgnoreCase(l.getStatus()));
        booksList.add(rlb);

        dto.setLoanBooks(booksList);
        return dto;
    }
}
