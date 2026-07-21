package com.epiis.apibiblioteca.business;

import java.util.Date;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestLogin;
import com.epiis.apibiblioteca.dto.response.ResponseLogin;
import com.epiis.apibiblioteca.entity.EntityUser;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryUser;

@Service
public class BusinessAuth {
    private final RepositoryUser repositoryUser;

    public BusinessAuth(RepositoryUser repositoryUser) {
        this.repositoryUser = repositoryUser;
    }

    public ResponseLogin login(RequestLogin request) {
        ResponseLogin response = new ResponseLogin();
        
        String reqEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        String reqCode = request.getCode() != null ? request.getCode().trim() : "";
        String reqRole = request.getRole() != null ? request.getRole().trim() : "";

        // Buscar usuario por correo o codigo universitario
        Optional<EntityUser> optionalUser = repositoryUser.findByEmail(reqEmail);
        if (!optionalUser.isPresent()) {
            optionalUser = repositoryUser.findByUniversityCode(reqCode);
        }

        if (!optionalUser.isPresent()) {
            response.error();
            response.listMessage.add("Usuario no registrado en la base de datos");
            return response;
        }

        EntityUser user = optionalUser.get();

        // Validar Correo Institucional
        if (!user.getEmail().equalsIgnoreCase(reqEmail)) {
            response.error();
            response.listMessage.add("El correo institucional ingresado no coincide con el registrado");
            return response;
        }

        // Validar Código Universitario
        if (!user.getUniversityCode().equalsIgnoreCase(reqCode)) {
            response.error();
            response.listMessage.add("El código universitario ingresado es incorrecto");
            return response;
        }

        // Validar Rol
        boolean isAdminRequested = "admin".equalsIgnoreCase(reqRole) || "Bibliotecario".equalsIgnoreCase(reqRole);
        boolean isUserAdmin = "Bibliotecario".equalsIgnoreCase(user.getRole());

        if (isAdminRequested && !isUserAdmin) {
            response.error();
            response.listMessage.add("El usuario no tiene permisos de Administrador");
            return response;
        }

        if (!isAdminRequested && isUserAdmin) {
            response.error();
            response.listMessage.add("El usuario es Administrador. Por favor seleccione el rol Administrador");
            return response;
        }

        // Login Exitoso
        response.setIdUser(user.getIdUser());
        String roleFrontend = isUserAdmin ? "admin" : "student";
        response.setRole(roleFrontend);
        response.setCorreo(user.getEmail());
        response.setCodigo(user.getUniversityCode());

        String displayName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getSurName() != null ? user.getSurName() : "")).trim();
        if (displayName.isEmpty()) {
            displayName = ("admin".equals(roleFrontend) ? "Administrador" : "Estudiante") + " UNAMBA";
        }
        response.setUsername(displayName);

        response.success();
        response.listMessage.add("Inicio de sesión exitoso");

        return response;
    }
}
