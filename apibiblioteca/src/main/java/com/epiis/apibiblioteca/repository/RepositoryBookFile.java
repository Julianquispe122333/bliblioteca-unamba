package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityBookFile;
import java.util.Optional;

@Repository
public interface RepositoryBookFile extends JpaRepository<EntityBookFile, Integer> {
    Optional<EntityBookFile> findByIdBook(Integer idBook);
}
