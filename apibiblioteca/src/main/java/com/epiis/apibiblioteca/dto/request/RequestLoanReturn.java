package com.epiis.apibiblioteca.dto.request;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestLoanReturn {
    @NotBlank(message = "El código de préstamo/reserva es obligatorio")
    private String reservationCode;

    @NotEmpty(message = "Debe indicar los libros a devolver")
    private List<String> booksReturningNow;
}
