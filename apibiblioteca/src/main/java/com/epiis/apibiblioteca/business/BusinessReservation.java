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
        return new ResponseDataGeneric<>(groupReservations(list));
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

        return new ResponseDataGeneric<>(groupReservations(list));
    }

    public ResponseDataGeneric<ResponseReservation> create(RequestReservationCreate request) {
        ResponseDataGeneric<ResponseReservation> response = new ResponseDataGeneric<>();
        
        if (request.getBookTitles() == null || request.getBookTitles().isEmpty()) {
            response.error();
            response.listMessage.add("Debe seleccionar al menos un libro");
            return response;
        }

        // Buscar o crear estudiante con su nombre real
        String rawName = request.getStudentName() != null && !request.getStudentName().trim().isEmpty() ? request.getStudentName().trim() : "Estudiante UNAMBA";
        String[] nameParts = rawName.split(" ");
        String fName = nameParts[0];
        String sName = nameParts.length > 1 ? rawName.substring(fName.length()).trim() : "UNAMBA";

        String email = request.getEmail() != null ? request.getEmail() : rawName.toLowerCase().replace(" ", ".") + "@unamba.edu.pe";
        Optional<EntityUser> userOpt = repositoryUser.findByEmail(email);
        EntityUser user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            user = new EntityUser();
            user.setUniversityCode(request.getUniversityCode() != null ? request.getUniversityCode() : "EST" + (100000 + new Random().nextInt(900000)));
            user.setFirstName(fName);
            user.setSurName(sName);
            user.setEmail(email);
            user.setRole("Estudiante");
            user.setCreatedAt(new Date());
            user.setUpdatedAt(user.getCreatedAt());
            user = repositoryUser.save(user);
        }

        String randomCode = "RES" + (1000 + new Random().nextInt(9000));
        EntityReservation lastSavedRes = null;

        for (String title : request.getBookTitles()) {
            String trimmedTitle = title.trim();
            Optional<EntityBook> bookOpt = repositoryBook.findByTitle(trimmedTitle);
            if (!bookOpt.isPresent()) {
                bookOpt = repositoryBook.findByTitleIgnoreCase(trimmedTitle);
            }
            if (!bookOpt.isPresent()) {
                List<EntityBook> list = repositoryBook.findByTitleContainingIgnoreCase(trimmedTitle);
                if (!list.isEmpty()) {
                    bookOpt = Optional.of(list.get(0));
                }
            }

            if (bookOpt.isPresent()) {
                EntityBook book = bookOpt.get();
                if (book.getAvailableCopies() > 0) {
                    book.setAvailableCopies(book.getAvailableCopies() - 1);
                    book.setUpdatedAt(new Date());
                    repositoryBook.save(book);
                }

                EntityReservation res = new EntityReservation();
                res.setIdUser(user.getIdUser());
                res.setIdBook(book.getIdBook());
                res.setCode(randomCode);
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
            List<EntityReservation> savedList = repositoryReservation.findAllByCode(randomCode);
            List<ResponseReservation> grouped = groupReservations(savedList.isEmpty() ? List.of(lastSavedRes) : savedList);
            if (!grouped.isEmpty()) {
                response.setData(grouped.get(0));
            }
        }

        response.success();
        response.listMessage.add("Reserva registrada con éxito con código: " + randomCode);

        return response;
    }

    public ResponseDataGeneric<ResponseReservation> getByCode(String code) {
        ResponseDataGeneric<ResponseReservation> response = new ResponseDataGeneric<>();
        List<EntityReservation> list = repositoryReservation.findAllByCode(code.trim().toUpperCase());
        if (!list.isEmpty()) {
            List<ResponseReservation> grouped = groupReservations(list);
            response.setData(grouped.get(0));
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

    private List<ResponseReservation> groupReservations(List<EntityReservation> list) {
        java.util.Map<String, List<EntityReservation>> grouped = new java.util.LinkedHashMap<>();
        for (EntityReservation r : list) {
            grouped.computeIfAbsent(r.getCode(), k -> new ArrayList<>()).add(r);
        }

        List<ResponseReservation> resList = new ArrayList<>();
        for (java.util.Map.Entry<String, List<EntityReservation>> entry : grouped.entrySet()) {
            List<EntityReservation> group = entry.getValue();
            EntityReservation first = group.get(0);

            ResponseReservation dto = new ResponseReservation();
            dto.setIdReservation(first.getIdReservation());
            dto.setCode(first.getCode());

            if (first.getUser() != null) {
                dto.setStudentName(first.getUser().getFirstName() + " " + first.getUser().getSurName());
                dto.setUniversityCode(first.getUser().getUniversityCode());
                dto.setEmail(first.getUser().getEmail());
            } else {
                dto.setStudentName("Estudiante UNAMBA");
                dto.setUniversityCode("EST675839");
                dto.setEmail("estudiante@unamba.edu.pe");
            }

            List<String> titles = new ArrayList<>();
            for (EntityReservation er : group) {
                if (er.getBook() != null && er.getBook().getTitle() != null) {
                    titles.add(er.getBook().getTitle());
                }
            }
            if (titles.isEmpty()) {
                titles.add("Libro Reservado");
            }

            dto.setBookTitles(titles);
            dto.setBookTitle(String.join(", ", titles));
            dto.setStatus(first.getStatus());
            dto.setExpirationDate(first.getExpirationDate() != null ? first.getExpirationDate().toString().split(" ")[0] : "");
            dto.setCreatedAt(first.getCreatedAt() != null ? first.getCreatedAt().toString().split(" ")[0] : "");

            resList.add(dto);
        }

        return resList;
    }
}
