package com.research.assistant;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class ResearchController {

    private final ResearchService researchService;

    @PostMapping("/process")
    public ResponseEntity<String> getResearch(@RequestBody ResearchRequest researchRequest) {
        String result = researchService.getResearch(researchRequest);
        return ResponseEntity.ok(result);
    }
}
