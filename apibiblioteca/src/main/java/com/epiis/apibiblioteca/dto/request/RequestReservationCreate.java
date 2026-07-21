package com.epiis.apibiblioteca.dto.request;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestReservationCreate {
    @NotBlank(message = "El nombre del estudiante es obligatorio")
    private String studentName;

    private String universityCode;

    private String email;

    @NotEmpty(message = "Debe seleccionar al menos un libro")
    private List<String> bookTitles;

    private List<Integer> bookIds;
}
