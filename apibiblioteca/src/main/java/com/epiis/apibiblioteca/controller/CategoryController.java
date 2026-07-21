package com.epiis.apibiblioteca.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.epiis.apibiblioteca.business.BusinessCategory;
import com.epiis.apibiblioteca.dto.request.RequestCategorySave;
import com.epiis.apibiblioteca.entity.EntityCategory;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "category")
public class CategoryController {
    private final BusinessCategory businessCategory;

    public CategoryController(BusinessCategory businessCategory) {
        this.businessCategory = businessCategory;
    }

    @GetMapping
    public ResponseEntity<ResponseDataGeneric<List<EntityCategory>>> getAll() {
        return ResponseEntity.ok(businessCategory.getAll());
    }

    @PostMapping
    public ResponseEntity<ResponseDataGeneric<EntityCategory>> save(@Valid @RequestBody RequestCategorySave request) {
        return ResponseEntity.ok(businessCategory.save(request));
    }

    @DeleteMapping(path = "{id}")
    public ResponseEntity<ResponseDataGeneric<Boolean>> delete(@PathVariable Integer id) {
        return ResponseEntity.ok(businessCategory.delete(id));
    }
}
