package com.epiis.apibiblioteca.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestLoanCreate {
    @NotBlank(message = "El código de reserva es obligatorio")
    private String reservationCode;
}
