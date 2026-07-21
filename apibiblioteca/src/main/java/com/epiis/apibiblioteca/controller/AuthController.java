package com.epiis.apibiblioteca.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.epiis.apibiblioteca.business.BusinessAuth;
import com.epiis.apibiblioteca.dto.request.RequestLogin;
import com.epiis.apibiblioteca.dto.response.ResponseLogin;
import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "auth")
public class AuthController {
    private final BusinessAuth businessAuth;

    public AuthController(BusinessAuth businessAuth) {
        this.businessAuth = businessAuth;
    }

    @PostMapping(path = "login")
    public ResponseEntity<ResponseLogin> login(@Valid @RequestBody RequestLogin request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            ResponseLogin response = new ResponseLogin();
            response.error();
            bindingResult.getAllErrors().forEach(error -> response.listMessage.add(error.getDefaultMessage()));
            return ResponseEntity.badRequest().body(response);
        }
        ResponseLogin response = businessAuth.login(request);
        if ("error".equalsIgnoreCase(response.getType())) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
