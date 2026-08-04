package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.dto.request.RequestLogin;
import com.epiis.apibiblioteca.dto.response.ResponseLogin;
import com.epiis.apibiblioteca.entity.EntityUser;
import com.epiis.apibiblioteca.repository.RepositoryUser;

public class BusinessAuthTest {

    @Mock
    private RepositoryUser repositoryUser;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private BusinessAuth businessAuth;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testLoginSuccessStudent() {
        RequestLogin req = new RequestLogin();
        req.setEmail("juan@unamba.edu.pe");
        req.setCode("2024001");

        EntityUser user = new EntityUser();
        user.setIdUser(2);
        user.setEmail("juan@unamba.edu.pe");
        user.setUniversityCode("2024001");
        user.setRole("Estudiante");
        user.setFirstName("Juan");
        user.setSurName("Pérez");

        when(repositoryUser.findByEmail("juan@unamba.edu.pe")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("juan@unamba.edu.pe", "student")).thenReturn("dummy-token");

        ResponseLogin res = businessAuth.login(req);

        assertEquals("success", res.getType());
        assertEquals("student", res.getRole());
        assertEquals("Juan Pérez", res.getUsername());
        assertEquals("dummy-token", res.getToken());
    }

    @Test
    public void testLoginUserNotFound() {
        RequestLogin req = new RequestLogin();
        req.setEmail("missing@unamba.edu.pe");

        when(repositoryUser.findByEmail("missing@unamba.edu.pe")).thenReturn(Optional.empty());
        when(repositoryUser.findByUniversityCode(anyString())).thenReturn(Optional.empty());

        ResponseLogin res = businessAuth.login(req);

        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("Usuario no registrado en la base de datos"));
    }

    @Test
    public void testLoginEmailMismatch() {
        RequestLogin req = new RequestLogin();
        req.setEmail("other@unamba.edu.pe");
        req.setCode("2024001");

        EntityUser user = new EntityUser();
        user.setEmail("juan@unamba.edu.pe");
        user.setUniversityCode("2024001");

        when(repositoryUser.findByEmail("other@unamba.edu.pe")).thenReturn(Optional.empty());
        when(repositoryUser.findByUniversityCode("2024001")).thenReturn(Optional.of(user));

        ResponseLogin res = businessAuth.login(req);

        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("El correo institucional ingresado no coincide con el registrado"));
    }

    @Test
    public void testLoginCodeMismatch() {
        RequestLogin req = new RequestLogin();
        req.setEmail("juan@unamba.edu.pe");
        req.setCode("9999999");

        EntityUser user = new EntityUser();
        user.setEmail("juan@unamba.edu.pe");
        user.setUniversityCode("2024001");

        when(repositoryUser.findByEmail("juan@unamba.edu.pe")).thenReturn(Optional.of(user));

        ResponseLogin res = businessAuth.login(req);

        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("El código universitario ingresado es incorrecto"));
    }
}
