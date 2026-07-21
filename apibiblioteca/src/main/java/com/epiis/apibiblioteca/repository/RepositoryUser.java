package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityUser;
import java.util.Optional;

@Repository
public interface RepositoryUser extends JpaRepository<EntityUser, Integer> {
    Optional<EntityUser> findByEmail(String email);
    Optional<EntityUser> findByUniversityCode(String universityCode);
}
