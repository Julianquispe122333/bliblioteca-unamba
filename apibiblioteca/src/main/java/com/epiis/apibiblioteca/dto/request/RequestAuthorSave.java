package com.epiis.apibiblioteca.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestAuthorSave {
    private Integer idAuthor;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 50, message = "El nombre no puede tener más de 50 caracteres")
    @Pattern(regexp = "^(?!\\s*$)[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ'&.\\s-]+$", message = "El nombre debe contener solo texto, sin números")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(max = 40, message = "El apellido no puede tener más de 40 caracteres")
    @Pattern(regexp = "^(?!\\s*$)[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ'&.\\s-]+$", message = "El apellido debe contener solo texto, sin números")
    private String surName;
}
