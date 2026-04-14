package com.junseok.ocmaru.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.StringUtils;

/**
 * Actuator(헬스 제외)에 HTTP Basic 인증. {@code app.actuator.metrics.password} 미설정 시
 * 기존과 같이 actuator 전체를 열어 둠(Prometheus 로컬 개발 등).
 */
@Configuration
@Profile("!worker")
public class ActuatorBasicAuthSecurityConfiguration {

  @Bean
  @Order(1)
  public SecurityFilterChain actuatorBasicAuthSecurityFilterChain(
    HttpSecurity http,
    @Value("${app.actuator.metrics.username:prometheus}") String username,
    @Value("${app.actuator.metrics.password:}") String password
  ) throws Exception {
    http.securityMatcher("/actuator/**").csrf(AbstractHttpConfigurer::disable);

    if (!StringUtils.hasText(password)) {
      http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
      return http.build();
    }

    UserDetails user =
      User
        .withUsername(username)
        .password("{noop}" + password)
        .roles("ACTUATOR_METRICS")
        .build();
    InMemoryUserDetailsManager userDetailsService = new InMemoryUserDetailsManager(
      user
    );

    http
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers("/actuator/health", "/actuator/health/**")
          .permitAll()
          .anyRequest()
          .hasRole("ACTUATOR_METRICS")
      )
      .httpBasic(basic -> {})
      .userDetailsService(userDetailsService);

    return http.build();
  }
}
