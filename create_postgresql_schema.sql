-- Script para crear todas las tablas en PostgreSQL
-- Base de datos: segurosflex

-- Conectar a la base de datos
\c segurosflex;

-- Eliminar tablas existentes si existen (excepto test_connection)
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS presupuesto CASCADE;
DROP TABLE IF EXISTS documentosreclamacion CASCADE;
DROP TABLE IF EXISTS reclamacion CASCADE;
DROP TABLE IF EXISTS siniestros CASCADE;
DROP TABLE IF EXISTS proveedores CASCADE;
DROP TABLE IF EXISTS talleres_proveedores CASCADE;
DROP TABLE IF EXISTS taller CASCADE;
DROP TABLE IF EXISTS poliza CASCADE;
DROP TABLE IF EXISTS vehiculo CASCADE;
DROP TABLE IF EXISTS beneficiario CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- Crear secuencias para SERIAL
CREATE SEQUENCE IF NOT EXISTS usuario_usuarioid_seq;
CREATE SEQUENCE IF NOT EXISTS beneficiario_beneficiarioid_seq;
CREATE SEQUENCE IF NOT EXISTS vehiculo_vehiculoid_seq;
CREATE SEQUENCE IF NOT EXISTS poliza_polizaid_seq;
CREATE SEQUENCE IF NOT EXISTS taller_tallerid_seq;
CREATE SEQUENCE IF NOT EXISTS siniestros_siniestroids_seq;
CREATE SEQUENCE IF NOT EXISTS reclamacion_reclamacionid_seq;
CREATE SEQUENCE IF NOT EXISTS presupuesto_presupuestoid_seq;
CREATE SEQUENCE IF NOT EXISTS pago_pagoid_seq;

