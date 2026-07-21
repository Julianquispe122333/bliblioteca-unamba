package com.epiis.apibiblioteca.entity;

import java.util.Date;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tbook")
@Setter
@Getter
public class EntityBook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idBook")
    private Integer idBook;

    @Column(name = "idCategory")
    private Integer idCategory;

    @Column(name = "idAuthor")
    private Integer idAuthor;

    @Column(name = "idUser")
    private Integer idUser;

    @Column(name = "title")
    private String title;

    @Column(name = "totalCopies")
    private Integer totalCopies;

    @Column(name = "availableCopies")
    private Integer availableCopies;

    @Column(name = "description")
    private String description;

    @Column(name = "image")
    private String image;

    @Column(name = "createdAt")
    private Date createdAt;

    @Column(name = "updatedAt")
    private Date updatedAt;

    @ManyToOne
    @JoinColumn(name = "idCategory", insertable = false, updatable = false)
    private EntityCategory category;

    @ManyToOne
    @JoinColumn(name = "idAuthor", insertable = false, updatable = false)
    private EntityAuthor author;

    @OneToOne(mappedBy = "book")
    private EntityBookFile bookFile;
}
