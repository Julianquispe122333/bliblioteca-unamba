package com.epiis.apibiblioteca.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestBookSave {
    private Integer idBook;

    private Integer idCategory;
    private String categoryName;

    private Integer idAuthor;
    private String authorName;

    @NotBlank(message = "El título es obligatorio")
    private String title;

    @NotNull(message = "El total de copias es obligatorio")
    @Min(value = 1, message = "El total de copias debe ser al menos 1")
    private Integer totalCopies;

    @NotNull(message = "Las copias disponibles son obligatorias")
    @Min(value = 0, message = "Las copias disponibles no pueden ser negativas")
    private Integer availableCopies;

    private String description;

    private Boolean hasPdf;

    private String image;
}
