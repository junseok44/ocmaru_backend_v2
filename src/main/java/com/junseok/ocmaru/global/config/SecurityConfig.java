package com.junseok.ocmaru.global.config;

import com.junseok.ocmaru.global.security.JwtAuthenticationConverter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("!worker")
public class SecurityConfig {

  private final ObjectProvider<OAuth2AuthenticationSuccessHandler>
    oAuth2AuthenticationSuccessHandlerProvider;
  private final JwtAuthenticationConverter jwtAuthenticationConverter;

  public SecurityConfig(
    ObjectProvider<OAuth2AuthenticationSuccessHandler> oAuth2AuthenticationSuccessHandlerProvider,
    JwtAuthenticationConverter jwtAuthenticationConverter
  ) {
    this.oAuth2AuthenticationSuccessHandlerProvider =
      oAuth2AuthenticationSuccessHandlerProvider;
    this.jwtAuthenticationConverter = jwtAuthenticationConverter;
  }

  /** JWT 기반 인증: Bearer 토큰을 검증해서 SecurityContext를 구성. */
  @Bean
  @Order(2)
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
            "/oauth2/authorization/**",
            "/login/oauth2/code/**",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
          )
          .permitAll()
          .requestMatchers("/api/admin/**")
          .hasAnyRole("ADMIN")
          // .requestMatchers("/api/**")
          // .authenticated()
          .anyRequest()
          .permitAll()
      );

    OAuth2AuthenticationSuccessHandler oAuth2Handler =
      oAuth2AuthenticationSuccessHandlerProvider.getIfAvailable();
    if (oAuth2Handler != null) {
      http.oauth2Login(oauth2 -> oauth2.successHandler(oAuth2Handler));
    }

    http.oauth2ResourceServer(oauth2 ->
      oauth2.jwt(jwt ->
        jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)
      )
    );
    return http.build();
  }
}
