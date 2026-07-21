package com.epiis.apibiblioteca.controller;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.epiis.apibiblioteca.business.BusinessStats;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;

@RestController
@RequestMapping(path = "stats")
public class StatsController {
    private final BusinessStats businessStats;

    public StatsController(BusinessStats businessStats) {
        this.businessStats = businessStats;
    }

    @GetMapping(path = "admin")
    public ResponseEntity<ResponseDataGeneric<Map<String, Object>>> getAdminStats() {
        return ResponseEntity.ok(businessStats.getAdminStats());
    }
}
