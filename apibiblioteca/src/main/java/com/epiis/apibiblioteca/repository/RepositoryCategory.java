package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityCategory;
import java.util.Optional;

@Repository
public interface RepositoryCategory extends JpaRepository<EntityCategory, Integer> {
    Optional<EntityCategory> findByName(String name);
}
