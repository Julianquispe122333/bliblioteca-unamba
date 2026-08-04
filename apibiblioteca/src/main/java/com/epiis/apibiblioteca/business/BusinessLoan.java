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
            response.listMessage.add("No existe ninguna reserva con ese código");
            return response;
        }

        EntityReservation res = resList.get(0);
        Date now = new Date();
        if ("Pendiente".equalsIgnoreCase(res.getStatus()) && res.getExpirationDate() != null && res.getExpirationDate().before(now)) {
            for (EntityReservation r : resList) {
                r.setStatus("Vencido");
                r.setUpdatedAt(now);
                repositoryReservation.save(r);
                
                if (r.getBook() != null) {
                    EntityBook b = r.getBook();
                    b.setAvailableCopies(b.getAvailableCopies() + 1);
                    repositoryBook.save(b);
                }
            }
            response.error();
            response.listMessage.add("Esta reserva ya expiró y no se puede atender");
            return response;
        }

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

        for (EntityReservation r : resList) {
            r.setStatus("Atendido");
            r.setUpdatedAt(new Date());
            repositoryReservation.save(r);
        }

        now = new Date();
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
        
        List<EntityReservation> resList = repositoryReservation.findAllByCode(request.getReservationCode().trim().toUpperCase());
        if (resList.isEmpty()) {
            response.error();
            response.listMessage.add("No se encontró ninguna reserva/préstamo con ese código");
            return response;
        }

        EntityReservation res = resList.get(0);
        Optional<EntityLoan> loanOpt = repositoryLoan.findByIdReservation(res.getIdReservation());
        if (!loanOpt.isPresent()) {
            response.error();
            response.listMessage.add("No se encontró un préstamo activo asociado");
            return response;
        }

        EntityLoan loan = loanOpt.get();
        boolean anyUpdated = false;

        for (EntityReservation r : resList) {
            if (r.getBook() != null && request.getBooksReturningNow().contains(r.getBook().getTitle())) {
                if (!"Devuelto".equalsIgnoreCase(r.getStatus())) {
                    r.setStatus("Devuelto");
                    r.setUpdatedAt(new Date());
                    repositoryReservation.save(r);
                    
                    EntityBook b = r.getBook();
                    b.setAvailableCopies(b.getAvailableCopies() + 1);
                    repositoryBook.save(b);
                    
                    anyUpdated = true;
                }
            }
        }

        // Verificar si todas las reservas de este código ya han sido devueltas
        boolean allReturned = true;
        for (EntityReservation r : resList) {
            if (!"Devuelto".equalsIgnoreCase(r.getStatus())) {
                allReturned = false;
                break;
            }
        }

        if (allReturned) {
            loan.setStatus("Devuelto");
            loan.setReturnDate(new Date());
            loan.setUpdatedAt(new Date());
        }

        EntityLoan updatedLoan = repositoryLoan.save(loan);

        if (anyUpdated) {
            response.setData(convertToResponse(updatedLoan));
            response.success();
            response.listMessage.add("Devolución registrada correctamente");
        } else {
            response.error();
            response.listMessage.add("No se encontraron libros pendientes de devolución en la selección");
        }

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
                    rlb.setReturned("Devuelto".equalsIgnoreCase(l.getStatus()));
                    booksList.add(rlb);
                }
            }
            
            dto.setBookTitle(titlesBuilder.toString());
            dto.setLoanBooks(booksList);
            
            if (l.getReservation().getUser() != null) {
                dto.setStudentName(l.getReservation().getUser().getFirstName() + " " + l.getReservation().getUser().getSurName());
            }
        }

        dto.setLoanDate(l.getLoanDate() != null ? l.getLoanDate().toString() : "");
        dto.setDueDate(l.getDueDate() != null ? l.getDueDate().toString() : "");
        dto.setReturnDate(l.getReturnDate() != null ? l.getReturnDate().toString() : null);
        dto.setStatus(l.getStatus());

        return dto;
    }
}
