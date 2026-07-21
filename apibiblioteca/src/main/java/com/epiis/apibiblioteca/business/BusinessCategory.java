package com.epiis.apibiblioteca.business;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestCategorySave;
import com.epiis.apibiblioteca.entity.EntityCategory;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryCategory;

@Service
public class BusinessCategory {
    private final RepositoryCategory repositoryCategory;

    public BusinessCategory(RepositoryCategory repositoryCategory) {
        this.repositoryCategory = repositoryCategory;
    }

    public ResponseDataGeneric<List<EntityCategory>> getAll() {
        List<EntityCategory> list = repositoryCategory.findAll();
        return new ResponseDataGeneric<>(list);
    }

    public ResponseDataGeneric<EntityCategory> save(RequestCategorySave request) {
        ResponseDataGeneric<EntityCategory> response = new ResponseDataGeneric<>();
        EntityCategory category;

        if (request.getIdCategory() != null && request.getIdCategory() > 0) {
            Optional<EntityCategory> opt = repositoryCategory.findById(request.getIdCategory());
            if (opt.isPresent()) {
                category = opt.get();
                category.setName(request.getName().trim());
                category.setUpdatedAt(new Date());
            } else {
                response.error();
                response.listMessage.add("La categoría no existe");
                return response;
            }
        } else {
            category = new EntityCategory();
            category.setName(request.getName().trim());
            category.setCreatedAt(new Date());
            category.setUpdatedAt(category.getCreatedAt());
        }

        EntityCategory saved = repositoryCategory.save(category);
        response.setData(saved);
        response.success();
        response.listMessage.add("Categoría guardada correctamente");
        return response;
    }

    public ResponseDataGeneric<Boolean> delete(Integer idCategory) {
        ResponseDataGeneric<Boolean> response = new ResponseDataGeneric<>();
        if (repositoryCategory.existsById(idCategory)) {
            repositoryCategory.deleteById(idCategory);
            response.setData(true);
            response.success();
            response.listMessage.add("Categoría eliminada correctamente");
        } else {
            response.setData(false);
            response.error();
            response.listMessage.add("La categoría no existe");
        }
        return response;
    }
}
