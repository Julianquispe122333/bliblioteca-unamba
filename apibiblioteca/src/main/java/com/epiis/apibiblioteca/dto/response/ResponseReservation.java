package com.epiis.apibiblioteca.dto.response;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseReservation {
    private Integer idReservation;
    private String code;
    private String studentName;
    private String universityCode;
    private String email;
    private List<String> bookTitles;
    private String bookTitle;
    private String status;
    private String expirationDate;
    private String createdAt;
}
