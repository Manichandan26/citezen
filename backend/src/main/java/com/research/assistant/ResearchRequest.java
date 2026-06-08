package com.research.assistant;

import lombok.Data;

import java.util.List;

@Data
public class ResearchRequest {
    private String message;
    private String selectedContext;
    private String operation;
    private List<String> conversationHistory;
}