package com.epiis.apibiblioteca.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseBook {
    private Integer idBook;
    private Integer idCategory;
    private Integer idAuthor;
    private String title;
    private String authorName;
    private String categoryName;
    private Integer totalCopies;
    private Integer availableCopies;
    private String description;
    private Boolean hasPdf;
    private String image;
}
