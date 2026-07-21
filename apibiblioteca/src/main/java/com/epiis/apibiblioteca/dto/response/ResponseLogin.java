package com.epiis.apibiblioteca.dto.response;

import com.epiis.apibiblioteca.generic.ResponseGeneric;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseLogin extends ResponseGeneric {
    private Integer idUser;
    private String username;
    private String role;
    private String correo;
    private String codigo;
}
