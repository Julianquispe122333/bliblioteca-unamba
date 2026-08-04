package com.epiis.apibiblioteca;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registra el JwtFilter en la cadena de filtros de Servlet.
 * Se aplica a todos los endpoints (/*).
 * Las exclusiones están definidas dentro del propio JwtFilter.shouldNotFilter().
 */
@Configuration
public class FilterConfig {

    private final JwtFilter jwtFilter;

    public FilterConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public FilterRegistrationBean<JwtFilter> jwtFilterRegistration() {
        FilterRegistrationBean<JwtFilter> registration = new FilterRegistrationBean<>();
        registration.setFilter(jwtFilter);
        registration.addUrlPatterns("/*");
        registration.setOrder(1); // Alta prioridad — se ejecuta antes que otros filtros
        registration.setName("jwtFilter");
        return registration;
    }
}
