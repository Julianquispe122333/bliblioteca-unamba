package com.epiis.apibiblioteca.business;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Servicio JWT para el sistema Biblioteca UNAMBA.
 * Genera tokens con vida de 60 segundos (1 minuto).
 * No hay renovación: token expirado = sesión cerrada.
 */
@Service
public class JwtService {

    // Clave secreta de 256 bits (32 bytes) para HS256
    private static final String SECRET_KEY_STRING =
            "biblioteca-unamba-jwt-secret-key-2024-ds2-epiis!";

    private final SecretKey secretKey;

    // Tiempo de vida del token: 60 segundos (1 minuto)
    private static final long TOKEN_EXPIRATION_MS = 60_000L;

    public JwtService() {
        this.secretKey = Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Genera un JWT firmado con HS256, que expira en 60 segundos.
     *
     * @param email email del usuario autenticado
     * @param role  rol del usuario ("admin" o "student")
     * @return token JWT como String
     */
    public String generateToken(String email, String role) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + TOKEN_EXPIRATION_MS);

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Valida el token JWT.
     *
     * @param token el JWT a validar
     * @return true si es válido y no expirado, false en cualquier otro caso
     */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException | MalformedJwtException |
                 UnsupportedJwtException | SignatureException |
                 IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Extrae el email (subject) del token.
     */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Extrae el rol del token.
     */
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    /**
     * Verifica si el token ha expirado (puede lanzar ExpiredJwtException).
     */
    public boolean isTokenExpired(String token) {
        try {
            return parseClaims(token).getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    // ---- Métodos internos ----

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
