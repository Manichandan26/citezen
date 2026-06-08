package com.research.assistant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class ResearchService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }


    public String getResearch(ResearchRequest researchRequest) {
        //Build the prompt
        String prompt = BuildPrompt(researchRequest);
        //Query the AI model API
        Map<String, Object> requestBody = Map.of(
                "contents",new Object[]{
                        Map.of("parts",new Object[]{
                                Map.of("text",prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiApiUrl+geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();
        //Parse the response
        //Return response
        return extractText(response);
    }

    private String extractText(String response) {
        try{
            GeminiResponse geminiResponse = objectMapper.readValue(response, GeminiResponse.class);
            if(geminiResponse.getCandidates()!=null && !geminiResponse.getCandidates().isEmpty()){
                GeminiResponse.Candidate firstCandidate = geminiResponse.getCandidates().get(0);
                if(firstCandidate.getContent()!=null && firstCandidate.getContent().getParts()!=null &&
                        !firstCandidate.getContent().getParts().isEmpty()){
                    return firstCandidate.getContent().getParts().get(0).getText();
                }
            }
            return "No research found";

        } catch (Exception e) {
            if (e.getMessage().contains("429")) {

                            return """
            Citezen is currently handling too many AI requests.
            Please wait a few seconds and try again.
            """;
            }
            return "Error parsing"+e.getMessage();
        }
    }

    private String BuildPrompt(ResearchRequest request) {
        StringBuilder prompt = new StringBuilder();

        if (request.getSelectedContext() != null && !request.getSelectedContext().isEmpty()) {
            prompt.append("""
            Selected Context:
            ----------------
            """);

            prompt.append(request.getSelectedContext());
            prompt.append("\n\n");
        }

        if (request.getConversationHistory() != null && !request.getConversationHistory().isEmpty()) {

            prompt.append("""
            Conversation History:
            ---------------------
            """);

            for (String msg : request.getConversationHistory()) {
                prompt.append(msg).append("\n");
            }
            prompt.append("\n");
        }

        switch (request.getOperation()) {
            case "summarize":
                prompt.append("""
                Task:
                Provide a concise summary
                of the selected text.
                
                """);
                break;

            case "explain":
                prompt.append("""
                Task:
                Explain the selected text
                in a beginner-friendly way.
                
                """);
                break;

            case "keypoints":
                prompt.append("""
                Task:
                Extract key points using
                clear bullet points.
                
                """);

                break;

            case "answer":
                prompt.append("""           
                Task:
                give the answer for the question.only answer and don't explain.
                """);
                break;

            case "chat":
                prompt.append("""
                Task:
                Respond conversationally
                to the user's message.
                
                """);
                break;
        }

        prompt.append("""
        User Message:
        -------------
        """);

        prompt.append(request.getMessage());
        return prompt.toString();
    }
}
