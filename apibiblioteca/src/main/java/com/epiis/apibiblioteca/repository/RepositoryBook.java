package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityBook;
import java.util.Optional;

@Repository
public interface RepositoryBook extends JpaRepository<EntityBook, Integer> {
    Optional<EntityBook> findByTitle(String title);
}
