package com.epiis.apibiblioteca.business;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestReservationCreate;
import com.epiis.apibiblioteca.dto.response.ResponseReservation;
import com.epiis.apibiblioteca.entity.EntityBook;
import com.epiis.apibiblioteca.entity.EntityReservation;
import com.epiis.apibiblioteca.entity.EntityUser;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryReservation;
import com.epiis.apibiblioteca.repository.RepositoryUser;

@Service
public class BusinessReservation {
    private final RepositoryReservation repositoryReservation;
    private final RepositoryBook repositoryBook;
    private final RepositoryUser repositoryUser;

    public BusinessReservation(
        RepositoryReservation repositoryReservation,
        RepositoryBook repositoryBook,
        RepositoryUser repositoryUser
    ) {
        this.repositoryReservation = repositoryReservation;
        this.repositoryBook = repositoryBook;
        this.repositoryUser = repositoryUser;
    }

    public ResponseDataGeneric<List<ResponseReservation>> getAll() {
        checkExpirations();
        List<EntityReservation> list = repositoryReservation.findAll();
        List<ResponseReservation> resList = new ArrayList<>();
        for (EntityReservation r : list) {
            resList.add(convertToResponse(r));
        }
        return new ResponseDataGeneric<>(resList);
    }

    public ResponseDataGeneric<List<ResponseReservation>> getByStudent(String studentName) {
        checkExpirations();
        
        Optional<EntityUser> userOpt = repositoryUser.findAll().stream()
            .filter(u -> (u.getFirstName() + " " + u.getSurName()).equalsIgnoreCase(studentName) || u.getEmail().contains(studentName.toLowerCase().replace(" ", ".")))
            .findFirst();

        List<EntityReservation> list;
        if (userOpt.isPresent()) {
            list = repositoryReservation.findByIdUserOrderByCreatedAtDesc(userOpt.get().getIdUser());
        } else {
            list = repositoryReservation.findAll();
        }

        List<ResponseReservation> resList = new ArrayList<>();
        for (EntityReservation r : list) {
            resList.add(convertToResponse(r));
        }
        return new ResponseDataGeneric<>(resList);
    }

    public ResponseDataGeneric<ResponseReservation> create(RequestReservationCreate request) {
        ResponseDataGeneric<ResponseReservation> response = new ResponseDataGeneric<>();
        
        if (request.getBookTitles() == null || request.getBookTitles().isEmpty()) {
            response.error();
            response.listMessage.add("Debe seleccionar al menos un libro");
            return response;
        }

        // Buscar o crear estudiante
        String email = request.getEmail() != null ? request.getEmail() : request.getStudentName().toLowerCase().replace(" ", ".") + "@unamba.edu.pe";
        Optional<EntityUser> userOpt = repositoryUser.findByEmail(email);
        EntityUser user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            user = new EntityUser();
            user.setUniversityCode(request.getUniversityCode() != null ? request.getUniversityCode() : "EST" + (100000 + new Random().nextInt(900000)));
            user.setFirstName("Estudiante");
            user.setSurName("UNAMBA");
            user.setEmail(email);
            user.setRole("Estudiante");
            user.setCreatedAt(new Date());
            user.setUpdatedAt(user.getCreatedAt());
            user = repositoryUser.save(user);
        }

        String randomCode = "RES" + (1000 + new Random().nextInt(9000));
        EntityReservation lastSavedRes = null;

        for (String title : request.getBookTitles()) {
            Optional<EntityBook> bookOpt = repositoryBook.findByTitle(title.trim());
            if (bookOpt.isPresent()) {
                EntityBook book = bookOpt.get();
                if (book.getAvailableCopies() > 0) {
                    book.setAvailableCopies(book.getAvailableCopies() - 1);
                    repositoryBook.save(book);
                }

                EntityReservation res = new EntityReservation();
                res.setIdUser(user.getIdUser());
                res.setIdBook(book.getIdBook());
                res.setCode(request.getBookTitles().size() > 1 ? "RES" + (1000 + new Random().nextInt(9000)) : randomCode);
                res.setStatus("Pendiente");

                Date now = new Date();
                Calendar cal = Calendar.getInstance();
                cal.setTime(now);
                cal.add(Calendar.DAY_OF_MONTH, 1); // Expiración en 1 día

                res.setExpirationDate(cal.getTime());
                res.setCreatedAt(now);
                res.setUpdatedAt(now);

                lastSavedRes = repositoryReservation.save(res);
            }
        }

        if (lastSavedRes != null) {
            lastSavedRes = repositoryReservation.findById(lastSavedRes.getIdReservation()).orElse(lastSavedRes);
            ResponseReservation dto = convertToResponse(lastSavedRes);
            dto.setCode(randomCode);
            dto.setBookTitle(String.join(", ", request.getBookTitles()));
            dto.setBookTitles(request.getBookTitles());
            response.setData(dto);
        }

        response.success();
        response.listMessage.add("Reserva registrada con éxito con código: " + randomCode);

        return response;
    }

    public ResponseDataGeneric<ResponseReservation> getByCode(String code) {
        ResponseDataGeneric<ResponseReservation> response = new ResponseDataGeneric<>();
        Optional<EntityReservation> opt = repositoryReservation.findByCode(code.trim().toUpperCase());
        if (opt.isPresent()) {
            response.setData(convertToResponse(opt.get()));
            response.success();
        } else {
            response.error();
            response.listMessage.add("No se encontró ninguna reserva con el código especificado");
        }
        return response;
    }

    private void checkExpirations() {
        Date today = new Date();
        List<EntityReservation> list = repositoryReservation.findAll();
        for (EntityReservation r : list) {
            if ("Pendiente".equalsIgnoreCase(r.getStatus()) && r.getExpirationDate() != null && r.getExpirationDate().before(today)) {
                r.setStatus("Vencido");
                r.setUpdatedAt(today);
                repositoryReservation.save(r);

                if (r.getBook() != null) {
                    EntityBook b = r.getBook();
                    b.setAvailableCopies(b.getAvailableCopies() + 1);
                    repositoryBook.save(b);
                }
            }
        }
    }

    private ResponseReservation convertToResponse(EntityReservation r) {
        ResponseReservation dto = new ResponseReservation();
        dto.setIdReservation(r.getIdReservation());
        dto.setCode(r.getCode());
        
        if (r.getUser() != null) {
            dto.setStudentName(r.getUser().getFirstName() + " " + r.getUser().getSurName());
            dto.setUniversityCode(r.getUser().getUniversityCode());
            dto.setEmail(r.getUser().getEmail());
        } else {
            dto.setStudentName("Estudiante UNAMBA");
            dto.setUniversityCode("EST675839");
            dto.setEmail("estudiante@unamba.edu.pe");
        }

        if (r.getBook() != null) {
            dto.setBookTitle(r.getBook().getTitle());
            List<String> titles = new ArrayList<>();
            titles.add(r.getBook().getTitle());
            dto.setBookTitles(titles);
        }

        dto.setStatus(r.getStatus());
        dto.setExpirationDate(r.getExpirationDate() != null ? r.getExpirationDate().toString() : "");
        dto.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
        return dto;
    }
}
