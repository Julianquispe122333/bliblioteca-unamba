package com.epiis.apibiblioteca.business;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import com.epiis.apibiblioteca.dto.request.RequestBookSave;
import com.epiis.apibiblioteca.dto.response.ResponseBook;
import com.epiis.apibiblioteca.entity.*;
import com.epiis.apibiblioteca.generic.ResponseDataGeneric;
import com.epiis.apibiblioteca.repository.*;

public class BusinessBookTest {

    @Mock
    private RepositoryBook repositoryBook;
    @Mock
    private RepositoryCategory repositoryCategory;
    @Mock
    private RepositoryAuthor repositoryAuthor;
    @Mock
    private RepositoryBookFile repositoryBookFile;

    @InjectMocks
    private BusinessBook businessBook;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAll() {
        EntityBook book = new EntityBook();
        book.setIdBook(1);
        book.setTitle("Libro Test");
        book.setTotalCopies(5);
        book.setAvailableCopies(5);

        EntityCategory cat = new EntityCategory();
        cat.setName("Ficción");
        book.setCategory(cat);

        EntityAuthor auth = new EntityAuthor();
        auth.setFirstName("Gabriel");
        auth.setSurName("García");
        book.setAuthor(auth);

        when(repositoryBook.findAll()).thenReturn(Arrays.asList(book));

        ResponseDataGeneric<List<ResponseBook>> res = businessBook.getAll();

        assertEquals("success", res.getType());
        assertEquals(1, res.getData().size());
        assertEquals("Libro Test", res.getData().get(0).getTitle());
        assertEquals("Ficción", res.getData().get(0).getCategoryName());
        assertEquals("Gabriel García", res.getData().get(0).getAuthorName());
    }

    @Test
    public void testGetAllEmptyAuthorCategory() {
        EntityBook book = new EntityBook();
        book.setIdBook(2);
        book.setTitle("Libro Sin Cat");

        when(repositoryBook.findAll()).thenReturn(Arrays.asList(book));

        ResponseDataGeneric<List<ResponseBook>> res = businessBook.getAll();

        assertEquals("success", res.getType());
        assertEquals("Sin Categoría", res.getData().get(0).getCategoryName());
        assertEquals("Desconocido", res.getData().get(0).getAuthorName());
    }

    @Test
    public void testSaveValidationErrors() {
        RequestBookSave req = new RequestBookSave();
        req.setAvailableCopies(10);
        req.setTotalCopies(5);

        ResponseDataGeneric<ResponseBook> res = businessBook.save(req);
        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("Las copias disponibles no pueden superar las copias totales"));

        req.setAvailableCopies(5);
        req.setTitle(null);
        res = businessBook.save(req);
        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("El título del libro es obligatorio"));
    }

    @Test
    public void testSaveNewBookWithNamesCreatingCategoryAndAuthor() {
        RequestBookSave req = new RequestBookSave();
        req.setTitle("Nuevo Libro");
        req.setAvailableCopies(3);
        req.setTotalCopies(3);
        req.setCategoryName("Nueva Categoria");
        req.setAuthorName("Gabriel Garcia Marquez");
        req.setHasPdf(true);

        when(repositoryCategory.findByName("Nueva Categoria")).thenReturn(Optional.empty());
        EntityCategory savedCat = new EntityCategory();
        savedCat.setIdCategory(10);
        savedCat.setName("Nueva Categoria");
        when(repositoryCategory.save(any())).thenReturn(savedCat);

        when(repositoryAuthor.findByFirstNameAndSurName("Gabriel", "Garcia Marquez")).thenReturn(Optional.empty());
        EntityAuthor savedAuth = new EntityAuthor();
        savedAuth.setIdAuthor(20);
        savedAuth.setFirstName("Gabriel");
        savedAuth.setSurName("Garcia Marquez");
        when(repositoryAuthor.save(any())).thenReturn(savedAuth);

        EntityBook savedBook = new EntityBook();
        savedBook.setIdBook(100);
        savedBook.setTitle("Nuevo Libro");
        savedBook.setCategory(savedCat);
        savedBook.setAuthor(savedAuth);

        when(repositoryBook.save(any())).thenReturn(savedBook);
        when(repositoryBook.findById(100)).thenReturn(Optional.of(savedBook));
        when(repositoryBookFile.findByIdBook(100)).thenReturn(Optional.empty());

        ResponseDataGeneric<ResponseBook> res = businessBook.save(req);

        assertEquals("success", res.getType());
        assertEquals("Nuevo Libro", res.getData().getTitle());
        verify(repositoryBookFile).save(any());
    }

    @Test
    public void testSaveUpdateExistingBookNotFound() {
        RequestBookSave req = new RequestBookSave();
        req.setIdBook(999);
        req.setTitle("Libro Inexistente");

        when(repositoryBook.findById(999)).thenReturn(Optional.empty());

        ResponseDataGeneric<ResponseBook> res = businessBook.save(req);
        assertEquals("error", res.getType());
        assertTrue(res.getListMessage().contains("El libro no existe"));
    }

    @Test
    public void testSaveUpdateExistingBookSuccess() {
        RequestBookSave req = new RequestBookSave();
        req.setIdBook(1);
        req.setTitle("Libro Editado");
        req.setIdCategory(2);
        req.setIdAuthor(3);
        req.setHasPdf(false);

        EntityBook existing = new EntityBook();
        existing.setIdBook(1);
        existing.setTitle("Libro Antiguo");

        when(repositoryBook.findById(1)).thenReturn(Optional.of(existing));
        when(repositoryBook.save(any())).thenReturn(existing);
        
        EntityBookFile existingFile = new EntityBookFile();
        when(repositoryBookFile.findByIdBook(1)).thenReturn(Optional.of(existingFile));

        ResponseDataGeneric<ResponseBook> res = businessBook.save(req);
        assertEquals("success", res.getType());
        verify(repositoryBookFile).delete(existingFile);
    }

    @Test
    public void testDeleteSuccessAndFailure() {
        when(repositoryBook.existsById(1)).thenReturn(true);
        ResponseDataGeneric<Boolean> res1 = businessBook.delete(1);
        assertEquals("success", res1.getType());
        assertTrue(res1.getData());

        when(repositoryBook.existsById(2)).thenReturn(false);
        ResponseDataGeneric<Boolean> res2 = businessBook.delete(2);
        assertEquals("error", res2.getType());
        assertFalse(res2.getData());
    }
}
