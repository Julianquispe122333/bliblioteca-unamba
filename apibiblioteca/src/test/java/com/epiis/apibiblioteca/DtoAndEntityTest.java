package com.epiis.apibiblioteca;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Collections;
import java.util.Date;

import org.junit.jupiter.api.Test;

import com.epiis.apibiblioteca.dto.request.*;
import com.epiis.apibiblioteca.dto.response.*;
import com.epiis.apibiblioteca.entity.*;
import com.epiis.apibiblioteca.generic.*;

public class DtoAndEntityTest {

    @Test
    public void testRequests() {
        RequestAuthorSave r1 = new RequestAuthorSave();
        r1.setIdAuthor(1);
        r1.setFirstName("First");
        r1.setSurName("Sur");
        assertEquals(1, r1.getIdAuthor());
        assertEquals("First", r1.getFirstName());
        assertEquals("Sur", r1.getSurName());

        RequestBookSave r2 = new RequestBookSave();
        r2.setIdBook(1);
        r2.setIdCategory(2);
        r2.setIdAuthor(3);
        r2.setTitle("Title");
        r2.setCategoryName("Cat");
        r2.setAuthorName("Auth");
        r2.setTotalCopies(10);
        r2.setAvailableCopies(5);
        r2.setDescription("Desc");
        r2.setImage("Img");
        r2.setHasPdf(true);
        assertEquals(1, r2.getIdBook());
        assertEquals(2, r2.getIdCategory());
        assertEquals(3, r2.getIdAuthor());
        assertEquals("Title", r2.getTitle());
        assertEquals("Cat", r2.getCategoryName());
        assertEquals("Auth", r2.getAuthorName());
        assertEquals(10, r2.getTotalCopies());
        assertEquals(5, r2.getAvailableCopies());
        assertEquals("Desc", r2.getDescription());
        assertEquals("Img", r2.getImage());
        assertTrue(r2.getHasPdf());

        RequestCategorySave r3 = new RequestCategorySave();
        r3.setIdCategory(1);
        r3.setName("Cat");
        assertEquals(1, r3.getIdCategory());
        assertEquals("Cat", r3.getName());

        RequestLoanCreate r4 = new RequestLoanCreate();
        r4.setReservationCode("RES1");
        assertEquals("RES1", r4.getReservationCode());

        RequestLoanReturn r5 = new RequestLoanReturn();
        r5.setReservationCode("RES2");
        r5.setBooksReturningNow(Collections.singletonList("Book1"));
        assertEquals("RES2", r5.getReservationCode());
        assertEquals(1, r5.getBooksReturningNow().size());

        RequestLogin r6 = new RequestLogin();
        r6.setEmail("e@m.com");
        r6.setCode("123");
        r6.setRole("admin");
        assertEquals("e@m.com", r6.getEmail());
        assertEquals("123", r6.getCode());
        assertEquals("admin", r6.getRole());

        RequestReservationCreate r7 = new RequestReservationCreate();
        r7.setStudentName("Student");
        r7.setUniversityCode("U123");
        r7.setEmail("s@m.com");
        r7.setBookTitles(Collections.singletonList("B1"));
        assertEquals("Student", r7.getStudentName());
        assertEquals("U123", r7.getUniversityCode());
        assertEquals("s@m.com", r7.getEmail());
        assertEquals(1, r7.getBookTitles().size());
    }

    @Test
    public void testResponses() {
        ResponseBook r1 = new ResponseBook();
        r1.setIdBook(1);
        r1.setIdCategory(2);
        r1.setIdAuthor(3);
        r1.setTitle("T");
        r1.setAuthorName("A");
        r1.setCategoryName("C");
        r1.setTotalCopies(5);
        r1.setAvailableCopies(2);
        r1.setDescription("D");
        r1.setImage("I");
        r1.setHasPdf(false);
        assertEquals(1, r1.getIdBook());
        assertEquals(2, r1.getIdCategory());
        assertEquals(3, r1.getIdAuthor());
        assertEquals("T", r1.getTitle());
        assertEquals("A", r1.getAuthorName());
        assertEquals("C", r1.getCategoryName());
        assertEquals(5, r1.getTotalCopies());
        assertEquals(2, r1.getAvailableCopies());
        assertEquals("D", r1.getDescription());
        assertEquals("I", r1.getImage());
        assertFalse(r1.getHasPdf());

        ResponseLoan r2 = new ResponseLoan();
        r2.setIdLoan(1);
        r2.setReservationCode("RC");
        r2.setBookTitle("BT");
        r2.setStudentName("SN");
        r2.setLoanDate("LD");
        r2.setDueDate("DD");
        r2.setReturnDate("RD");
        r2.setStatus("ST");
        r2.setLoanBooks(Collections.emptyList());
        assertEquals(1, r2.getIdLoan());
        assertEquals("RC", r2.getReservationCode());
        assertEquals("BT", r2.getBookTitle());
        assertEquals("SN", r2.getStudentName());
        assertEquals("LD", r2.getLoanDate());
        assertEquals("DD", r2.getDueDate());
        assertEquals("RD", r2.getReturnDate());
        assertEquals("ST", r2.getStatus());
        assertNotNull(r2.getLoanBooks());

        ResponseLoanBook r3 = new ResponseLoanBook();
        r3.setTitle("T");
        r3.setReturned(true);
        assertEquals("T", r3.getTitle());
        assertTrue(r3.getReturned());

        ResponseLogin r4 = new ResponseLogin();
        r4.setIdUser(1);
        r4.setUsername("User");
        r4.setRole("admin");
        r4.setCorreo("a@m.com");
        r4.setCodigo("U1");
        r4.setToken("tok");
        assertEquals(1, r4.getIdUser());
        assertEquals("User", r4.getUsername());
        assertEquals("admin", r4.getRole());
        assertEquals("a@m.com", r4.getCorreo());
        assertEquals("U1", r4.getCodigo());
        assertEquals("tok", r4.getToken());

        ResponseReservation r5 = new ResponseReservation();
        r5.setIdReservation(1);
        r5.setCode("C");
        r5.setStudentName("S");
        r5.setUniversityCode("U");
        r5.setEmail("E");
        r5.setBookTitle("B");
        r5.setStatus("St");
        r5.setExpirationDate("Exp");
        r5.setCreatedAt("Cr");
        assertEquals(1, r5.getIdReservation());
        assertEquals("C", r5.getCode());
        assertEquals("S", r5.getStudentName());
        assertEquals("U", r5.getUniversityCode());
        assertEquals("E", r5.getEmail());
        assertEquals("B", r5.getBookTitle());
        assertEquals("St", r5.getStatus());
        assertEquals("Exp", r5.getExpirationDate());
        assertEquals("Cr", r5.getCreatedAt());
    }

