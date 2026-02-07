package com.junseok.ocmaru.domain.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
  @Query("select u from User u where u.email = :email")
  public Optional<User> findByEmail(@Param("email") String email);
}
