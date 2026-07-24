DROP DATABASE IF EXISTS dbbiblioteca;
CREATE DATABASE dbbiblioteca;
USE dbbiblioteca;

-- ===========================
-- USUARIOS
-- ===========================

CREATE TABLE tuser(
    idUser INT NOT NULL AUTO_INCREMENT,
    universityCode VARCHAR(20) NOT NULL,
    firstName VARCHAR(50) NOT NULL,
    surName VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT  NULL,
    role VARCHAR(20) NOT NULL, /*Bibliotecario, Estudiante*/
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idUser),
    UNIQUE(universityCode),
    UNIQUE(email)
) ENGINE=INNODB;

-- ===========================
-- AUTORES
-- ===========================

CREATE TABLE tauthor(
    idAuthor INT NOT NULL AUTO_INCREMENT,
    firstName VARCHAR(50) NOT NULL,
    surName VARCHAR(40) NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idAuthor)
) ENGINE=INNODB;

-- ===========================
-- CATEGORÍAS
-- ===========================

CREATE TABLE tcategory(
    idCategory INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idCategory)
) ENGINE=INNODB;

-- ===========================
-- LIBROS
-- ===========================

CREATE TABLE tbook(
    idBook INT NOT NULL AUTO_INCREMENT,
    idCategory INT NOT NULL,
    idAuthor INT NOT NULL,
    idUser INT NOT NULL, /*Bibliotecario que registra el libro*/
    title VARCHAR(150) NOT NULL,
    totalCopies INT NOT NULL,
    availableCopies INT NOT NULL,
    description TEXT NULL,
    image VARCHAR(1000) NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idBook),

    FOREIGN KEY(idCategory)
        REFERENCES tcategory(idCategory)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY(idAuthor)
        REFERENCES tauthor(idAuthor)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY(idUser)
        REFERENCES tuser(idUser)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=INNODB;

-- ===========================
-- ARCHIVO DEL LIBRO (PDF, etc.)
-- ===========================

CREATE TABLE tbookfile(
    idBookFile INT NOT NULL AUTO_INCREMENT,
    idBook INT NOT NULL,
    name VARCHAR(500) NULL,
    extension VARCHAR(10) NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idBookFile),
    UNIQUE(idBook),

    FOREIGN KEY(idBook)
        REFERENCES tbook(idBook)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=INNODB;

-- ===========================
-- RESERVAS
-- ===========================

CREATE TABLE treservation(
    idReservation INT NOT NULL AUTO_INCREMENT,
    idUser INT NOT NULL, /*Estudiante*/
    idBook INT NOT NULL,
    code CHAR(7) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL, /*Pendiente, Atendido, Vencido*/
    expirationDate DATETIME NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idReservation),

    FOREIGN KEY(idUser)
        REFERENCES tuser(idUser)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY(idBook)
        REFERENCES tbook(idBook)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=INNODB;

-- ===========================
-- PRÉSTAMOS
-- ===========================

CREATE TABLE tloan(
    idLoan INT NOT NULL AUTO_INCREMENT,
    idReservation INT NOT NULL,
    idUser INT NOT NULL, /*Bibliotecario que registra el préstamo*/
    loanDate DATETIME NOT NULL,
    dueDate DATETIME NOT NULL,
    returnDate DATETIME NULL,
    status VARCHAR(20) NOT NULL, /*Prestado, Devuelto, Vencido*/
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    PRIMARY KEY(idLoan),

    FOREIGN KEY(idReservation)
        REFERENCES treservation(idReservation)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    FOREIGN KEY(idUser)
        REFERENCES tuser(idUser)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=INNODB;

-- ===========================
-- DATOS INICIALES
-- ===========================

-- 1. Usuarios Iniciales
INSERT INTO tuser(universityCode, firstName, surName, email, role, createdAt, updatedAt)
VALUES
('ADMIN001', 'Administrador', 'Principal', 'admin@unamba.edu.pe', 'Bibliotecario', NOW(), NOW()),
('2024001', 'Juan', 'Pérez', 'juan@unamba.edu.pe', 'Estudiante', NOW(), NOW()),
('2024002', 'María', 'Gómez', 'maria@unamba.edu.pe', 'Estudiante', NOW(), NOW()),
('2024003', 'Carlos', 'López', 'carlos@unamba.edu.pe', 'Estudiante', NOW(), NOW()),
('2024004', 'Ana', 'Torres', 'ana@unamba.edu.pe', 'Estudiante', NOW(), NOW()),
('2024005', 'Luis', 'Flores', 'luis@unamba.edu.pe', 'Estudiante', NOW(), NOW());

-- 2. Categorías Iniciales
INSERT INTO tcategory (idCategory, name, createdAt, updatedAt) VALUES
(1, 'Sistemas', NOW(), NOW()),
(2, 'Matemática', NOW(), NOW()),
(3, 'Física', NOW(), NOW()),
(4, 'Literatura', NOW(), NOW());

-- 3. Autores Iniciales
INSERT INTO tauthor (idAuthor, firstName, surName, createdAt, updatedAt) VALUES
(1, 'John', 'Smith', NOW(), NOW()),
(2, 'James', 'Stewart', NOW(), NOW()),
(3, 'Sears &', 'Zemansky', NOW(), NOW()),
(4, 'Roger', 'Pressman', NOW(), NOW()),
(5, 'Gilbert', 'Strang', NOW(), NOW());

-- 4. Libros Iniciales
INSERT INTO tbook (idBook, idCategory, idAuthor, idUser, title, totalCopies, availableCopies, description, image, createdAt, updatedAt) VALUES
(1, 1, 1, 1, 'Introducción a la Programación con Python', 5, 5, 'Guía introductoria para aprender Python paso a paso.', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80', NOW(), NOW()),
(2, 2, 2, 1, 'Cálculo de una Variable', 3, 2, 'Libro de texto clásico de cálculo riguroso.', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80', NOW(), NOW()),
(3, 3, 3, 1, 'Física Universitaria', 2, 2, 'Referencia para estudiantes de ciencias para dominar la física.', 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=400&q=80', NOW(), NOW()),
(4, 1, 4, 1, 'Ingeniería de Software: Un Enfoque Práctico', 4, 4, 'Estudio completo de metodologías y procesos de desarrollo de software.', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=80', NOW(), NOW()),
(5, 2, 5, 1, 'Álgebra Lineal y sus Aplicaciones', 1, 0, 'Conceptos fundamentales de matrices y espacios vectoriales.', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80', NOW(), NOW());

-- PDF simulados
INSERT INTO tbookfile (idBook, name, extension, createdAt, updatedAt) VALUES
(1, 'python_intro.pdf', 'pdf', NOW(), NOW()),
(3, 'fisica_universitaria.pdf', 'pdf', NOW(), NOW());