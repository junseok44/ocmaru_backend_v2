package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.security.JwtAuthenticationConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final OAuth2Config.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;
  private final JwtAuthenticationConverter jwtAuthenticationConverter;

  public SecurityConfig(
    OAuth2Config.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler,
    JwtAuthenticationConverter jwtAuthenticationConverter
  ) {
    this.oAuth2AuthenticationSuccessHandler =
      oAuth2AuthenticationSuccessHandler;
    this.jwtAuthenticationConverter = jwtAuthenticationConverter;
  }

  /** JWT 기반 인증: Bearer 토큰을 검증해서 SecurityContext를 구성. */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {
    http
      .csrf(AbstractHttpConfigurer::disable)
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers(
            "/",
            "/index.html",
            "/assets/**",
            "/*.png",
            "/*.svg",
            "/*.ico",
            "/api/auth/**",
            "/actuator/health",
            "/actuator/info",
            "/actuator/prometheus",
            "/oauth2/authorization/**",
            "/login/oauth2/code/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
          )
          .permitAll()
          .requestMatchers("/api/admin/**")
          .hasAnyRole("ADMIN")
          .requestMatchers("/api/**")
          .authenticated()
          .anyRequest()
          .permitAll()
      )
      .oauth2Login(oauth2 -> {
        oauth2.successHandler(oAuth2AuthenticationSuccessHandler);
      })
      .oauth2ResourceServer(oauth2 ->
        oauth2.jwt(jwt ->
          jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)
        )
      );
    return http.build();
  }
}
