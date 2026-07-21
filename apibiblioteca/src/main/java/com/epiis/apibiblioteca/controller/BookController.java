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
import com.epiis.apibiblioteca.business.BusinessBook;
import com.epiis.apibiblioteca.dto.request.RequestBookSave;
import com.epiis.apibiblioteca.dto.response.ResponseBook;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "book")
public class BookController {
    private final BusinessBook businessBook;

    public BookController(BusinessBook businessBook) {
        this.businessBook = businessBook;
    }

    @GetMapping
    public ResponseEntity<ResponseDataGeneric<List<ResponseBook>>> getAll() {
        return ResponseEntity.ok(businessBook.getAll());
    }

    @PostMapping
    public ResponseEntity<ResponseDataGeneric<ResponseBook>> save(@Valid @RequestBody RequestBookSave request) {
        return ResponseEntity.ok(businessBook.save(request));
    }

    @DeleteMapping(path = "{id}")
    public ResponseEntity<ResponseDataGeneric<Boolean>> delete(@PathVariable Integer id) {
        return ResponseEntity.ok(businessBook.delete(id));
    }
}
