package com.mybillbuddy.api.controller;

import com.mybillbuddy.api.model.StockMovement;
import com.mybillbuddy.api.service.StockMovementService;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {
    private final StockMovementService service;
    public StockMovementController(StockMovementService service) { this.service = service; }
    @GetMapping public List<StockMovement> getAll(Principal user) { return service.getAll(user.getName()); }
    @PostMapping public StockMovement restore(@RequestBody StockMovement movement, Principal user) { return service.restore(movement, user.getName()); }
}
