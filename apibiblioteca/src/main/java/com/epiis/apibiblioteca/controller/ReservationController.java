package com.epiis.apibiblioteca.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.epiis.apibiblioteca.business.BusinessReservation;
import com.epiis.apibiblioteca.dto.request.RequestReservationCreate;
import com.epiis.apibiblioteca.dto.response.ResponseReservation;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "reservation")
public class ReservationController {
    private final BusinessReservation businessReservation;

    public ReservationController(BusinessReservation businessReservation) {
        this.businessReservation = businessReservation;
    }

    @GetMapping
    public ResponseEntity<ResponseDataGeneric<List<ResponseReservation>>> getAll() {
        return ResponseEntity.ok(businessReservation.getAll());
    }

    @GetMapping(path = "student/{studentName}")
    public ResponseEntity<ResponseDataGeneric<List<ResponseReservation>>> getByStudent(@PathVariable String studentName) {
        return ResponseEntity.ok(businessReservation.getByStudent(studentName));
    }

    @GetMapping(path = "code/{code}")
    public ResponseEntity<ResponseDataGeneric<ResponseReservation>> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(businessReservation.getByCode(code));
    }

    @PostMapping
    public ResponseEntity<ResponseDataGeneric<ResponseReservation>> create(@Valid @RequestBody RequestReservationCreate request) {
        return ResponseEntity.ok(businessReservation.create(request));
    }
}