-- Tabla usuario
CREATE TABLE usuario (
    usuarioid SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'beneficiario',
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla beneficiario
CREATE TABLE beneficiario (
    beneficiarioid SERIAL PRIMARY KEY,
    usuarioid INTEGER REFERENCES usuario(usuarioid) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(8) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(15),
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla vehiculo
CREATE TABLE vehiculo (
    vehiculoid SERIAL PRIMARY KEY,
    beneficiarioid INTEGER REFERENCES beneficiario(beneficiarioid) ON DELETE CASCADE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INTEGER,
    placa VARCHAR(10) UNIQUE NOT NULL,
    color VARCHAR(30),
    vin VARCHAR(17),
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla poliza
CREATE TABLE poliza (
    polizaid SERIAL PRIMARY KEY,
    beneficiarioid INTEGER REFERENCES beneficiario(beneficiarioid) ON DELETE CASCADE,
    vehiculoid INTEGER REFERENCES vehiculo(vehiculoid) ON DELETE CASCADE,
    numeropoliza VARCHAR(50) UNIQUE NOT NULL,
    tipocobertura VARCHAR(100),
    montocobertura DECIMAL(12,2),
    prima DECIMAL(10,2),
    fechainicio DATE,
    fechavencimiento DATE,
    estado VARCHAR(20) DEFAULT 'activa',
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla taller
CREATE TABLE taller (
    tallerid SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(15),
    email VARCHAR(255),
    especialidad VARCHAR(100),
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla talleres_proveedores
CREATE TABLE talleres_proveedores (
    id SERIAL PRIMARY KEY,
    tallerid INTEGER REFERENCES taller(tallerid) ON DELETE CASCADE,
    nombreproveedor VARCHAR(100),
    contacto VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(255),
    tiposervicio VARCHAR(100),
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla proveedores
CREATE TABLE proveedores (
    proveedorid SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(15),
    email VARCHAR(255),
    direccion VARCHAR(255),
    tiposervicio VARCHAR(100),
    fecharegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla siniestros
CREATE TABLE siniestros (
    siniestroids SERIAL PRIMARY KEY,
    beneficiarioid INTEGER REFERENCES beneficiario(beneficiarioid) ON DELETE CASCADE,
    polizaid INTEGER REFERENCES poliza(polizaid) ON DELETE CASCADE,
    fechasiniestro DATE,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'reportado',
    montoestimado DECIMAL(12,2),
    fechareporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla reclamacion
CREATE TABLE reclamacion (
    reclamacionid SERIAL PRIMARY KEY,
    siniestroids INTEGER REFERENCES siniestros(siniestroids) ON DELETE CASCADE,
    fechareclamacion DATE,
    estado VARCHAR(50) DEFAULT 'pendiente',
    montoreclamado DECIMAL(12,2),
    montoaprobado DECIMAL(12,2),
    observaciones TEXT,
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla documentosreclamacion
CREATE TABLE documentosreclamacion (
    documentoid SERIAL PRIMARY KEY,
    reclamacionid INTEGER REFERENCES reclamacion(reclamacionid) ON DELETE CASCADE,
    tipodocumento VARCHAR(100),
    nombredocumento VARCHAR(255),
    rutadocumento VARCHAR(500),
    fechasubida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla presupuesto
CREATE TABLE presupuesto (
    presupuestoid SERIAL PRIMARY KEY,
    reclamacionid INTEGER REFERENCES reclamacion(reclamacionid) ON DELETE CASCADE,
    tallerid INTEGER REFERENCES taller(tallerid),
    descripcion TEXT,
    montototal DECIMAL(12,2),
    estado VARCHAR(50) DEFAULT 'pendiente',
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla pago
CREATE TABLE pago (
    pagoid SERIAL PRIMARY KEY,
    reclamacionid INTEGER REFERENCES reclamacion(reclamacionid) ON DELETE CASCADE,
    montopago DECIMAL(12,2),
    fechapago DATE,
    metodopago VARCHAR(50),
    estado VARCHAR(50) DEFAULT 'pendiente',
    referencia VARCHAR(100),
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla password_resets
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiresat TIMESTAMP NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_beneficiario_usuarioid ON beneficiario(usuarioid);
CREATE INDEX idx_beneficiario_dni ON beneficiario(dni);
CREATE INDEX idx_vehiculo_beneficiarioid ON vehiculo(beneficiarioid);
CREATE INDEX idx_vehiculo_placa ON vehiculo(placa);
CREATE INDEX idx_poliza_beneficiarioid ON poliza(beneficiarioid);
CREATE INDEX idx_poliza_vehiculoid ON poliza(vehiculoid);
CREATE INDEX idx_siniestros_beneficiarioid ON siniestros(beneficiarioid);
CREATE INDEX idx_siniestros_polizaid ON siniestros(polizaid);
CREATE INDEX idx_reclamacion_siniestroids ON reclamacion(siniestroids);
CREATE INDEX idx_presupuesto_reclamacionid ON presupuesto(reclamacionid);
CREATE INDEX idx_pago_reclamacionid ON pago(reclamacionid);

-- Insertar algunos datos de prueba
INSERT INTO usuario (nombre, apellido, email, password, rol) VALUES
('Admin', 'Sistema', 'admin@segurosflex.com', '$2b$10$example.hash.here', 'admin'),
('Juan', 'Pérez', 'juan.perez@example.com', '$2b$10$example.hash.here', 'beneficiario'),
('María', 'García', 'maria.garcia@example.com', '$2b$10$example.hash.here', 'beneficiario');

INSERT INTO beneficiario (usuarioid, nombre, apellido, dni, email, telefono) VALUES
(2, 'Juan', 'Pérez', '12345678', 'juan.perez@example.com', '987654321'),
(3, 'María', 'García', '87654321', 'maria.garcia@example.com', '123456789');

-- Crear función de ejemplo para get_beneficiario_por_id
CREATE OR REPLACE FUNCTION get_beneficiario_por_id(p_id INTEGER)
RETURNS TABLE(
    beneficiarioid INTEGER,
    usuarioid INTEGER,
    nombre VARCHAR,
    apellido VARCHAR,
    dni VARCHAR,
    email VARCHAR,
    telefono VARCHAR,
    fecharegistro TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT b.beneficiarioid, b.usuarioid, b.nombre, b.apellido, b.dni, b.email, b.telefono, b.fecharegistro
    FROM beneficiario b
    WHERE b.beneficiarioid = p_id;
END;
$$ LANGUAGE plpgsql;

-- Crear procedimiento almacenado para registro de beneficiarios
CREATE OR REPLACE FUNCTION sp_registerbeneficiario(
    p_nombre VARCHAR(100),
    p_apellido VARCHAR(100),
    p_email VARCHAR(255),
    p_password VARCHAR(255),
    p_dni VARCHAR(8),
    p_telefono VARCHAR(15)
)
RETURNS TABLE(
    success BOOLEAN,
    usuarioid INTEGER,
    beneficiarioid INTEGER,
    message TEXT,
    error TEXT
) AS $$
DECLARE
    v_usuarioid INTEGER;
    v_beneficiarioid INTEGER;
BEGIN
    -- Verificar si el email ya existe
    IF EXISTS (SELECT 1 FROM usuario WHERE email = p_email) THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::INTEGER, NULL::TEXT, 'El email ya está registrado'::TEXT;
        RETURN;
    END IF;
    
    -- Verificar si el DNI ya existe
    IF EXISTS (SELECT 1 FROM beneficiario WHERE dni = p_dni) THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::INTEGER, NULL::TEXT, 'El DNI ya está registrado'::TEXT;
        RETURN;
    END IF;
    
    -- Insertar usuario
    INSERT INTO usuario (nombre, apellido, email, password, rol)
    VALUES (p_nombre, p_apellido, p_email, p_password, 'beneficiario')
    RETURNING usuario.usuarioid INTO v_usuarioid;
    
    -- Insertar beneficiario
    INSERT INTO beneficiario (usuarioid, nombre, apellido, dni, email, telefono)
    VALUES (v_usuarioid, p_nombre, p_apellido, p_dni, p_email, p_telefono)
    RETURNING beneficiario.beneficiarioid INTO v_beneficiarioid;
    
    -- Retornar éxito
    RETURN QUERY SELECT TRUE, v_usuarioid, v_beneficiarioid, 'Beneficiario registrado exitosamente'::TEXT, NULL::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::INTEGER, NULL::TEXT, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Mostrar resumen de tablas creadas
SELECT 'Tablas creadas exitosamente:' as mensaje;
\dt
