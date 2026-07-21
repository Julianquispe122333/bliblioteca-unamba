package com.epiis.apibiblioteca.entity;

import java.util.Date;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tloan")
@Setter
@Getter
public class EntityLoan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idLoan")
    private Integer idLoan;

    @Column(name = "idReservation")
    private Integer idReservation;

    @Column(name = "idUser")
    private Integer idUser; // Bibliotecario

    @Column(name = "loanDate")
    private Date loanDate;

    @Column(name = "dueDate")
    private Date dueDate;

    @Column(name = "returnDate")
    private Date returnDate;

    @Column(name = "status")
    private String status; // 'Prestado', 'Devuelto', 'Vencido'

    @Column(name = "createdAt")
    private Date createdAt;

    @Column(name = "updatedAt")
    private Date updatedAt;

    @ManyToOne
    @JoinColumn(name = "idReservation", insertable = false, updatable = false)
    private EntityReservation reservation;

    @ManyToOne
    @JoinColumn(name = "idUser", insertable = false, updatable = false)
    private EntityUser librarian;
}
