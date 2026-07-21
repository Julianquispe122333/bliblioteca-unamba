package com.epiis.apibiblioteca.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestLogin {
    @NotBlank(message = "El correo es requerido")
    private String email;

    @NotBlank(message = "El código o contraseña es requerido")
    private String code;

    @NotBlank(message = "El rol es requerido")
    private String role; // 'admin' o 'student' / 'Bibliotecario' o 'Estudiante'
}
