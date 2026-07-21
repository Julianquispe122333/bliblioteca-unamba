package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityAuthor;
import java.util.Optional;

@Repository
public interface RepositoryAuthor extends JpaRepository<EntityAuthor, Integer> {
    Optional<EntityAuthor> findByFirstNameAndSurName(String firstName, String surName);
}
