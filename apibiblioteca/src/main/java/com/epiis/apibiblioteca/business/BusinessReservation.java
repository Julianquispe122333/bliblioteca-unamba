package com.epiis.apibiblioteca.business;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
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

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BusinessReservation {
    private static final String STATUS_PENDIENTE = "Pendiente";
    private static final String STATUS_VENCIDO = "Vencido";

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

        if (userOpt.isEmpty()) {
            return new ResponseDataGeneric<>(new ArrayList<>());
        }

        List<EntityReservation> list = repositoryReservation.findByIdUserOrderByCreatedAtDesc(userOpt.get().getIdUser());
        return new ResponseDataGeneric<>(groupReservations(list));
    }

    public ResponseDataGeneric<ResponseReservation> create(RequestReservationCreate request) {
        ResponseDataGeneric<ResponseReservation> response = new ResponseDataGeneric<>();
        
        if (request.getBookTitles() == null || request.getBookTitles().isEmpty()) {
            response.error();
            response.getListMessage().add("Debe seleccionar al menos un libro");
            return response;
        }

        if (request.getStudentName() == null || request.getStudentName().trim().isEmpty()) {
            response.error();
            response.getListMessage().add("El nombre del estudiante es obligatorio");
            return response;
        }

        String rawName = request.getStudentName().trim();
        String[] nameParts = rawName.split(" ");
        String fName = nameParts[0];
        String sName = nameParts.length > 1 ? rawName.substring(fName.length()).trim() : "UNAMBA";

        EntityUser user = findOrCreateUser(request, rawName, fName, sName);
        String randomCode = generateUniqueCode();
        EntityReservation lastSavedRes = null;

        for (String title : request.getBookTitles()) {
            lastSavedRes = processBookReservation(title, user, randomCode, response);
            if (lastSavedRes == null && response.isError()) {
                return response;
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
        response.getListMessage().add("Reserva registrada con éxito con código: " + randomCode);

        return response;
    }

    private EntityUser findOrCreateUser(RequestReservationCreate request, String rawName, String fName, String sName) {
        EntityUser user = null;
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user = repositoryUser.findByEmail(request.getEmail().trim()).orElse(null);
        }
        if (user == null && request.getUniversityCode() != null && !request.getUniversityCode().trim().isEmpty()) {
            user = repositoryUser.findByUniversityCode(request.getUniversityCode().trim()).orElse(null);
        }
        if (user == null) {
            user = repositoryUser.findAll().stream()
                .filter(u2 -> (u2.getFirstName() + " " + u2.getSurName()).trim().equalsIgnoreCase(rawName))
                .findFirst().orElse(null);
        }
        if (user == null) {
            String email = request.getEmail() != null && !request.getEmail().trim().isEmpty()
                ? request.getEmail().trim()
                : fName.toLowerCase() + "." + sName.toLowerCase().replace(" ", ".") + "@unamba.edu.pe";
            String code = request.getUniversityCode() != null && !request.getUniversityCode().trim().isEmpty()
                ? request.getUniversityCode().trim()
                : "EST" + (100000 + ThreadLocalRandom.current().nextInt(900000));
            user = new EntityUser();
            user.setUniversityCode(code);
            user.setFirstName(fName);
            user.setSurName(sName);
            user.setEmail(email);
            user.setRole("Estudiante");
            user.setCreatedAt(new Date());
            user.setUpdatedAt(user.getCreatedAt());
            user = repositoryUser.save(user);
        }
        return user;
    }

    private String generateUniqueCode() {
        String randomCode;
        do {
            randomCode = "RES" + (1000 + ThreadLocalRandom.current().nextInt(9000));
        } while (!repositoryReservation.findAllByCode(randomCode).isEmpty());
        return randomCode;
    }

    private EntityReservation processBookReservation(String title, EntityUser user, String randomCode, ResponseDataGeneric<ResponseReservation> response) {
        String trimmedTitle = title.trim();
        Optional<EntityBook> bookOpt = repositoryBook.findByTitle(trimmedTitle);
        if (bookOpt.isEmpty()) {
            bookOpt = repositoryBook.findByTitleIgnoreCase(trimmedTitle);
        }
        if (bookOpt.isEmpty()) {
            List<EntityBook> list = repositoryBook.findByTitleContainingIgnoreCase(trimmedTitle);
            if (!list.isEmpty()) {
                bookOpt = Optional.of(list.get(0));
            }
        }

        if (bookOpt.isEmpty()) {
            response.error();
            response.getListMessage().add("No se encontró el libro: " + title);
            return null;
        }

        EntityBook book = bookOpt.get();
        if (book.getAvailableCopies() <= 0) {
            response.error();
            response.getListMessage().add("El libro " + book.getTitle() + " no tiene copias disponibles.");
            return null;
        }
        
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        book.setUpdatedAt(new Date());
        repositoryBook.save(book);

        EntityReservation res = new EntityReservation();
        res.setIdUser(user.getIdUser());
        res.setIdBook(book.getIdBook());
        res.setCode(randomCode);
        res.setStatus(STATUS_PENDIENTE);

        Date now = new Date();
        Calendar cal = Calendar.getInstance();
        cal.setTime(now);
        cal.add(Calendar.MINUTE, 1);

        res.setExpirationDate(cal.getTime());
        res.setCreatedAt(now);
        res.setUpdatedAt(now);

        return repositoryReservation.save(res);
    }

    public ResponseDataGeneric<ResponseReservation> getByCode(String code) {
        checkExpirations();
        ResponseDataGeneric<ResponseReservation> response = new ResponseDataGeneric<>();
        List<EntityReservation> list = repositoryReservation.findAllByCode(code.trim().toUpperCase());
        if (!list.isEmpty()) {
            List<ResponseReservation> grouped = groupReservations(list);
            response.setData(grouped.get(0));
            response.success();
        } else {
            response.error();
            response.getListMessage().add("No se encontró ninguna reserva con el código especificado");
        }
        return response;
    }

    private void checkExpirations() {
        Date today = new Date();
        List<EntityReservation> list = repositoryReservation.findAll();
        for (EntityReservation r : list) {
            if (STATUS_PENDIENTE.equalsIgnoreCase(r.getStatus()) && r.getExpirationDate() != null && r.getExpirationDate().before(today)) {
                r.setStatus(STATUS_VENCIDO);
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
            resList.add(mapToResponseReservation(entry.getValue()));
        }

        return resList;
    }

    private ResponseReservation mapToResponseReservation(List<EntityReservation> group) {
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
        dto.setExpirationDate(first.getExpirationDate() != null ? first.getExpirationDate().toString() : "");
        dto.setCreatedAt(first.getCreatedAt() != null ? first.getCreatedAt().toString() : "");

        return dto;
    }
}
