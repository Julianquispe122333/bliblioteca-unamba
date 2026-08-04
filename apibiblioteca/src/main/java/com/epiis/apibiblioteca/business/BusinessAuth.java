package com.epiis.apibiblioteca.business;

import java.util.Optional;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestLogin;
import com.epiis.apibiblioteca.dto.response.ResponseLogin;
import com.epiis.apibiblioteca.entity.EntityUser;
import com.epiis.apibiblioteca.repository.RepositoryUser;

@Service
public class BusinessAuth {
    private final RepositoryUser repositoryUser;
    private final JwtService jwtService;

    public BusinessAuth(RepositoryUser repositoryUser, JwtService jwtService) {
        this.repositoryUser = repositoryUser;
        this.jwtService = jwtService;
    }

    public ResponseLogin login(RequestLogin request) {
        ResponseLogin response = new ResponseLogin();
        
        String reqEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        String reqCode = request.getCode() != null ? request.getCode().trim() : "";
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
        if (!reqEmail.isEmpty() && !user.getEmail().equalsIgnoreCase(reqEmail)) {
            response.error();
            response.listMessage.add("El correo institucional ingresado no coincide con el registrado");
            return response;
        }

        // Validar Código Universitario
        if (!reqCode.isEmpty() && !user.getUniversityCode().equalsIgnoreCase(reqCode)) {
            response.error();
            response.listMessage.add("El código universitario ingresado es incorrecto");
            return response;
        }

        // Determinar Rol automáticamente basado en la BD
        boolean isUserAdmin = "Bibliotecario".equalsIgnoreCase(user.getRole());
        String roleFrontend = isUserAdmin ? "admin" : "student";

        // Login Exitoso
        response.setIdUser(user.getIdUser());
        response.setRole(roleFrontend);
        response.setCorreo(user.getEmail());
        response.setCodigo(user.getUniversityCode());

        String displayName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getSurName() != null ? user.getSurName() : "")).trim();
        if (displayName.isEmpty()) {
            displayName = ("admin".equals(roleFrontend) ? "Administrador" : "Estudiante") + " UNAMBA";
        }
        response.setUsername(displayName);

        // Generar JWT con expiración de 60 segundos
        String token = jwtService.generateToken(user.getEmail(), roleFrontend);
        response.setToken(token);

        response.success();
        response.listMessage.add("Inicio de sesión exitoso");

        return response;
    }
}
