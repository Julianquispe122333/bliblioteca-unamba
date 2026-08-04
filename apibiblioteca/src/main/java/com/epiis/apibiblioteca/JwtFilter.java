package com.epiis.apibiblioteca;

import com.epiis.apibiblioteca.business.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * Filtro JWT para el sistema Biblioteca UNAMBA.
 *
 * Intercepta todas las peticiones excepto /auth/*.
 * Si el token falta, es inválido o expiró → responde 401 Unauthorized con JSON estructurado.
 * No hay renovación automática: token expirado = sesión cerrada.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final String HEADER_AUTHORIZATION = "Authorization";
    private static final String PREFIX_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public JwtFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "*");
        response.setHeader("Access-Control-Expose-Headers", HEADER_AUTHORIZATION);

        // Permitir pre-flight CORS sin token
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        String authHeader = request.getHeader(HEADER_AUTHORIZATION);

        // Sin header Authorization → token ausente
        if (authHeader == null || !authHeader.startsWith(PREFIX_BEARER)) {
            writeUnauthorizedResponse(response, "TOKEN_MISSING", "Se requiere autenticación para acceder a este recurso");
            return;
        }

        String token = authHeader.substring(PREFIX_BEARER.length());

        if (!jwtService.isTokenValid(token)) {
            // Distinguir si expiró vs si es inválido
            if (jwtService.isTokenExpired(token)) {
                writeUnauthorizedResponse(response, "TOKEN_EXPIRED", "La sesión ha caducado");
            } else {
                writeUnauthorizedResponse(response, "TOKEN_INVALID", "El token de autenticación no es válido");
            }
            return;
        }

        // Extraer claims para generar un nuevo token con 1 minuto de vida fresco (Renovación por actividad)
        String email = jwtService.extractEmail(token);
        String role = jwtService.extractRole(token);
        String newToken = jwtService.generateToken(email, role);

        // Adjuntar el token nuevo a la cabecera de respuesta
        response.setHeader(HEADER_AUTHORIZATION, PREFIX_BEARER + newToken);

        // Token válido → continuar con la petición
        filterChain.doFilter(request, response);
    }

    /**
     * Rutas excluidas de la validación JWT.
     * /auth/** → login y endpoints públicos de autenticación.
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/auth/")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui");
    }

    /**
     * Escribe una respuesta 401 con JSON estructurado.
     */
    private void writeUnauthorizedResponse(
            HttpServletResponse response,
            String errorCode,
            String message
    ) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Map<String, String> body = Map.of(
                "error", errorCode,
                "message", message
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
