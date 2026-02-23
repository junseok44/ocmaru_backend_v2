package com.junseok.ocmaru.global.config;

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

  public SecurityConfig(
    OAuth2Config.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler
  ) {
    this.oAuth2AuthenticationSuccessHandler =
      oAuth2AuthenticationSuccessHandler;
  }

  /** 세션 기반 인증: 로그인 성공 시 SecurityContext가 HttpSession에 저장됨. */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {
    http
      .csrf(AbstractHttpConfigurer::disable)
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers(
            "/auth/**",
            "/oauth2/authorization/**",
            "/login/oauth2/code/**"
          )
          .permitAll()
          .requestMatchers("/admin/**")
          .hasAnyRole("ADMIN")
          .anyRequest()
          .authenticated()
      )
      .oauth2Login(oauth2 -> {
        oauth2.successHandler(oAuth2AuthenticationSuccessHandler);
      });
    return http.build();
  }
}
