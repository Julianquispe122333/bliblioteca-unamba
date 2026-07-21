package com.epiis.apibiblioteca.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.epiis.apibiblioteca.entity.EntityLoan;
import java.util.List;
import java.util.Optional;

@Repository
public interface RepositoryLoan extends JpaRepository<EntityLoan, Integer> {
    Optional<EntityLoan> findByIdReservation(Integer idReservation);
    List<EntityLoan> findByReservation_IdUserOrderByCreatedAtDesc(Integer idUser);
}
