package com.epiis.apibiblioteca.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseLoanBook {
    private String title;
    private Boolean returned;
}
