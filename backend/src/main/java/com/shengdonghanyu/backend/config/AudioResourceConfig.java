package com.shengdonghanyu.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class AudioResourceConfig implements WebMvcConfigurer {
    @Value("${audio.storage-dir:./data/audios}") private String audioStorageDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(audioStorageDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/audios/**")
                .addResourceLocations(location.endsWith("/") ? location : location + "/");
    }
}
