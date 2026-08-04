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

        if (firstName.isEmpty()) {
            response.error();
            response.listMessage.add("El nombre es obligatorio");
            return response;
        }
        if (surName.isEmpty()) {
            response.error();
            response.listMessage.add("El apellido es obligatorio");
            return response;
        }
        if (firstName.length() > 50) {
            response.error();
            response.listMessage.add("El nombre no puede tener más de 50 caracteres");
            return response;
        }
        if (surName.length() > 40) {
            response.error();
            response.listMessage.add("El apellido no puede tener más de 40 caracteres");
            return response;
        }

        // Validar duplicado por nombres y apellidos
        Optional<EntityAuthor> optExisting = repositoryAuthor.findByFirstNameAndSurName(firstName, surName);
        if (optExisting.isPresent()) {
            EntityAuthor existing = optExisting.get();
            if (request.getIdAuthor() == null || !existing.getIdAuthor().equals(request.getIdAuthor())) {
                response.error();
                response.listMessage.add("El autor con este nombre y apellido ya está registrado");
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
                response.listMessage.add("El autor no existe");
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
        response.listMessage.add("Autor guardado correctamente");
        return response;
    }

    public ResponseDataGeneric<Boolean> delete(Integer idAuthor) {
        ResponseDataGeneric<Boolean> response = new ResponseDataGeneric<>();
        if (repositoryAuthor.existsById(idAuthor)) {
            repositoryAuthor.deleteById(idAuthor);
            response.setData(true);
            response.success();
            response.listMessage.add("Autor eliminado correctamente");
        } else {
            response.setData(false);
            response.error();
            response.listMessage.add("El autor no existe");
        }
        return response;
    }
}
