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
@Table(name = "treservation")
@Setter
@Getter
public class EntityReservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idReservation")
    private Integer idReservation;

    @Column(name = "idUser")
    private Integer idUser;

    @Column(name = "idBook")
    private Integer idBook;

    @Column(name = "code")
    private String code;

    @Column(name = "status")
    private String status; // 'Pendiente', 'Atendido', 'Vencido'

    @Column(name = "expirationDate")
    private Date expirationDate;

    @Column(name = "createdAt")
    private Date createdAt;

    @Column(name = "updatedAt")
    private Date updatedAt;

    @ManyToOne
    @JoinColumn(name = "idUser", insertable = false, updatable = false)
    private EntityUser user;

    @ManyToOne
    @JoinColumn(name = "idBook", insertable = false, updatable = false)
    private EntityBook book;
}
