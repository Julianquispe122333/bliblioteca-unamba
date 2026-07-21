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
        EntityAuthor author;

        if (request.getIdAuthor() != null && request.getIdAuthor() > 0) {
            Optional<EntityAuthor> opt = repositoryAuthor.findById(request.getIdAuthor());
            if (opt.isPresent()) {
                author = opt.get();
                author.setFirstName(request.getFirstName().trim());
                author.setSurName(request.getSurName().trim());
                author.setUpdatedAt(new Date());
            } else {
                response.error();
                response.listMessage.add("El autor no existe");
                return response;
            }
        } else {
            author = new EntityAuthor();
            author.setFirstName(request.getFirstName().trim());
            author.setSurName(request.getSurName().trim());
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
