package com.junseok.ocmaru.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  /** 세션 기반 인증: 로그인 성공 시 SecurityContext가 HttpSession에 저장됨. */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {
    http
      .csrf(AbstractHttpConfigurer::disable)
      .authorizeHttpRequests(auth ->
        auth
          .requestMatchers("/auth/**")
          .permitAll()
          .requestMatchers("/admin/**")
          .hasAnyRole("ADMIN")
          .anyRequest()
          .authenticated()
      );
    // .formLogin(form ->
    //   form
    //     .loginPage("/login") // 커스텀 로그인 페이지 경로
    //     .loginProcessingUrl("/login-proc") // <form action="..."> 에 들어갈 URL
    //     .defaultSuccessUrl("/main", true) // 로그인 성공 시 이동할 곳
    //     .permitAll()
    // );
    return http.build();
  }
}
