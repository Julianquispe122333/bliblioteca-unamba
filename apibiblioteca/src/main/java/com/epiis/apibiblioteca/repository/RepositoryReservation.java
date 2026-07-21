package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityReservation;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepositoryReservation extends JpaRepository<EntityReservation, Integer> {
    Optional<EntityReservation> findByCode(String code);
    List<EntityReservation> findByIdUserOrderByCreatedAtDesc(Integer idUser);
}
