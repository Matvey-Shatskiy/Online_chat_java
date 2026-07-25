package com.messenger.repository;

import com.messenger.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    List<User> findByUsernameContainingIgnoreCase(String username);
    Page<User> findByUsernameContainingIgnoreCase(String username, Pageable pageable);
    Page<User> findByUsernameContainingIgnoreCaseAndUuidNot(String username, String uuid, Pageable pageable);
    Page<User> findByUuidNot(String uuid, Pageable pageable);
}