package com.epiis.apibiblioteca.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestCategorySave {
    private Integer idCategory;

    @NotBlank(message = "El nombre de la categoría es obligatorio")
    private String name;
}
