package com.epiis.apibiblioteca;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

public class WebAndFilterConfigTest {

    @Test
    public void testFilterConfig() {
        JwtFilter filter = mock(JwtFilter.class);
        FilterConfig config = new FilterConfig(filter);

        FilterRegistrationBean<JwtFilter> bean = config.jwtFilterRegistration();
        assertNotNull(bean);
        assertEquals(filter, bean.getFilter());
    }

    @Test
    public void testWebConfig() {
        WebConfig webConfig = new WebConfig();
        CorsRegistry registry = mock(CorsRegistry.class);
        CorsRegistration registration = mock(CorsRegistration.class);

        when(registry.addMapping("/**")).thenReturn(registration);
        when(registration.allowedOrigins(anyString())).thenReturn(registration);
        when(registration.allowedMethods(any(String[].class))).thenReturn(registration);
        when(registration.allowedHeaders(any(String[].class))).thenReturn(registration);
        when(registration.exposedHeaders(any(String[].class))).thenReturn(registration);

        webConfig.addCorsMappings(registry);
        verify(registry).addMapping("/**");
    }

    @Test
    public void testMainApp() {
        assertDoesNotThrow(() -> {
            ApibibliotecaApplication app = new ApibibliotecaApplication();
            assertNotNull(app);
        });
    }
}
