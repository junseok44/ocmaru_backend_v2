package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.resolver.CurrentUserArgumentResolver;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  private final Path publicRootDir;

  public WebMvcConfig(
    @Value("${app.storage.public-dir:public-objects}") String publicDir
  ) {
    this.publicRootDir = Paths.get(publicDir).toAbsolutePath().normalize();
  }

  @Override
  public void addArgumentResolvers(
    List<HandlerMethodArgumentResolver> resolvers
  ) {
    resolvers.add(new CurrentUserArgumentResolver());
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
      .addResourceHandler("/public-objects/**")
      .addResourceLocations("file:" + publicRootDir.toString() + "/");
    registry
      .addResourceHandler("/**")
      .addResourceLocations(
        "classpath:/static/",
        "classpath:/static/dist/public/"
      );
  }

  @Override
  public void configurePathMatch(PathMatchConfigurer configurer) {
    configurer.addPathPrefix(
      "/api",
      HandlerTypePredicate.forAnnotation(RestController.class)
    );
  }

  @Override
  public void addViewControllers(ViewControllerRegistry registry) {
    registry.addViewController("/").setViewName("forward:/index.html");
    registry
      .addViewController(
        "/{first:^(?!api$|oauth2$|swagger-ui$|v3$|public-objects$|assets$|index\\.html$)[^.]+$}"
      )
      .setViewName("forward:/index.html");
    registry
      .addViewController(
        "/{first:^(?!api$|oauth2$|swagger-ui$|v3$|public-objects$|assets$)[^.]+}/**"
      )
      .setViewName("forward:/index.html");
  }
}
