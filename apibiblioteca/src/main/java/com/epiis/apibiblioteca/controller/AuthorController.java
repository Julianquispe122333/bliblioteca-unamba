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
import com.epiis.apibiblioteca.business.BusinessAuthor;
import com.epiis.apibiblioteca.dto.request.RequestAuthorSave;
import com.epiis.apibiblioteca.entity.EntityAuthor;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "author")
public class AuthorController {
    private final BusinessAuthor businessAuthor;

    public AuthorController(BusinessAuthor businessAuthor) {
        this.businessAuthor = businessAuthor;
    }

    @GetMapping
    public ResponseEntity<ResponseDataGeneric<List<EntityAuthor>>> getAll() {
        return ResponseEntity.ok(businessAuthor.getAll());
    }

    @PostMapping
    public ResponseEntity<ResponseDataGeneric<EntityAuthor>> save(@Valid @RequestBody RequestAuthorSave request) {
        return ResponseEntity.ok(businessAuthor.save(request));
    }

    @DeleteMapping(path = "{id}")
    public ResponseEntity<ResponseDataGeneric<Boolean>> delete(@PathVariable Integer id) {
        return ResponseEntity.ok(businessAuthor.delete(id));
    }
}
