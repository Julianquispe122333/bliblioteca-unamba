package com.epiis.apibiblioteca.controller;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.epiis.apibiblioteca.business.BusinessLoan;
import com.epiis.apibiblioteca.dto.request.RequestLoanCreate;
import com.epiis.apibiblioteca.dto.request.RequestLoanReturn;
import com.epiis.apibiblioteca.dto.response.ResponseLoan;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "loan")
public class LoanController {
    private final BusinessLoan businessLoan;

    public LoanController(BusinessLoan businessLoan) {
        this.businessLoan = businessLoan;
    }

    @GetMapping
    public ResponseEntity<ResponseDataGeneric<List<ResponseLoan>>> getAll() {
        return ResponseEntity.ok(businessLoan.getAll());
    }

    @PostMapping
    public ResponseEntity<ResponseDataGeneric<ResponseLoan>> createFromReservation(@Valid @RequestBody RequestLoanCreate request) {
        return ResponseEntity.ok(businessLoan.createFromReservation(request));
    }

    @PostMapping(path = "return")
    public ResponseEntity<ResponseDataGeneric<ResponseLoan>> returnBooks(@Valid @RequestBody RequestLoanReturn request) {
        return ResponseEntity.ok(businessLoan.returnBooks(request));
    }
}
