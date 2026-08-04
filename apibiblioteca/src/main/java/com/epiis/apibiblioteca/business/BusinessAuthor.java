package com.epiis.apibiblioteca.business;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestAuthorSave;
import com.epiis.apibiblioteca.entity.EntityAuthor;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryAuthor;

@Service
public class BusinessAuthor {
    private static final String MSG_AUTHOR_NOT_EXISTS = "El autor no existe";

    private final RepositoryAuthor repositoryAuthor;

    public BusinessAuthor(RepositoryAuthor repositoryAuthor) {
        this.repositoryAuthor = repositoryAuthor;
    }

    public ResponseDataGeneric<List<EntityAuthor>> getAll() {
        List<EntityAuthor> list = repositoryAuthor.findAll();
        return new ResponseDataGeneric<>(list);
    }

    public ResponseDataGeneric<EntityAuthor> save(RequestAuthorSave request) {
        ResponseDataGeneric<EntityAuthor> response = new ResponseDataGeneric<>();
        
        String firstName = request.getFirstName() != null ? request.getFirstName().trim() : "";
        String surName = request.getSurName() != null ? request.getSurName().trim() : "";

        if (validateInput(firstName, surName, response)) {
            return response;
        }

        // Validar duplicado por nombres y apellidos
        Optional<EntityAuthor> optExisting = repositoryAuthor.findByFirstNameAndSurName(firstName, surName);
        if (optExisting.isPresent()) {
            EntityAuthor existing = optExisting.get();
            if (request.getIdAuthor() == null || !existing.getIdAuthor().equals(request.getIdAuthor())) {
                response.error();
                response.getListMessage().add("El autor con este nombre y apellido ya está registrado");
                return response;
            }
        }

        EntityAuthor author;

        if (request.getIdAuthor() != null && request.getIdAuthor() > 0) {
            Optional<EntityAuthor> opt = repositoryAuthor.findById(request.getIdAuthor());
            if (opt.isPresent()) {
                author = opt.get();
                author.setFirstName(firstName);
                author.setSurName(surName);
                author.setUpdatedAt(new Date());
            } else {
                response.error();
                response.getListMessage().add(MSG_AUTHOR_NOT_EXISTS);
                return response;
            }
        } else {
            author = new EntityAuthor();
            author.setFirstName(firstName);
            author.setSurName(surName);
            author.setCreatedAt(new Date());
            author.setUpdatedAt(author.getCreatedAt());
        }

        EntityAuthor saved = repositoryAuthor.save(author);
        response.setData(saved);
        response.success();
        response.getListMessage().add("Autor guardado correctamente");
        return response;
    }

    private boolean validateInput(String firstName, String surName, ResponseDataGeneric<EntityAuthor> response) {
        if (firstName.isEmpty()) {
            response.error();
            response.getListMessage().add("El nombre es obligatorio");
            return true;
        }
        if (surName.isEmpty()) {
            response.error();
            response.getListMessage().add("El apellido es obligatorio");
            return true;
        }
        if (firstName.length() > 50) {
            response.error();
            response.getListMessage().add("El nombre no puede tener más de 50 caracteres");
            return true;
        }
        if (surName.length() > 40) {
            response.error();
            response.getListMessage().add("El apellido no puede tener más de 40 caracteres");
            return true;
        }
        return false;
    }

    public ResponseDataGeneric<Boolean> delete(Integer idAuthor) {
        ResponseDataGeneric<Boolean> response = new ResponseDataGeneric<>();
        if (repositoryAuthor.existsById(idAuthor)) {
            repositoryAuthor.deleteById(idAuthor);
            response.setData(true);
            response.success();
            response.getListMessage().add("Autor eliminado correctamente");
        } else {
            response.setData(false);
            response.error();
            response.getListMessage().add(MSG_AUTHOR_NOT_EXISTS);
        }
        return response;
    }
}