    @Test
    public void testEntities() {
        Date now = new Date();
        EntityAuthor e1 = new EntityAuthor();
        e1.setIdAuthor(1);
        e1.setFirstName("F");
        e1.setSurName("S");
        e1.setCreatedAt(now);
        e1.setUpdatedAt(now);
        assertEquals(1, e1.getIdAuthor());
        assertEquals("F", e1.getFirstName());
        assertEquals("S", e1.getSurName());

        EntityBook e2 = new EntityBook();
        e2.setIdBook(1);
        e2.setIdCategory(2);
        e2.setIdAuthor(3);
        e2.setIdUser(4);
        e2.setTitle("T");
        e2.setTotalCopies(10);
        e2.setAvailableCopies(5);
        e2.setDescription("D");
        e2.setImage("I");
        e2.setCategory(new EntityCategory());
        e2.setAuthor(new EntityAuthor());
        e2.setBookFile(new EntityBookFile());
        e2.setCreatedAt(now);
        e2.setUpdatedAt(now);
        assertEquals(1, e2.getIdBook());
        assertNotNull(e2.getCategory());
        assertNotNull(e2.getAuthor());
        assertNotNull(e2.getBookFile());

        EntityBookFile e3 = new EntityBookFile();
        e3.setIdBookFile(1);
        e3.setIdBook(2);
        e3.setName("N");
        e3.setExtension("E");
        e3.setCreatedAt(now);
        e3.setUpdatedAt(now);
        assertEquals(1, e3.getIdBookFile());
        assertEquals(2, e3.getIdBook());

        EntityCategory e4 = new EntityCategory();
        e4.setIdCategory(1);
        e4.setName("N");
        e4.setCreatedAt(now);
        e4.setUpdatedAt(now);
        assertEquals(1, e4.getIdCategory());

        EntityLoan e5 = new EntityLoan();
        e5.setIdLoan(1);
        e5.setIdReservation(2);
        e5.setIdUser(3);
        e5.setLoanDate(now);
        e5.setDueDate(now);
        e5.setReturnDate(now);
        e5.setStatus("S");
        e5.setReservation(new EntityReservation());
        e5.setCreatedAt(now);
        e5.setUpdatedAt(now);
        assertEquals(1, e5.getIdLoan());
        assertNotNull(e5.getReservation());

        EntityReservation e6 = new EntityReservation();
        e6.setIdReservation(1);
        e6.setIdUser(2);
        e6.setIdBook(3);
        e6.setCode("C");
        e6.setStatus("S");
        e6.setExpirationDate(now);
        e6.setBook(new EntityBook());
        e6.setUser(new EntityUser());
        e6.setCreatedAt(now);
        e6.setUpdatedAt(now);
        assertEquals(1, e6.getIdReservation());
        assertNotNull(e6.getBook());
        assertNotNull(e6.getUser());

        EntityUser e7 = new EntityUser();
        e7.setIdUser(1);
        e7.setFirstName("F");
        e7.setSurName("S");
        e7.setEmail("E");
        e7.setUniversityCode("U");
        e7.setRole("R");
        e7.setCreatedAt(now);
        e7.setUpdatedAt(now);
        assertEquals(1, e7.getIdUser());
        assertEquals("F", e7.getFirstName());
    }

    @Test
    public void testGenericResponses() {
        ResponseDataGeneric<String> dg = new ResponseDataGeneric<>("data");
        dg.success();
        assertEquals("success", dg.getType());
        assertEquals("data", dg.getData());

        dg.warning();
        assertEquals("warning", dg.getType());

        dg.exception();
        assertEquals("exception", dg.getType());

        dg.error();
        assertEquals("error", dg.getType());
        dg.getListMessage().add("msg");
        assertEquals(1, dg.getListMessage().size());
    }
}
