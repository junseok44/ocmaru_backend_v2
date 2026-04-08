package com.junseok.ocmaru.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * 클러스터 생성 워커 전용 프로필: 내부 워커 API·헬스만 허용, 그 외 URL은 거부.
 * <p>
 * 동일 JAR을 메인 API와 워커에 배포할 때 {@code spring.profiles.active} 에 {@code worker} 를
 * 포함해 실행합니다. {@link com.junseok.ocmaru.global.security.InternalWorkerApiKeyFilter} 로
 * {@code X-Internal-Api-Key} 검증을 수행합니다.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("worker")
public class WorkerSecurityConfig {

  @Bean
  @Order(1)
  public SecurityFilterChain workerSecurityFilterChain(HttpSecurity http)
    throws Exception {
    http
      .securityMatcher("/**")
      .csrf(AbstractHttpConfigurer::disable)
      .httpBasic(AbstractHttpConfigurer::disable)
      .formLogin(AbstractHttpConfigurer::disable)
      .logout(AbstractHttpConfigurer::disable)
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers("/api/internal/worker/**", "/actuator/health")
          .permitAll()
          .anyRequest()
          .denyAll()
      );
    return http.build();
  }
}
