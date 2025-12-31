package com.vn.mxh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

@EnableWebMvc
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

    @Bean
    public SpringResourceTemplateResolver customTemplateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        // Bạn có thể đổi đường dẫn này, ví dụ: "classpath:/static/views/" hoặc
        // "classpath:/mail/"
        resolver.setPrefix("/WEB-INF/view/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setOrder(1); // Tìm ở đây sau khi không thấy trong templates
        resolver.setCheckExistence(true);
        return resolver;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Map /client/** to /resources/client/
        registry.addResourceHandler("/client/**")
                .addResourceLocations("/resources/client/");
        
        // Map /auth/** to /resources/auth/
        registry.addResourceHandler("/auth/**")
                .addResourceLocations("/resources/auth/");
        
        // Map /admin/** to /resources/admin/
        registry.addResourceHandler("/admin/**")
                .addResourceLocations("/resources/admin/");
        
        // Map /resources/** for any other static files
        registry.addResourceHandler("/resources/**")
                .addResourceLocations("/resources/");
        
        // Map uploads folder from filesystem
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}