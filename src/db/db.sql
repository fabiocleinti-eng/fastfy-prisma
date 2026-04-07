CREATE DATABASE IF NOT EXISTS api_contatos;

USE api_contatos;

CREATE TABLE IF NOT EXISTS contatos (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(100)  NOT NULL,
    telefone VARCHAR(20)   NULL,
    email    VARCHAR(100)  NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nome     VARCHAR(100)  NOT NULL,
    email    VARCHAR(100)  NOT NULL UNIQUE,
    senha    VARCHAR(255)  NOT NULL
);

ALTER TABLE usuarios ADD COLUMN papel ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario';
