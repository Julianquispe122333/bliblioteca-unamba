package com.epiis.apibiblioteca.business;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import com.epiis.apibiblioteca.dto.request.RequestBookSave;
import com.epiis.apibiblioteca.dto.response.ResponseBook;
import com.epiis.apibiblioteca.entity.EntityAuthor;
import com.epiis.apibiblioteca.entity.EntityBook;
import com.epiis.apibiblioteca.entity.EntityBookFile;
import com.epiis.apibiblioteca.entity.EntityCategory;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.RepositoryAuthor;
import com.epiis.apibiblioteca.repository.RepositoryBook;
import com.epiis.apibiblioteca.repository.RepositoryBookFile;
import com.epiis.apibiblioteca.repository.RepositoryCategory;

@Service
public class BusinessBook {
    private final RepositoryBook repositoryBook;
    private final RepositoryCategory repositoryCategory;
    private final RepositoryAuthor repositoryAuthor;
    private final RepositoryBookFile repositoryBookFile;

    public BusinessBook(
        RepositoryBook repositoryBook,
        RepositoryCategory repositoryCategory,
        RepositoryAuthor repositoryAuthor,
        RepositoryBookFile repositoryBookFile
    ) {
        this.repositoryBook = repositoryBook;
        this.repositoryCategory = repositoryCategory;
        this.repositoryAuthor = repositoryAuthor;
        this.repositoryBookFile = repositoryBookFile;
    }

    public ResponseDataGeneric<List<ResponseBook>> getAll() {
        List<EntityBook> list = repositoryBook.findAll();
        List<ResponseBook> responseList = new ArrayList<>();

        for (EntityBook b : list) {
            responseList.add(convertToResponse(b));
        }

        return new ResponseDataGeneric<>(responseList);
    }

    public ResponseDataGeneric<ResponseBook> save(RequestBookSave request) {
        ResponseDataGeneric<ResponseBook> response = new ResponseDataGeneric<>();
        
        // 1. Resolver Categoría
        Integer categoryId = request.getIdCategory();
        if (categoryId == null && request.getCategoryName() != null && !request.getCategoryName().trim().isEmpty()) {
            String catName = request.getCategoryName().trim();
            Optional<EntityCategory> catOpt = repositoryCategory.findByName(catName);
            if (catOpt.isPresent()) {
                categoryId = catOpt.get().getIdCategory();
            } else {
                EntityCategory newCat = new EntityCategory();
                newCat.setName(catName);
                newCat.setCreatedAt(new Date());
                newCat.setUpdatedAt(newCat.getCreatedAt());
                newCat = repositoryCategory.save(newCat);
                categoryId = newCat.getIdCategory();
            }
        }
        if (categoryId == null) {
            categoryId = 1; // Default
        }

        // 2. Resolver Autor
        Integer authorId = request.getIdAuthor();
        if (authorId == null && request.getAuthorName() != null && !request.getAuthorName().trim().isEmpty()) {
            String fullName = request.getAuthorName().trim();
            String[] parts = fullName.split(" ");
            String fName = parts[0];
            String sName = parts.length > 1 ? fullName.substring(fName.length()).trim() : "";

            Optional<EntityAuthor> authOpt = repositoryAuthor.findByFirstNameAndSurName(fName, sName);
            if (authOpt.isPresent()) {
                authorId = authOpt.get().getIdAuthor();
            } else {
                EntityAuthor newAuth = new EntityAuthor();
                newAuth.setFirstName(fName);
                newAuth.setSurName(sName);
                newAuth.setCreatedAt(new Date());
                newAuth.setUpdatedAt(newAuth.getCreatedAt());
                newAuth = repositoryAuthor.save(newAuth);
                authorId = newAuth.getIdAuthor();
            }
        }
        if (authorId == null) {
            authorId = 1; // Default
        }

        EntityBook book;
        if (request.getIdBook() != null && request.getIdBook() > 0) {
            Optional<EntityBook> opt = repositoryBook.findById(request.getIdBook());
            if (opt.isPresent()) {
                book = opt.get();
                book.setUpdatedAt(new Date());
            } else {
                response.error();
                response.listMessage.add("El libro no existe");
                return response;
            }
        } else {
            book = new EntityBook();
            book.setIdUser(1); // Bibliotecario Principal por defecto
            book.setCreatedAt(new Date());
            book.setUpdatedAt(book.getCreatedAt());
        }

        book.setIdCategory(categoryId);
        book.setIdAuthor(authorId);
        book.setTitle(request.getTitle().trim());
        book.setTotalCopies(request.getTotalCopies());
        book.setAvailableCopies(request.getAvailableCopies());
        book.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        book.setImage(request.getImage() != null ? request.getImage() : "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80");

        EntityBook saved = repositoryBook.save(book);
        
        // Manejar archivo PDF si se habilitó
        if (Boolean.TRUE.equals(request.getHasPdf())) {
            Optional<EntityBookFile> fileOpt = repositoryBookFile.findByIdBook(saved.getIdBook());
            if (!fileOpt.isPresent()) {
                EntityBookFile bf = new EntityBookFile();
                bf.setIdBook(saved.getIdBook());
                bf.setName("document.pdf");
                bf.setExtension("pdf");
                bf.setCreatedAt(new Date());
                bf.setUpdatedAt(bf.getCreatedAt());
                repositoryBookFile.save(bf);
            }
        } else {
            Optional<EntityBookFile> fileOpt = repositoryBookFile.findByIdBook(saved.getIdBook());
            fileOpt.ifPresent(repositoryBookFile::delete);
        }

        saved = repositoryBook.findById(saved.getIdBook()).orElse(saved);

        response.setData(convertToResponse(saved));
        response.success();
        response.listMessage.add("Libro guardado correctamente");

        return response;
    }

    public ResponseDataGeneric<Boolean> delete(Integer idBook) {
        ResponseDataGeneric<Boolean> response = new ResponseDataGeneric<>();
        if (repositoryBook.existsById(idBook)) {
            repositoryBook.deleteById(idBook);
            response.setData(true);
            response.success();
            response.listMessage.add("Libro eliminado correctamente");
        } else {
            response.setData(false);
            response.error();
            response.listMessage.add("El libro no existe");
        }
        return response;
    }

    private ResponseBook convertToResponse(EntityBook b) {
        ResponseBook dto = new ResponseBook();
        dto.setIdBook(b.getIdBook());
        dto.setIdCategory(b.getIdCategory());
        dto.setIdAuthor(b.getIdAuthor());
        dto.setTitle(b.getTitle());
        dto.setTotalCopies(b.getTotalCopies());
        dto.setAvailableCopies(b.getAvailableCopies());
        dto.setDescription(b.getDescription());
        dto.setImage(b.getImage());
        dto.setHasPdf(b.getBookFile() != null);

        if (b.getCategory() != null) {
            dto.setCategoryName(b.getCategory().getName());
        } else {
            dto.setCategoryName("Sin Categoría");
        }

        if (b.getAuthor() != null) {
            dto.setAuthorName(b.getAuthor().getFirstName() + " " + b.getAuthor().getSurName());
        } else {
            dto.setAuthorName("Desconocido");
        }

        return dto;
    }
}
