package com.junseok.ocmaru.global.resolver;

import com.junseok.ocmaru.domain.auth.AuthPrincipal;
import com.junseok.ocmaru.global.annotation.CurrentUser;
import com.junseok.ocmaru.global.exception.UnauthorizedException;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

public class CurrentUserArgumentResolver
  implements HandlerMethodArgumentResolver {

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return (
      parameter.hasParameterAnnotation(CurrentUser.class) &&
      AuthPrincipal.class.isAssignableFrom(parameter.getParameterType())
    );
  }

  @Override
  public Object resolveArgument(
    MethodParameter parameter,
    ModelAndViewContainer mavContainer,
    NativeWebRequest webRequest,
    WebDataBinderFactory binderFactory
  ) {
    Authentication authentication = SecurityContextHolder
      .getContext()
      .getAuthentication();
    if (
      authentication == null ||
      !authentication.isAuthenticated() ||
      authentication.getPrincipal() instanceof String
    ) {
      throw new UnauthorizedException("로그인이 필요합니다.");
    }
    return authentication.getPrincipal();
  }
}
