package com.junseok.ocmaru.domain.user;

import com.junseok.ocmaru.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.crypto.password.PasswordEncoder;

// unique, insertable, updatable, nullabale, length, name
// nullable, unique, default.

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "users")
public class User extends BaseEntity {

  @Column(nullable = false, unique = true)
  private String email;

  private String password;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AuthProvider authProvider = AuthProvider.LOCAL;

  @Getter
  private String provderId;

  @Getter
  @Setter
  @Column(nullable = false, length = 20)
  private String displayName;

  @Getter
  @Setter
  private String avatarUrl;

  @Getter
  private boolean isAdmin = false;

  public User(String email, String provderId, AuthProvider authProvider) {
    this.email = email;
    this.authProvider = authProvider;
    this.provderId = provderId;
    this.displayName = generatedRandomDisplayName();
  }

  public User(
    String email,
    String provderId,
    AuthProvider authProvider,
    String displayName
  ) {
    this.email = email;
    this.authProvider = authProvider;
    this.provderId = provderId;
    this.displayName = displayName;
  }

  // for local register.
  public User(String email, String password) {
    this.email = email;
    this.password = password;
    this.authProvider = AuthProvider.LOCAL;
    this.displayName = generatedRandomDisplayName();
  }

  // for local register.
  public User(String email, String password, String displayName) {
    this.email = email;
    this.password = password;
    this.authProvider = AuthProvider.LOCAL;
    this.displayName = displayName;
  }

  public String getEmail() {
    return email;
  }

  public boolean matchesPassword(PasswordEncoder encoder, String rawPassword) {
    return password != null && encoder.matches(rawPassword, password);
  }

  private String generatedRandomDisplayName() {
    return "일반유저" + UUID.randomUUID().toString().substring(0, 10);
  }
}
