package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.resolver.CurrentUserArgumentResolver;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Override
  public void addArgumentResolvers(
    List<HandlerMethodArgumentResolver> resolvers
  ) {
    resolvers.add(new CurrentUserArgumentResolver());
  }
}
