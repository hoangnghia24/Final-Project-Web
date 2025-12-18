package com.vn.mxh.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/css/**").addResourceLocations("/resources/css/");
        registry.addResourceHandler("/js/**").addResourceLocations("/resources/js/");
        registry.addResourceHandler("/images/**").addResourceLocations("/resources/images/");
        registry.addResourceHandler("/client/**").addResourceLocations("/resources/client/");
        registry.addResourceHandler("/auth/**").addResourceLocations("/resources/auth/");
        registry.addResourceHandler("/resources/admin/**").addResourceLocations("/resources/admin/");
    }
}