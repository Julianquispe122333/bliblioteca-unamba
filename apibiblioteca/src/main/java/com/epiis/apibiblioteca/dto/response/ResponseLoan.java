package com.epiis.apibiblioteca.dto.response;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseLoan {
    private Integer idLoan;
    private String reservationCode;
    private String bookTitle;
    private String studentName;
    private String loanDate;
    private String dueDate;
    private String returnDate;
    private String status;
    private List<ResponseLoanBook> loanBooks;
}
