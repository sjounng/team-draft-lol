package com.example.teamdraftlol.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @SuppressWarnings("null")
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:3000", // 개발 환경
                    "https://lol-team-draft-frontend-h3rqtkrlv-junwoo-songs-projects.vercel.app", // Vercel 프론트엔드
                    "https://lol-team-draft-frontend.vercel.app" // Vercel 프론트엔드 (짧은 URL)
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
} 