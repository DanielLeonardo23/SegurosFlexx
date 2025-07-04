--
-- PostgreSQL database dump
--

-- Dumped from database version 16.6 (Debian 16.6-1.pgdg120+1)
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: seguros_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO seguros_user;

--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: actualizar_estado_actual(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.actualizar_estado_actual() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Si el tallerid no cambió, no hacer nada
    IF NEW.tallerid IS DISTINCT FROM OLD.tallerid THEN

        -- Si el siniestro tenía un taller asignado anteriormente, restar 1 a su capacidad
        IF OLD.tallerid IS NOT NULL THEN
            UPDATE taller
            SET estadoactual = estadoactual - 1
            WHERE tallerid = OLD.tallerid;
        END IF;

        -- Si el siniestro tiene un nuevo taller asignado, sumar 1 a su capacidad
        IF NEW.tallerid IS NOT NULL THEN
            UPDATE taller
            SET estadoactual = estadoactual + 1
            WHERE tallerid = NEW.tallerid;
        END IF;
    END IF;

    -- Asegurar que estadoactual se compara correctamente con capacidad antes de actualizar estado
    UPDATE taller
    SET estado = CASE 
                    WHEN estadoactual = capacidad THEN 'Ocupado'
                    ELSE 'Disponible'
                 END
    WHERE tallerid = COALESCE(NEW.tallerid, OLD.tallerid);  -- Si NEW.tallerid es NULL, usar OLD.tallerid

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_estado_actual() OWNER TO seguros_user;

--
-- Name: actualizar_estado_taller_al_cambiar_capacidad(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.actualizar_estado_taller_al_cambiar_capacidad() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificamos si cambió la capacidad
    IF NEW.capacidad <> OLD.capacidad THEN
        -- Actualizamos el estado del taller según estadoactual y capacidad
        UPDATE taller
        SET estado = CASE
            WHEN NEW.estadoactual < NEW.capacidad THEN 'Disponible'
            ELSE 'Ocupado'
        END
        WHERE tallerid = NEW.tallerid;
    END IF;

    -- Retornamos la nueva fila
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_estado_taller_al_cambiar_capacidad() OWNER TO seguros_user;

--
-- Name: actualizar_usuario_beneficiario(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.actualizar_usuario_beneficiario() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Solo actualiza si el usuarioid existe en la fila modificada
    IF NEW.usuarioid IS NOT NULL THEN
        UPDATE usuario
        SET 
            nombre = NEW.nombre,
            apellido = NEW.apellido,
            email = NEW.email
        WHERE usuarioid = NEW.usuarioid;  -- Relacionando con usuarioid
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_usuario_beneficiario() OWNER TO seguros_user;

--
-- Name: createbeneficiario(character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.createbeneficiario(p_nombre character varying, p_apellido character varying, p_dni character varying, p_email character varying, p_telefono character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    existing INT;
BEGIN
    -- Verifica si ya existe un beneficiario con el mismo DNI o Email
    SELECT COUNT(*) INTO existing
    FROM beneficiario
    WHERE DNI = p_DNI OR Email = p_Email;

    IF existing > 0 THEN
        RAISE EXCEPTION 'El DNI o Email ya están registrados.';
    ELSE
        -- Inserta el nuevo beneficiario
        INSERT INTO beneficiario (Nombre, Apellido, DNI, Email, Telefono)
        VALUES (p_Nombre, p_Apellido, p_DNI, p_Email, p_Telefono);
    END IF;
END;
$$;


ALTER FUNCTION public.createbeneficiario(p_nombre character varying, p_apellido character varying, p_dni character varying, p_email character varying, p_telefono character varying) OWNER TO seguros_user;

--
-- Name: createproveedor(character varying, character varying, character varying, character varying, character varying, character varying, numeric, text, json); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.createproveedor(p_nombre_proveedor character varying, p_direccion character varying, p_telefono_proveedor character varying, p_correo_electronico character varying, p_tipo_proveedor character varying, p_estado_proveedor character varying, p_valoracion numeric, p_notas text, p_documentos json) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Insertar un nuevo proveedor en la tabla
    INSERT INTO proveedores (
        nombre_proveedor, 
        direccion, 
        telefono_proveedor, 
        correo_electronico, 
        tipo_proveedor, 
        estado_proveedor, 
        valoracion, 
        notas, 
        documentos  -- Almacenamos el JSON en la columna 'documentos'
    )
    VALUES (
        p_nombre_proveedor, 
        p_direccion, 
        p_telefono_proveedor, 
        p_correo_electronico, 
        p_tipo_proveedor, 
        p_estado_proveedor, 
        p_valoracion, 
        p_notas,
        p_documentos  -- Insertamos el campo documentos de tipo JSON
    );
END;
$$;


ALTER FUNCTION public.createproveedor(p_nombre_proveedor character varying, p_direccion character varying, p_telefono_proveedor character varying, p_correo_electronico character varying, p_tipo_proveedor character varying, p_estado_proveedor character varying, p_valoracion numeric, p_notas text, p_documentos json) OWNER TO seguros_user;

--
-- Name: createtaller(character varying, character varying, integer, character varying, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.createtaller(p_nombre character varying, p_direccion character varying, p_capacidad integer, p_estado character varying, p_telefono character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO taller (
        nombre, 
        direccion, 
        capacidad, 
        estado, 
        telefono
    )
    VALUES (
        p_nombre, 
        p_direccion, 
        p_capacidad, 
        p_estado, 
        p_telefono
    );
END;
$$;


ALTER FUNCTION public.createtaller(p_nombre character varying, p_direccion character varying, p_capacidad integer, p_estado character varying, p_telefono character varying) OWNER TO seguros_user;

--
-- Name: deletebeneficiario(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.deletebeneficiario(p_beneficiarioid integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_UsuarioID INT;
BEGIN
    -- Obtener el UsuarioID correspondiente al BeneficiarioID
    SELECT UsuarioID INTO v_UsuarioID
    FROM beneficiario
    WHERE BeneficiarioID = p_BeneficiarioID;

    -- Verificar si el BeneficiarioID existe
    IF v_UsuarioID IS NULL THEN
        RAISE EXCEPTION 'Beneficiario no encontrado';
    ELSE
        -- Eliminar el beneficiario de la tabla beneficiario
        DELETE FROM beneficiario WHERE BeneficiarioID = p_BeneficiarioID;

        -- Eliminar el usuario de la tabla Usuario
        DELETE FROM Usuario WHERE UsuarioID = v_UsuarioID;
    END IF;
END;
$$;


ALTER FUNCTION public.deletebeneficiario(p_beneficiarioid integer) OWNER TO seguros_user;

--
-- Name: deleteproveedor(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.deleteproveedor(p_id_proveedor integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM proveedores WHERE ID_Proveedor = p_ID_Proveedor;
END;
$$;


ALTER FUNCTION public.deleteproveedor(p_id_proveedor integer) OWNER TO seguros_user;

--
-- Name: deletetaller(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.deletetaller(p_id_taller integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM taller WHERE tallerid = p_id_taller;
END;
$$;


ALTER FUNCTION public.deletetaller(p_id_taller integer) OWNER TO seguros_user;

--
-- Name: get_indemnizaciones(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.get_indemnizaciones() RETURNS TABLE(presupuestoid integer, siniestroid integer, fecha_siniestro text, montototal numeric, estado character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.presupuestoid,
        p.siniestroid,
        TO_CHAR(s.fecha_siniestro, 'YYYY-MM-DD') AS fecha_siniestro,  -- Forzar formato sin hora
        p.montototal,
        p.estado
    FROM presupuesto p
    JOIN siniestros s ON p.siniestroid = s.siniestroid
    WHERE p.estado IN ('Validado', 'Pagado');
END;
$$;


ALTER FUNCTION public.get_indemnizaciones() OWNER TO seguros_user;

--
-- Name: get_presupuesto_by_id(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.get_presupuesto_by_id(p_presupuestoid integer) RETURNS TABLE(siniestroid integer, montototal numeric, detalle_presupuesto character varying, costo_reparacion numeric, costo_piezas_mano_obra numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.siniestroid,
        p.montototal,
        p.detalle_presupuesto, 
        p.costo_reparacion, 
        p.costo_piezas_mano_obra
    FROM presupuesto p
    WHERE p.presupuestoid = p_presupuestoid;
END;
$$;


ALTER FUNCTION public.get_presupuesto_by_id(p_presupuestoid integer) OWNER TO seguros_user;

--
-- Name: get_presupuestos_pendientes(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.get_presupuestos_pendientes() RETURNS TABLE(presupuestoid integer, siniestroid integer, fecha_asignacion timestamp without time zone, nombre character varying, tipo_siniestro character varying, placa character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.presupuestoid,
        p.siniestroid,
        s.fecha_asignacion,
        t.nombre,
        s.tipo_siniestro,
        v.placa
    FROM presupuesto p
    JOIN siniestros s ON p.siniestroid = s.siniestroid
    LEFT JOIN taller t ON s.tallerid = t.tallerid
    LEFT JOIN vehiculo v ON s.vehiculoid = v.vehiculoid
    WHERE p.estado = 'Pendiente';
END;
$$;


ALTER FUNCTION public.get_presupuestos_pendientes() OWNER TO seguros_user;

--
-- Name: getallproveedores(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.getallproveedores() RETURNS TABLE(id_proveedor integer, nombre_proveedor character varying, direccion character varying, telefono_proveedor character varying, correo_electronico character varying, tipo_proveedor character varying, estado_proveedor character varying, valoracion numeric, fecha_registro text, documentos json, notas text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_proveedor, 
        p.nombre_proveedor, 
        p.direccion, 
        p.telefono_proveedor, 
        p.correo_electronico, 
        p.tipo_proveedor, 
        p.estado_proveedor, 
        p.valoracion, 
        TO_CHAR(p.fecha_registro, 'YYYY-MM-DD HH24:MI:SS') AS fecha_registro,  -- Formato de fecha como texto
        p.documentos,  -- Devolvemos la columna 'documentos' que es de tipo JSON
        p.notas
    FROM proveedores p;  -- Alias 'p' para la tabla 'proveedores'
END;
$$;


ALTER FUNCTION public.getallproveedores() OWNER TO seguros_user;

--
-- Name: getalltalleres(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.getalltalleres() RETURNS TABLE(tallerid integer, nombre character varying, direccion character varying, capacidad integer, estado character varying, telefono character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tallerid, 
        t.nombre, 
        t.direccion, 
        t.capacidad, 
        t.estado, 
        t.telefono
    FROM taller t;
END;
$$;


ALTER FUNCTION public.getalltalleres() OWNER TO seguros_user;

--
-- Name: getbeneficiarios(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.getbeneficiarios() RETURNS TABLE(beneficiarioid integer, nombre character varying, apellido character varying, dni character varying, email character varying, telefono character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY SELECT * FROM beneficiario;
END;
$$;


ALTER FUNCTION public.getbeneficiarios() OWNER TO seguros_user;

--
-- Name: getproveedorbyid(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.getproveedorbyid(p_id_proveedor integer) RETURNS TABLE(id_proveedor integer, nombre_proveedor character varying, direccion character varying, telefono_proveedor character varying, correo_electronico character varying, tipo_proveedor character varying, estado_proveedor character varying, valoracion numeric, notas text, documentos json)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.id_proveedor, 
        p.nombre_proveedor, 
        p.direccion, 
        p.telefono_proveedor, 
        p.correo_electronico, 
        p.tipo_proveedor, 
        p.estado_proveedor, 
        p.valoracion, 
        p.notas,
        p.documentos  -- Se incluye el campo 'documentos' de tipo JSON
    FROM proveedores p
    WHERE p.id_proveedor = p_id_proveedor;
END;
$$;


ALTER FUNCTION public.getproveedorbyid(p_id_proveedor integer) OWNER TO seguros_user;

--
-- Name: gettallerbyid(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.gettallerbyid(p_id_taller integer) RETURNS TABLE(tallerid integer, nombre character varying, direccion character varying, capacidad integer, estado character varying, telefono character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        t.tallerid, 
        t.nombre, 
        t.direccion, 
        t.capacidad, 
        t.estado, 
        t.telefono
    FROM taller t
    WHERE t.tallerid = p_id_taller;
END;
$$;


ALTER FUNCTION public.gettallerbyid(p_id_taller integer) OWNER TO seguros_user;

--
-- Name: liberar_taller(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.liberar_taller() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Solo ejecutar si el estado cambió a 'Culminado' y el tallerid no es NULL
    IF NEW.estado = 'Culminado' AND OLD.estado != 'Culminado' AND OLD.tallerid IS NOT NULL THEN
        
        -- Aumentar la capacidad disponible del taller
        UPDATE taller
        SET capacidad = capacidad + 1
        WHERE tallerid = OLD.tallerid;

        -- Quitar la asignación del taller en siniestros
        UPDATE siniestros
        SET tallerid = NULL
        WHERE siniestroid = NEW.siniestroid;

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.liberar_taller() OWNER TO seguros_user;

--
-- Name: obtener_documentos(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.obtener_documentos(presupuesto_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE 
    documentos TEXT;
BEGIN
    SELECT s.documentos INTO documentos
    FROM siniestros s
    JOIN presupuesto p ON s.siniestroid = p.siniestroid
    WHERE p.presupuestoid = presupuesto_id;

    RETURN documentos;
END;
$$;


ALTER FUNCTION public.obtener_documentos(presupuesto_id integer) OWNER TO seguros_user;

--
-- Name: obtener_poliza_por_presupuesto(integer); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.obtener_poliza_por_presupuesto(presupuesto_id integer) RETURNS TABLE(tipopoliza character varying, fechainicio date, fechafin date, estado character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT po.tipopoliza, po.fechainicio, po.fechafin, po.estado
    FROM poliza po
    JOIN beneficiario b ON po.beneficiarioid = b.beneficiarioid
    JOIN siniestros s ON b.beneficiarioid = s.beneficiarioid
    JOIN presupuesto pp ON s.siniestroid = pp.siniestroid
    WHERE pp.presupuestoid = presupuesto_id;
END;
$$;


ALTER FUNCTION public.obtener_poliza_por_presupuesto(presupuesto_id integer) OWNER TO seguros_user;

--
-- Name: set_names_on_talleres_proveedores(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.set_names_on_talleres_proveedores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Buscar el nombre del taller según el taller_id
  SELECT t.nombre
    INTO NEW.nombre_taller
    FROM taller t
    WHERE t.tallerid = NEW.taller_id;

  -- Buscar el nombre del proveedor según el proveedor_id
  SELECT p.nombre_proveedor
    INTO NEW.nombre_proveedor
    FROM proveedores p
    WHERE p.id_proveedor = NEW.proveedor_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_names_on_talleres_proveedores() OWNER TO seguros_user;

--
-- Name: sp_actualizarestadotaller(integer, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.sp_actualizarestadotaller(p_tallerid integer, p_estado character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE taller SET Estado = p_Estado WHERE TallerID = p_TallerID;
END;
$$;


ALTER FUNCTION public.sp_actualizarestadotaller(p_tallerid integer, p_estado character varying) OWNER TO seguros_user;

--
-- Name: sp_crearpoliza(integer, character varying, date, date, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.sp_crearpoliza(p_beneficiarioid integer, p_tipopoliza character varying, p_fechainicio date, p_fechafin date, p_estado character varying, OUT p_polizaid integer) RETURNS SETOF integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_Estado IS NULL OR p_Estado = '' THEN
        p_Estado := 'Inactiva';
    END IF;
    
    INSERT INTO poliza (BeneficiarioID, TipoPoliza, FechaInicio, FechaFin, Estado)
    VALUES (p_BeneficiarioID, p_TipoPoliza, p_FechaInicio, p_FechaFin, p_Estado)
    RETURNING PolizaID INTO p_PolizaID;
    
    RETURN;
END;
$$;


ALTER FUNCTION public.sp_crearpoliza(p_beneficiarioid integer, p_tipopoliza character varying, p_fechainicio date, p_fechafin date, p_estado character varying, OUT p_polizaid integer) OWNER TO seguros_user;

--
-- Name: sp_createuser(character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.sp_createuser(p_nombre character varying, p_apellido character varying, p_email character varying, p_password character varying, p_rol character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    email_count INT;
BEGIN
    SELECT COUNT(*) INTO email_count FROM usuario WHERE Email = p_Email;

    IF email_count > 0 THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado';
    ELSE
        INSERT INTO usuario (Nombre, Apellido, Email, Password, Rol) 
        VALUES (p_Nombre, p_Apellido, p_Email, p_Password, p_Rol);
    END IF;
END;
$$;


ALTER FUNCTION public.sp_createuser(p_nombre character varying, p_apellido character varying, p_email character varying, p_password character varying, p_rol character varying) OWNER TO seguros_user;

--
-- Name: sp_finduserbyemail(character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.sp_finduserbyemail(p_email character varying) RETURNS TABLE(usuarioid integer, nombre character varying, apellido character varying, email character varying, password character varying, rol character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY 
    SELECT u."usuarioid", u."nombre", u."apellido", u."email", u."password", u."rol"
    FROM "usuario" u
    WHERE u."email" = p_email
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.sp_finduserbyemail(p_email character varying) OWNER TO seguros_user;

--
-- Name: sp_registerbeneficiario(character varying, character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.sp_registerbeneficiario(p_nombre character varying, p_apellido character varying, p_email character varying, p_password character varying, p_dni character varying, p_telefono character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    email_count INT;
    v_UsuarioID INT;
BEGIN
    -- Verificar si el correo electrónico ya está registrado
    SELECT COUNT(*) INTO email_count 
    FROM Usuario 
    WHERE Email = p_Email;

    IF email_count > 0 THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado';
    ELSE
        -- Crear usuario
        INSERT INTO Usuario (nombre, apellido, email, password, rol) 
        VALUES (p_Nombre, p_Apellido, p_Email, p_Password, 'Beneficiario');

        -- Obtener el UsuarioID del usuario creado
        SELECT currval(pg_get_serial_sequence('usuario', 'usuarioid')) INTO v_UsuarioID;

        -- Crear beneficiario
        INSERT INTO beneficiario (nombre, apellido, dni, email, telefono, usuarioID) 
        VALUES (p_Nombre, p_Apellido, p_DNI, p_Email, p_Telefono, v_UsuarioID);
    END IF;
END;
$$;


ALTER FUNCTION public.sp_registerbeneficiario(p_nombre character varying, p_apellido character varying, p_email character varying, p_password character varying, p_dni character varying, p_telefono character varying) OWNER TO seguros_user;

--
-- Name: sp_registrarpresupuesto(integer, numeric); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.sp_registrarpresupuesto(p_siniestroid integer, p_montototal numeric, OUT p_presupuestoid integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO presupuesto (SiniestroID, MontoTotal)
    VALUES (p_SiniestroID, p_MontoTotal)
    RETURNING PresupuestoID INTO p_PresupuestoID;
END;
$$;


ALTER FUNCTION public.sp_registrarpresupuesto(p_siniestroid integer, p_montototal numeric, OUT p_presupuestoid integer) OWNER TO seguros_user;

--
-- Name: trigger_crear_presupuesto(); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.trigger_crear_presupuesto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    costo_base NUMERIC;
BEGIN
    -- Determinar el costo base según el tipo de siniestro
    CASE NEW.tipo_siniestro
        WHEN 'Accidente' THEN costo_base := 5000;
        WHEN 'Choque' THEN costo_base := 8000;
        WHEN 'Robo total' THEN costo_base := 35000;
        WHEN 'Robo parcial' THEN costo_base := 20000;
        WHEN 'Incendio' THEN costo_base := 10000;
        WHEN 'Daño por terceros' THEN costo_base := 7500;
        WHEN 'Rotura de lunas' THEN costo_base := 2300;
        WHEN 'Atropello' THEN costo_base := 12500;
        WHEN 'Volcadura' THEN costo_base := 8000;
        ELSE 
            costo_base := 3000; -- Valor mínimo si el tipo_siniestro no está en la lista
    END CASE;

    -- Caso 1: Crear presupuesto si antes no había taller asignado y ahora sí
    IF OLD.tallerid IS NULL AND NEW.tallerid IS NOT NULL THEN
        INSERT INTO presupuesto (siniestroid, montototal, estado, fechacreacion, detalle_presupuesto, costo_reparacion, costo_piezas_mano_obra)
        VALUES (NEW.siniestroid, costo_base, 'Pendiente', NOW(), '', costo_base * 0.4, costo_base * 0.6);

        UPDATE siniestros
        SET fecha_asignacion = NOW() AT TIME ZONE 'America/Bogota'
        WHERE siniestroid = NEW.siniestroid;
    END IF;

    -- Caso 2: Actualizar fecha de asignación si el taller cambió y ambos valores son no nulos
    IF OLD.tallerid IS NOT NULL AND NEW.tallerid IS NOT NULL AND OLD.tallerid IS DISTINCT FROM NEW.tallerid THEN
        UPDATE siniestros
        SET fecha_asignacion = NOW() AT TIME ZONE 'America/Bogota'
        WHERE siniestroid = NEW.siniestroid;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_crear_presupuesto() OWNER TO seguros_user;

--
-- Name: update_presupuesto(integer, numeric, numeric, numeric, character varying, character varying, timestamp without time zone); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.update_presupuesto(p_id_presupuesto integer, p_montototal numeric, p_costo_reparacion numeric, p_costo_piezas_mano_obra numeric, p_detalle_presupuesto character varying, p_estado character varying, p_fechacreacion timestamp without time zone) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE presupuesto
    SET 
        montototal = p_montototal,
        costo_reparacion = p_costo_reparacion,
        costo_piezas_mano_obra = p_costo_piezas_mano_obra,
        detalle_presupuesto = p_detalle_presupuesto,
        estado = p_estado,
        fechacreacion = p_fechacreacion
    WHERE presupuestoid = p_id_presupuesto;
END;
$$;


ALTER FUNCTION public.update_presupuesto(p_id_presupuesto integer, p_montototal numeric, p_costo_reparacion numeric, p_costo_piezas_mano_obra numeric, p_detalle_presupuesto character varying, p_estado character varying, p_fechacreacion timestamp without time zone) OWNER TO seguros_user;

--
-- Name: updatebeneficiario(integer, character varying, character varying, character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.updatebeneficiario(p_beneficiarioid integer, p_nombre character varying, p_apellido character varying, p_dni character varying, p_email character varying, p_telefono character varying, p_password character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_UsuarioID INT;
BEGIN
    -- Obtener el UsuarioID correspondiente al BeneficiarioID
    SELECT usuarioid INTO v_UsuarioID
    FROM beneficiario
    WHERE beneficiarioid = p_BeneficiarioID;

    -- Verificar si el UsuarioID existe
    IF v_UsuarioID IS NULL THEN
        RAISE EXCEPTION 'Beneficiario no encontrado.';
    ELSE
        -- Actualizar la tabla beneficiario
        UPDATE beneficiario
        SET nombre = p_Nombre,
            apellido = p_Apellido,
            dni = p_DNI,
            email = p_Email,
            telefono = p_Telefono
        WHERE beneficiarioid = p_BeneficiarioID;

        -- Si se proporciona una nueva contraseña, actualizarla en la tabla Usuario
        IF p_Password IS NOT NULL THEN
            UPDATE usuario
            SET Password = p_Password
            WHERE usuarioid = v_UsuarioID;
        END IF;
    END IF;
END;
$$;


ALTER FUNCTION public.updatebeneficiario(p_beneficiarioid integer, p_nombre character varying, p_apellido character varying, p_dni character varying, p_email character varying, p_telefono character varying, p_password character varying) OWNER TO seguros_user;

--
-- Name: updateproveedor(integer, character varying, character varying, character varying, character varying, character varying, character varying, numeric, text, json); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.updateproveedor(p_id_proveedor integer, p_nombre_proveedor character varying, p_direccion character varying, p_telefono_proveedor character varying, p_correo_electronico character varying, p_tipo_proveedor character varying, p_estado_proveedor character varying, p_valoracion numeric, p_notas text, p_documentos json) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE proveedores
    SET 
        nombre_proveedor = p_nombre_proveedor,
        direccion = p_direccion,
        telefono_proveedor = p_telefono_proveedor,
        correo_electronico = p_correo_electronico,
        tipo_proveedor = p_tipo_proveedor,
        estado_proveedor = p_estado_proveedor,
        valoracion = p_valoracion,
        notas = p_notas,
        documentos = p_documentos  -- Aseguramos que el campo documentos se actualice también
    WHERE id_proveedor = p_id_proveedor;
END;
$$;


ALTER FUNCTION public.updateproveedor(p_id_proveedor integer, p_nombre_proveedor character varying, p_direccion character varying, p_telefono_proveedor character varying, p_correo_electronico character varying, p_tipo_proveedor character varying, p_estado_proveedor character varying, p_valoracion numeric, p_notas text, p_documentos json) OWNER TO seguros_user;

--
-- Name: updatetaller(integer, character varying, character varying, integer, character varying, character varying); Type: FUNCTION; Schema: public; Owner: seguros_user
--

CREATE FUNCTION public.updatetaller(p_id_taller integer, p_nombre character varying, p_direccion character varying, p_capacidad integer, p_estado character varying, p_telefono character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE taller
    SET 
        nombre = p_nombre,
        direccion = p_direccion,
        capacidad = p_capacidad,
        estado = p_estado,
        telefono = p_telefono
    WHERE tallerid = p_id_taller;
END;
$$;


ALTER FUNCTION public.updatetaller(p_id_taller integer, p_nombre character varying, p_direccion character varying, p_capacidad integer, p_estado character varying, p_telefono character varying) OWNER TO seguros_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: beneficiario; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.beneficiario (
    beneficiarioid integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    telefono character varying(15) DEFAULT NULL::character varying,
    usuarioid integer,
    dni character varying(8)
);


ALTER TABLE public.beneficiario OWNER TO seguros_user;

--
-- Name: beneficiario_beneficiarioid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.beneficiario_beneficiarioid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.beneficiario_beneficiarioid_seq OWNER TO seguros_user;

--
-- Name: beneficiario_beneficiarioid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.beneficiario_beneficiarioid_seq OWNED BY public.beneficiario.beneficiarioid;


--
-- Name: documentosreclamacion; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.documentosreclamacion (
    documentoid integer NOT NULL,
    reclamacionid integer NOT NULL,
    nombre character varying(255) NOT NULL,
    extension character varying(10),
    url text,
    fecha_subida timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado_documento character varying(50) DEFAULT 'Pendiente'::character varying
);


ALTER TABLE public.documentosreclamacion OWNER TO seguros_user;

--
-- Name: documentosreclamacion_documentoid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.documentosreclamacion_documentoid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documentosreclamacion_documentoid_seq OWNER TO seguros_user;

--
-- Name: documentosreclamacion_documentoid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.documentosreclamacion_documentoid_seq OWNED BY public.documentosreclamacion.documentoid;


--
-- Name: pago; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.pago (
    pagoid integer NOT NULL,
    presupuestoid integer NOT NULL,
    cantidadpagada numeric(10,2) NOT NULL,
    fechapago timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pago OWNER TO seguros_user;

--
-- Name: pago_pagoid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.pago_pagoid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pago_pagoid_seq OWNER TO seguros_user;

--
-- Name: pago_pagoid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.pago_pagoid_seq OWNED BY public.pago.pagoid;


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.password_resets (
    id integer NOT NULL,
    usuarioid integer,
    reset_token character varying(255) NOT NULL,
    reset_expires timestamp without time zone NOT NULL
);


ALTER TABLE public.password_resets OWNER TO seguros_user;

--
-- Name: password_resets_id_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.password_resets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_resets_id_seq OWNER TO seguros_user;

--
-- Name: password_resets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.password_resets_id_seq OWNED BY public.password_resets.id;


--
-- Name: poliza; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.poliza (
    polizaid integer NOT NULL,
    beneficiarioid integer NOT NULL,
    tipopoliza character varying(50),
    fechainicio date NOT NULL,
    fechafin date,
    estado character varying(50) DEFAULT 'Inactiva'::character varying
);


ALTER TABLE public.poliza OWNER TO seguros_user;

--
-- Name: poliza_polizaid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.poliza_polizaid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poliza_polizaid_seq OWNER TO seguros_user;

--
-- Name: poliza_polizaid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.poliza_polizaid_seq OWNED BY public.poliza.polizaid;


--
-- Name: presupuesto; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.presupuesto (
    presupuestoid integer NOT NULL,
    siniestroid integer NOT NULL,
    montototal numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying,
    fechacreacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detalle_presupuesto character varying(50),
    costo_reparacion numeric(10,2),
    costo_piezas_mano_obra numeric(10,2),
    CONSTRAINT presupuesto_estado_check CHECK (((estado)::text = ANY ((ARRAY['Pendiente'::character varying, 'Pagado'::character varying, 'Validado'::character varying])::text[])))
);


ALTER TABLE public.presupuesto OWNER TO seguros_user;

--
-- Name: presupuesto_presupuestoid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.presupuesto_presupuestoid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.presupuesto_presupuestoid_seq OWNER TO seguros_user;

--
-- Name: presupuesto_presupuestoid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.presupuesto_presupuestoid_seq OWNED BY public.presupuesto.presupuestoid;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.proveedores (
    id_proveedor integer NOT NULL,
    nombre_proveedor character varying(255) NOT NULL,
    direccion character varying(255) DEFAULT NULL::character varying,
    telefono_proveedor character varying(20) DEFAULT NULL::character varying,
    correo_electronico character varying(100) DEFAULT NULL::character varying,
    tipo_proveedor character varying(100) DEFAULT NULL::character varying,
    estado_proveedor character varying(10) DEFAULT 'Activo'::character varying,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    valoracion numeric(3,2),
    notas text,
    documentos json,
    CONSTRAINT proveedores_estado_proveedor_check CHECK (((estado_proveedor)::text = ANY ((ARRAY['Activo'::character varying, 'Inactivo'::character varying])::text[])))
);


ALTER TABLE public.proveedores OWNER TO seguros_user;

--
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.proveedores_id_proveedor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNER TO seguros_user;

--
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNED BY public.proveedores.id_proveedor;


--
-- Name: reclamacion; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.reclamacion (
    reclamacionid integer NOT NULL,
    siniestroid integer NOT NULL,
    fecha_reclamacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(50) NOT NULL,
    descripcion text,
    tipo character varying(50),
    observacion text
);


ALTER TABLE public.reclamacion OWNER TO seguros_user;

--
-- Name: reclamacion_reclamacionid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.reclamacion_reclamacionid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reclamacion_reclamacionid_seq OWNER TO seguros_user;

--
-- Name: reclamacion_reclamacionid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.reclamacion_reclamacionid_seq OWNED BY public.reclamacion.reclamacionid;


--
-- Name: siniestros; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.siniestros (
    siniestroid integer NOT NULL,
    beneficiarioid integer,
    vehiculoid integer,
    polizaid integer,
    tallerid integer,
    tipo_siniestro character varying(50) NOT NULL,
    fecha_siniestro date NOT NULL,
    departamento character varying(100) NOT NULL,
    distrito character varying(100) NOT NULL,
    provincia character varying(100) NOT NULL,
    ubicacion text NOT NULL,
    descripcion text NOT NULL,
    documentos json,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_asignacion timestamp without time zone,
    estado character varying(20) DEFAULT 'No asignado'::character varying
);


ALTER TABLE public.siniestros OWNER TO seguros_user;

--
-- Name: COLUMN siniestros.fecha_asignacion; Type: COMMENT; Schema: public; Owner: seguros_user
--

COMMENT ON COLUMN public.siniestros.fecha_asignacion IS 'Fecha en la que el siniestrio se asignó a un taller';


--
-- Name: siniestros_siniestroid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.siniestros_siniestroid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.siniestros_siniestroid_seq OWNER TO seguros_user;

--
-- Name: siniestros_siniestroid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.siniestros_siniestroid_seq OWNED BY public.siniestros.siniestroid;


--
-- Name: taller; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.taller (
    tallerid integer NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(200) NOT NULL,
    capacidad integer NOT NULL,
    estado character varying(20) DEFAULT 'Disponible'::character varying,
    telefono character varying(15) DEFAULT NULL::character varying,
    estadoactual integer DEFAULT 0 NOT NULL,
    CONSTRAINT taller_estado_check CHECK (((estado)::text = ANY ((ARRAY['Disponible'::character varying, 'Ocupado'::character varying])::text[])))
);


ALTER TABLE public.taller OWNER TO seguros_user;

--
-- Name: COLUMN taller.estadoactual; Type: COMMENT; Schema: public; Owner: seguros_user
--

COMMENT ON COLUMN public.taller.estadoactual IS 'Número de siniestros asignados al taller';


--
-- Name: taller_tallerid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.taller_tallerid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.taller_tallerid_seq OWNER TO seguros_user;

--
-- Name: taller_tallerid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.taller_tallerid_seq OWNED BY public.taller.tallerid;


--
-- Name: talleres_proveedores; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.talleres_proveedores (
    taller_id integer NOT NULL,
    proveedor_id integer NOT NULL,
    nombre_taller character varying(255),
    nombre_proveedor character varying(255)
);


ALTER TABLE public.talleres_proveedores OWNER TO seguros_user;

--
-- Name: usuario; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.usuario (
    usuarioid integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) DEFAULT NULL::character varying,
    rol character varying(50) NOT NULL,
    CONSTRAINT usuario_rol_check CHECK (((rol)::text = ANY ((ARRAY['Personal'::character varying, 'Administrador'::character varying, 'Beneficiario'::character varying])::text[])))
);


ALTER TABLE public.usuario OWNER TO seguros_user;

--
-- Name: usuario_usuarioid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.usuario_usuarioid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuario_usuarioid_seq OWNER TO seguros_user;

--
-- Name: usuario_usuarioid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.usuario_usuarioid_seq OWNED BY public.usuario.usuarioid;


--
-- Name: vehiculo; Type: TABLE; Schema: public; Owner: seguros_user
--

CREATE TABLE public.vehiculo (
    vehiculoid integer NOT NULL,
    placa character varying(50) NOT NULL,
    marca character varying(50) NOT NULL,
    modelo character varying(50),
    tipo character varying(50),
    beneficiarioid integer
);


ALTER TABLE public.vehiculo OWNER TO seguros_user;

--
-- Name: vehiculo_vehiculoid_seq; Type: SEQUENCE; Schema: public; Owner: seguros_user
--

CREATE SEQUENCE public.vehiculo_vehiculoid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vehiculo_vehiculoid_seq OWNER TO seguros_user;

--
-- Name: vehiculo_vehiculoid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seguros_user
--

ALTER SEQUENCE public.vehiculo_vehiculoid_seq OWNED BY public.vehiculo.vehiculoid;


--
-- Name: beneficiario beneficiarioid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.beneficiario ALTER COLUMN beneficiarioid SET DEFAULT nextval('public.beneficiario_beneficiarioid_seq'::regclass);


--
-- Name: documentosreclamacion documentoid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.documentosreclamacion ALTER COLUMN documentoid SET DEFAULT nextval('public.documentosreclamacion_documentoid_seq'::regclass);


--
-- Name: pago pagoid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.pago ALTER COLUMN pagoid SET DEFAULT nextval('public.pago_pagoid_seq'::regclass);


--
-- Name: password_resets id; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.password_resets ALTER COLUMN id SET DEFAULT nextval('public.password_resets_id_seq'::regclass);


--
-- Name: poliza polizaid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.poliza ALTER COLUMN polizaid SET DEFAULT nextval('public.poliza_polizaid_seq'::regclass);


--
-- Name: presupuesto presupuestoid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.presupuesto ALTER COLUMN presupuestoid SET DEFAULT nextval('public.presupuesto_presupuestoid_seq'::regclass);


--
-- Name: proveedores id_proveedor; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id_proveedor SET DEFAULT nextval('public.proveedores_id_proveedor_seq'::regclass);


--
-- Name: reclamacion reclamacionid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.reclamacion ALTER COLUMN reclamacionid SET DEFAULT nextval('public.reclamacion_reclamacionid_seq'::regclass);


--
-- Name: siniestros siniestroid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.siniestros ALTER COLUMN siniestroid SET DEFAULT nextval('public.siniestros_siniestroid_seq'::regclass);


--
-- Name: taller tallerid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.taller ALTER COLUMN tallerid SET DEFAULT nextval('public.taller_tallerid_seq'::regclass);


--
-- Name: usuario usuarioid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.usuario ALTER COLUMN usuarioid SET DEFAULT nextval('public.usuario_usuarioid_seq'::regclass);


--
-- Name: vehiculo vehiculoid; Type: DEFAULT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.vehiculo ALTER COLUMN vehiculoid SET DEFAULT nextval('public.vehiculo_vehiculoid_seq'::regclass);


--
-- Data for Name: beneficiario; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.beneficiario (beneficiarioid, nombre, apellido, email, telefono, usuarioid, dni) FROM stdin;
3	ernanei	chipana	maur@example.com	938865526	4	44456577
7	ernanei	valdiviezo	ernan@gmail.com	981089166	10	72960902
9	pritar	rikard	snake@gmail.com	654123	12	91223121
10	daniel	escribas	prueba@gmail.com	23453443	13	72224229
16	daniel	escribas	daniel.escribas@unmsm.edu.pe	938240845	21	47031782
22	luis	roque	roque@gmail.com	91121	27	78122144
25	milano	jeruzalen	keke123@gmail.com	987654287	30	98765432
33	holaa	lopez	wisnerva22@gmail.com	987654321	38	42941598
36	jonei1ww	valdiviezo	jon123@gmail.com	987456987	41	01020304
37	juandedios1111	castillo	castilloreupo@gmail.com	976456987	42	72860702
38	Wisner	ErnanEI	castilloreupoluis@gmail.com	344121	43	12345556
39	futher	walus	walusft@gmail.com	911233121	44	73812331
40	Jill	Valentine	jill@gmail.com	982131121	45	81223134
41	John	Castro	castrojohn@gmail.com	923123123	46	56812391
43	daniel	escribas	daniel.escriba@unmsm.edu.pe	977635821	48	80318544
47	Newton	Rolwax	johna456tv@gmail.com	981233132	52	65512312
46	ernan	goicochea	ernan1234@gmail.com	981089165	51	72960901
5	Carlos	González	carl@example.com	987654321	8	12345678
48	manuela	goimez	manuela@gmail.com	999999999	53	11111111
49	wisneria	valdiviezo	wisner.valdiviezo@unmsm.edu.pe	999999992	54	88888888
35	jaland	castillo	castillo123@gmail.com	987456987	40	02010304
42	Diego	Pacotaype	canvaweb2025@gmail.com	935001111	47	73500000
50	Jesus	Lavado Torres	pasaelmotexd@gmail.com	912331324	55	91022123
51	jilca	Lavado	jack.zavaleta@unmsm.edu.pe	935544111	56	67555555
52	alfael	waura	alfael@gmail.com	982131234	57	00012331
\.


--
-- Data for Name: documentosreclamacion; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.documentosreclamacion (documentoid, reclamacionid, nombre, extension, url, fecha_subida, estado_documento) FROM stdin;
11	17	images (2).png	png	https://res.cloudinary.com/duruqbipv/image/upload/v1738543812/Reclamaciones/p44m43eeyjnsyikul6nn.png	2025-02-03 00:50:11.501071	Pendiente
13	19	Microsoft_Office_Word_(2019âpresent).svg.png	png	https://res.cloudinary.com/duruqbipv/image/upload/v1738557040/Reclamaciones/xokyikgp72xeuybwhscz.png	2025-02-03 04:30:39.122105	Pendiente
14	19	images (1).png	png	https://res.cloudinary.com/duruqbipv/image/upload/v1738557041/Reclamaciones/sephrexwcc5d07xcj4o2.png	2025-02-03 04:30:39.122105	Pendiente
15	20	backend.png	png	https://res.cloudinary.com/duruqbipv/image/upload/v1738644666/Reclamaciones/qm2ursshiggoia2qzjgj.png	2025-02-04 04:51:05.702602	Pendiente
16	21	backend.png	png	https://res.cloudinary.com/duruqbipv/image/upload/v1738644667/Reclamaciones/bbfrdrk2faaiqsdfdjpy.png	2025-02-04 04:51:06.635031	Pendiente
20	26	PresentaciÃ³n de Sprint 1 - Grupo 3.pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1738875010/Reclamaciones/pgnmuya3l1rwtojs6iog.pdf	2025-02-06 20:50:09.242943	Pendiente
34	32	Solicitud de Beca_ LEGADO UNMSM.docx.pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1739154806/Reclamaciones/hnxbvmuyuqvt2y3yklfh.pdf	2025-02-10 02:33:25.267377	Validado
41	32	Solicitud de Beca_ LEGADO UNMSM.docx - copia (3).pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1739154807/Reclamaciones/oihqxntdaxlmuekdip19.pdf	2025-02-10 02:33:25.267377	Validado
77	47	APznzaa5H-YKjVwNEwASlfEvmLze1qB_gYEwG2b-PaOmqV04ZbbptTieO97xtKo8BYFpkDYmmBj-dCygmPQ0cbA7r1-wQEsPhAm6qg_BPQT69tOwJM2LtqLu0aExFKNN8bAinKesdMB8F6dpQqs36KBGOS7x3TAAY2-Ja1cILCwkHZjWC5HhGO5h7tw7jNOmu7AOeWdw4yUhst1bCvnCas.pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1740087483/Reclamaciones/ih3it7ub8ncfdgzmrxze.pdf	2025-02-20 21:38:02.471291	Pendiente
78	47	ADMINISTRACION -ACTUALIZACION DEL PROGRAMA CURRICULAR 2023 PRESENCIAL EPA.pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1740087485/Reclamaciones/afheietvkrei76yrioo8.pdf	2025-02-20 21:38:02.471291	Pendiente
79	48	Canva-logo.png	png	https://res.cloudinary.com/duruqbipv/image/upload/v1740454039/Reclamaciones/gbyy9eepcmwnbncnejwd.png	2025-02-25 03:27:18.985866	Pendiente
46	32	Solicitud de Beca_ LEGADO UNMSM.docx - copia (2).pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1739154808/Reclamaciones/mboidyjoldhsbarysehj.pdf	2025-02-10 02:33:25.267377	Validado
50	32	Solicitud de Beca_ LEGADO UNMSM.docx - copia (2) - copia.pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1739154809/Reclamaciones/jd1ramb53xqogqezq3vn.pdf	2025-02-10 02:33:25.267377	Validado
55	32	Solicitud de Beca_ LEGADO UNMSM.docx - copia - copia.pdf	pdf	https://res.cloudinary.com/duruqbipv/image/upload/v1739154810/Reclamaciones/hf4ojag6rgfik94leqik.pdf	2025-02-10 02:33:25.267377	Validado
81	50	images (1).jpeg	jpeg	https://res.cloudinary.com/duruqbipv/image/upload/v1740513445/Reclamaciones/q7eknhmacju2nrgqwl66.jpg	2025-02-25 19:57:25.002301	Pendiente
\.


--
-- Data for Name: pago; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.pago (pagoid, presupuestoid, cantidadpagada, fechapago) FROM stdin;
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.password_resets (id, usuarioid, reset_token, reset_expires) FROM stdin;
19	21	e6cf77bf39d7993eb4952afb2dfbcf29be35ebdee901abe7d1d4b660d61bcd1b	2025-02-05 15:35:45.635
35	10	dabc3ac931176f75945c1b549040e40ab00abf5ea244eb361cfa091c277244a3	2025-02-05 22:45:21.166
\.


--
-- Data for Name: poliza; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.poliza (polizaid, beneficiarioid, tipopoliza, fechainicio, fechafin, estado) FROM stdin;
10	9	Premium	2025-02-01	2026-02-01	Activa
7	3	Premium	2025-02-01	2026-02-01	Activa
21	22	Normal	2025-02-04	2026-02-04	Activa
13	16	Premium	2025-02-04	2026-02-04	Activa
27	35	Básica	2025-02-04	2026-02-04	Activa
28	37	Normal	2025-02-04	2026-02-04	Activa
30	38	Básica	2025-02-06	2026-02-06	Inactiva
37	39	Normal	2025-02-06	2026-02-06	Activa
40	41	Normal	2025-02-06	2026-02-06	Activa
41	42	Premium	2025-02-10	2026-02-10	Activa
8	7	Premium	2025-02-01	2026-02-01	Activa
42	43	Premium	2025-02-10	2026-02-10	Activa
43	46	Premium	2025-02-13	2026-02-13	Activa
44	47	Premium	2025-02-13	2026-02-13	Activa
11	10	Premium	2025-02-01	2026-02-01	Activa
45	49	Normal	2025-02-18	2026-02-18	Activa
39	40	Normal	2025-02-06	2026-02-06	Activa
46	50	Premium	2025-02-20	2026-02-20	Activa
48	52	Normal	2025-02-25	2026-02-25	Activa
\.


--
-- Data for Name: presupuesto; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.presupuesto (presupuestoid, siniestroid, montototal, estado, fechacreacion, detalle_presupuesto, costo_reparacion, costo_piezas_mano_obra) FROM stdin;
28	28	5000.00	Pendiente	2025-02-18 20:53:39.500491		2000.00	3000.00
32	7	5000.00	Pendiente	2025-02-20 00:41:23.029578		2000.00	3000.00
34	10	5000.00	Pendiente	2025-02-20 01:03:13.894409		2000.00	3000.00
36	26	5000.00	Pendiente	2025-02-20 01:06:08.525977		2000.00	3000.00
37	16	5000.00	Pendiente	2025-02-20 01:07:19.823784		2000.00	3000.00
38	27	5000.00	Pendiente	2025-02-20 01:11:30.961563		2000.00	3000.00
40	12	5000.00	Pendiente	2025-02-20 01:26:22.040529		2000.00	3000.00
41	13	5000.00	Pendiente	2025-02-20 01:43:46.685229		2000.00	3000.00
42	31	5000.00	Pendiente	2025-02-20 17:41:51.984271		2000.00	3000.00
25	1	8000.00	Pagado	2025-02-14 04:30:30.910555		3200.00	4800.00
10	17	4200.50	Pagado	2025-02-18 20:19:39.349	Accidente	1600.00	2600.50
46	10	5000.00	Pendiente	2025-02-27 15:38:46.409326		2000.00	3000.00
27	4	5000.00	Validado	2025-02-27 16:15:56.481		2000.00	3000.00
24	29	5000.00	Pagado	2025-02-13 20:59:17.91	Muy terrible	2000.00	3000.00
21	24	0.00	Pagado	2025-02-19 19:26:36.873		0.00	0.00
1	18	7000.00	Pagado	2025-02-18 21:43:01.139	dsas	4000.00	3000.00
45	35	3000.00	Pagado	2025-02-25 05:57:44.104	Asignarlo ahora mismo	1200.00	1800.00
44	32	5000.00	Pagado	2025-02-20 21:46:20.949	Un monto para el choque	2000.00	3000.00
26	21	5000.00	Pagado	2025-02-19 20:09:01.36		2000.00	3000.00
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.proveedores (id_proveedor, nombre_proveedor, direccion, telefono_proveedor, correo_electronico, tipo_proveedor, estado_proveedor, fecha_registro, valoracion, notas, documentos) FROM stdin;
128	Makita Tools	Japón, Anjo, 200 Makita St.	345678901	info@makita.com	Herramientas y Equipos	Activo	2025-02-20 01:46:38.029315	9.00	Proveedor de herramientas y equipos de taller	\N
129	Castrol	Reino Unido, Londres, 100 Castrol Rd.	500234567	support@castrol.com	Materiales Consumibles	Activo	2025-02-20 01:46:38.029315	9.00	Aceites, lubricantes y productos relacionados	\N
130	Snap-On Tools	EEUU, Kenosha, 1101 Snap-On Blvd.	1800987654	sales@snapon.com	Herramientas Especializadas	Activo	2025-02-20 01:46:38.029315	0.00	Herramientas especializadas para reparaciones automotrices	\N
131	Autel	China, Shenzhen, 5F, Autel Building	8621999999	contact@autel.com	Equipos de Diagnóstico y Tecnología	Activo	2025-02-20 01:46:38.029315	8.00	Equipos de diagnóstico y escáneres automotrices	\N
134	PPG Industries	EEUU, Pittsburgh, 19699 PPG Way	1800765432	info@ppg.com	Carrocería y Pintura	Activo	2025-02-20 01:46:38.029315	8.00	Suministros de pintura y productos de carrocería	\N
135	Shell	Países Bajos, La Haya, 5 Shell Blvd.	3198765432	contact@shell.com	Energía	Activo	2025-02-20 01:46:38.029315	7.00	Proveedor de combustible y energéticos para talleres	\N
136	Thermo King	EEUU, Minneapolis, 2000 Thermo Blvd.	1800567890	support@thermoking.com	Mantenimiento	Activo	2025-02-20 01:46:38.029315	8.00	Equipos y servicios de mantenimiento para vehículos refrigerados	\N
127	AutoZone Parts	EEUU, Memphis, 1234 AutoZone St.	1800123456	contact@autozone.com	Servicios de Desmontaje y Reciclaje	Activo	2025-02-20 01:46:38.029315	8.00	Proveedor de repuestos y piezas de automóviles	[]
137	Proveedor Test	prueba	938239687	contacto@proveedor.com	Herramientas Especializadas	Activo	2025-02-20 01:52:52.048304	1.00	ss	["https://res.cloudinary.com/duruqbipv/image/upload/v1740016370/Proveedores/aeibwjrfce1gqzsis2eu.png"]
138	CarTools Perú	Perú, Lima, Av. Pardo 123	014567890	contact@cartools.pe	Piezas y Componentes	Activo	2025-02-20 01:59:10.631826	8.00	Proveedor de repuestos y piezas para vehículos	\N
139	Tesin Perú	Perú, Lima, Av. Industrial 500	015678901	info@tesinperu.pe	Piezas y Componentes	Activo	2025-02-20 01:59:10.631826	9.00	Equipos y herramientas para talleres automotrices	\N
140	Honda de Perú	Perú, Lima, Av. La Molina 1200	014567890	contact@honda.pe	Piezas y Componentes	Activo	2025-02-20 01:59:10.631826	9.00	Proveedor de repuestos y accesorios para autos Honda	\N
141	Makita	Perú, Lima, Calle Alcanfores 78	014575620	contact@makita.pe	Herramientas y Equipos	Activo	2025-02-20 01:59:10.631826	8.00	Herramientas eléctricas y equipos de uso profesional	\N
142	Stanley Tools	Perú, Lima, Av. San Borja 100	014568724	info@stanleytools.pe	Herramientas y Equipos	Activo	2025-02-20 01:59:10.631826	8.00	Herramientas para reparación automotriz	\N
143	Bosch Automotive	Perú, Lima, Av. Pardo 900	014234567	contact@bosch.pe	Herramientas y Equipos	Activo	2025-02-20 01:59:10.631826	9.00	Herramientas y equipos de alta calidad para talleres	\N
144	Castrol	Perú, Lima, Av. Industrial 300	014234567	support@castrol.com	Materiales Consumibles	Activo	2025-02-20 01:59:10.631826	9.00	Aceites y lubricantes para vehículos y maquinaria	\N
145	Total Lubricants	Perú, Lima, Av. Javier Prado 123	014345678	contact@total.pe	Materiales Consumibles	Activo	2025-02-20 01:59:10.631826	8.00	Aceites y lubricantes para motores y maquinaria	\N
146	Snap-On Tools	Perú, Lima, Av. Pescadores 500	014675890	sales@snapon.com	Herramientas Especializadas	Activo	2025-02-20 01:59:10.631826	5.00	Herramientas especializadas para reparaciones automotrices	\N
147	Sears Auto	Perú, Lima, Av. Conquistadores 150	014875631	service@searsauto.com	Herramientas Especializadas	Activo	2025-02-20 01:59:10.631826	9.00	Herramientas y equipos automotrices especializados	\N
148	Autel	Perú, Lima, Calle Industrial 85	014543210	contact@autel.com.pe	Equipos de Diagnóstico y Tecnología	Activo	2025-02-20 01:59:10.631826	8.00	Equipos de diagnóstico y escáneres para vehículos	\N
150	Junk Car Removal	Perú, Lima, Av. Reciclaje 70	014323456	service@junkcar.pe	Servicios de Desmontaje y Reciclaje	Activo	2025-02-20 01:59:10.631826	7.00	Desmontaje y reciclaje de vehículos y partes	\N
151	Green Car Recycling	Perú, Lima, Av. Carrocería 100	014567899	contact@greencar.pe	Servicios de Desmontaje y Reciclaje	Activo	2025-02-20 01:59:10.631826	8.00	Reciclaje y reutilización de partes automotrices	\N
152	3M Safety	Perú, Lima, Av. Seguridad 10	014856789	sales@3m.pe	Seguridad y Protección	Activo	2025-02-20 01:59:10.631826	9.00	Equipos de seguridad para talleres y reparaciones automotrices	\N
153	Honeywell Safety	Perú, Lima, Av. Industrial 200	014675432	contact@honeywell.pe	Seguridad y Protección	Activo	2025-02-20 01:59:10.631826	8.00	Equipos de protección para personal de taller	\N
154	PPG Industries	Perú, Lima, Calle Carrocería 300	014324567	info@ppg.com.pe	Carrocería y Pintura	Activo	2025-02-20 01:59:10.631826	8.00	Pinturas y productos para carrocería automotriz	\N
155	Sherwin Williams	Perú, Lima, Av. Pintura 50	014675432	contact@sw.com.pe	Carrocería y Pintura	Activo	2025-02-20 01:59:10.631826	9.00	Proveedores de pinturas y productos para reparación de carrocerías	\N
156	Petroperú	Perú, Lima, Av. Petroperú 2000	014232343	contact@petroperu.com.pe	Energía	Activo	2025-02-20 01:59:10.631826	7.00	Proveedor de combustible y energía para talleres	\N
157	Repsol	Perú, Lima, Av. Repsol 120	014423456	contact@repsol.com.pe	Energía	Activo	2025-02-20 01:59:10.631826	8.00	Proveedor de combustibles y energía renovable	\N
158	Cummins Inc.	Perú, Lima, Av. Mantenimiento 100	014543210	service@cummins.com.pe	Mantenimiento	Activo	2025-02-20 01:59:10.631826	9.00	Servicios de mantenimiento y repuestos para motores	\N
159	Thermo King	Perú, Lima, Av. Industrial 150	014333456	support@thermoking.com.pe	Mantenimiento	Activo	2025-02-20 01:59:10.631826	8.00	Servicios y equipos de mantenimiento para vehículos refrigerados	\N
133	3M Safety	EEUU, Minneapolis, 3M Center	1800234567	sales@3m.com	Seguridad y Protección	Activo	2025-02-20 01:46:38.029315	9.00	Equipos de seguridad para talleres y reparaciones automotrices	[]
149	Bosch Diagnostics	Perú, Lima, Av. Comercio 200	014987622	info@boschdiagnostics.pe	Equipos de Diagnóstico y Tecnología	Activo	2025-02-20 01:59:10.631826	9.00	Equipos de diagnóstico automotriz	[]
132	Green Car Recycling	Alemania, Hamburgo, Recycling Str. 45	4945631287	service@greencar.com	Servicios de Desmontaje y Reciclaje	Activo	2025-02-20 01:46:38.029315	7.00	Reciclaje de autos	[]
\.


--
-- Data for Name: reclamacion; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.reclamacion (reclamacionid, siniestroid, fecha_reclamacion, estado, descripcion, tipo, observacion) FROM stdin;
47	32	2025-02-20 21:38:02.471291	Por Atender	Fue un choque	Daño Material	\N
48	1	2025-02-25 03:27:18.985866	Por Atender	wisneria	Daño Material	\N
50	35	2025-02-25 19:57:25.002301	Por Atender	No se está procesando con tiempo	Daño Material	\N
32	10	2025-02-10 02:33:25.267377	En Proceso	dwdwdwdwd	Robo Total	\N
26	23	2025-02-06 20:50:09.242943	En Proceso	El carro fue ERT123	Daño Material	\N
21	18	2025-02-04 04:51:06.635031	En Proceso	sdas	Daño Material	\N
17	1	2025-02-03 00:50:11.501071	En Proceso	FEFEFE	Robo Total	\N
20	18	2025-02-04 04:51:05.702602	En Proceso	sdas	Daño Material	\N
19	1	2025-02-03 04:30:39.122105	Resuelta	www	Daño Material	-
\.


--
-- Data for Name: siniestros; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.siniestros (siniestroid, beneficiarioid, vehiculoid, polizaid, tallerid, tipo_siniestro, fecha_siniestro, departamento, distrito, provincia, ubicacion, descripcion, documentos, created_at, fecha_asignacion, estado) FROM stdin;
7	7	\N	8	3	Accidente	2022-11-21	Lima	Lima	Lima Metropolitana	Teniente Pedro Garezon, 1 de Octubre, Lima, Lima Metropolitana, Lima, 15101, Perú	Golpe en la parte trasera del vehículo	["https://res.cloudinary.com/duruqbipv/image/upload/v1738527421/Siniestros/cccoelcttupw5qqlsnxx.jpg"]	2025-02-02 20:17:03.416945	2025-02-20 00:41:23.029578	En proceso
10	7	\N	8	1	Accidente	2034-11-21	Lima	San Martín de Porres	Lima Metropolitana	Municipalidad Distrital de San Martín de Porres, 179, Avenida Panamericana Norte, Urbanización Ingeniería, San Martín de Porres, Lima, Lima Metropolitana, Lima, 15031, Perú	Choque lateral con otro vehículo	["https://res.cloudinary.com/duruqbipv/image/upload/v1738535387/Siniestros/e2rnibghh7brd7zscdti.png"]	2025-02-02 22:29:49.177461	2025-02-27 10:38:46.409326	No asignado
1	7	\N	8	23	Choque	2025-02-01	Lima	Breña	Lima Metropolitana	F. Valdez, Chacra Colorada, Breña, Lima, Lima Metropolitana, Lima, 15082, Perú	Daño en el parabrisas por objeto externo	["https://res.cloudinary.com/duruqbipv/image/upload/v1738392846/Siniestros/sarhloxltqeyhgsimn4u.png"]	2025-02-01 06:54:07.723953	2025-02-14 04:30:30.910555	Culminado
23	41	7	40	23	Accidente	2025-02-06	Lima	Breña	Lima Metropolitana	Jirón Aguarico, Chacra Colorada, Breña, Lima, Lima Metropolitana, Lima, 15083, Perú	Chocaron mi carro	["https://res.cloudinary.com/duruqbipv/image/upload/v1738874964/Siniestros/jzpsapjxdwhvvdvq9faz.png"]	2025-02-06 20:49:26.73704	2025-02-10 16:03:06.219892	Culminado
18	16	1	13	1	Accidente	2201-01-22	Lima	Breña	Lima Metropolitana	Chacra Colorada, Breña, Lima, Lima Metropolitana, Lima, 15082, Perú	w	["https://res.cloudinary.com/duruqbipv/image/upload/v1738644644/Siniestros/epsyf4jlohvlmlqlxvus.png"]	2025-02-04 04:50:46.882542	2025-02-09 04:24:58.392977	Culminado
4	10	\N	11	2	Accidente	2001-12-23	Lima	Lima	Lima Metropolitana	Jirón Ricardo Treneman, Lima, Lima Metropolitana, Lima, 15079, Perú	hola	["https://res.cloudinary.com/duruqbipv/image/upload/v1738438160/Siniestros/k1imxlefrcidtfux38hu.png"]	2025-02-01 19:29:22.814877	2025-02-18 20:17:19.478262	Culminado
27	46	\N	43	23	Accidente	2025-01-11	Lima	San Martín de Porres	Lima Metropolitana	Institución Educativa 3030 Santisima Cruz, Avenida Panamericana Norte, Zarumilla, San Martín de Porres, Lima, Lima Metropolitana, Lima, 15101, Perú	Accidente en Av. San Juan	["https://res.cloudinary.com/duruqbipv/image/upload/v1739470477/Siniestros/ejbnkhccoxslbragtfdu.png"]	2025-02-13 18:14:39.114536	2025-02-19 20:43:30.45334	Asignado
21	10	8	11	2	Accidente	2006-11-22	Lima	Lima	Lima Metropolitana	238, Avenida Lucanas, Urbanización Barrios Altos, Lima, Lima Metropolitana, Lima, 15011, Perú	fue un accidente en tal lugar	["https://res.cloudinary.com/duruqbipv/image/upload/v1738542378/Siniestros/sj835drrykp1erlk868x.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738542379/Siniestros/vhxpj6pjyssji0kkzent.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738542379/Siniestros/tzwqdtauzvfwts6tkurd.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738542380/Siniestros/s6mpqucpnyodyef5cay2.png"]	2025-02-03 00:26:21.657234	2025-02-18 18:15:17.748409	En proceso
26	43	\N	42	2	Accidente	2001-12-11	Lima	Lima	Lima Metropolitana	Lima, Lima Metropolitana, Lima, 15082, Perú	hola	["https://res.cloudinary.com/duruqbipv/image/upload/v1739165746/Siniestros/onyhx7jmraec0vkoqpds.png"]	2025-02-10 05:35:48.405365	2025-02-19 20:44:04.075889	Asignado
25	43	1	42	2	Accidente	2001-12-11	Lima	Lima	Lima Metropolitana	ViaMix Plaza, Jirón Ramón Cárcamo, Lima, Lima Metropolitana, Lima, 15079, Perú	212	["https://res.cloudinary.com/duruqbipv/image/upload/v1739162038/Siniestros/en0ja8noalbzlldnmovc.png"]	2025-02-10 04:34:00.404453	2025-02-19 19:25:22.011717	En proceso
29	47	\N	44	6	Accidente	2025-02-13	Lima	San Isidro	Lima Metropolitana	Los Tucanes, Limatambo, San Isidro, Lima, Lima Metropolitana, Lima, 15000, Perú	Choque de 3 carros	["https://res.cloudinary.com/duruqbipv/image/upload/v1739479515/Siniestros/vklbhrh99lcxfq5yitzd.png"]	2025-02-13 20:45:17.7262	2025-02-13 20:55:06.981042	Culminado
15	10	5	11	1	Accidente	2005-02-11	Lima	San Martín de Porres	Lima Metropolitana	298, Jirón Gregorio VII, Ciudad Caquetá, San Martín de Porres, Lima, Lima Metropolitana, Lima, 15102, Perú	faniel	["https://res.cloudinary.com/duruqbipv/image/upload/v1738542538/Siniestros/v4ekx1d0ki2wqlzdbunb.pdf"]	2025-02-03 00:29:00.348284	2025-02-09 04:24:58.392977	Asignado
22	39	2	37	1	Accidente	2025-02-06	Lima	San Martín de Porres	Lima Metropolitana	20, Avenida Independencia, Urbanización Los Cipreses, San Martín de Porres, Lima, Lima Metropolitana, Lima, 15108, Perú	Me cayó un arbol	["https://res.cloudinary.com/duruqbipv/image/upload/v1738825203/Siniestros/dn9qzogcp1c2tw3dmaf4.png"]	2025-02-06 07:00:04.925465	2025-02-09 04:24:58.392977	Asignado
28	46	\N	43	6	Accidente	2025-01-11	Lima	El Agustino	Lima Metropolitana	2054, Avenida Almirante Miguel Grau, Fundo Quinta Francia, El Agustino, Lima, Lima Metropolitana, Lima, 15003, Perú	Accidente de tránsito en av Grau	["https://res.cloudinary.com/duruqbipv/image/upload/v1739470631/Siniestros/qzjyrxjhbfl71ibggdew.jpg"]	2025-02-13 18:17:14.181454	2025-02-18 20:53:39.500491	Asignado
24	42	6	41	2	Accidente	2025-02-07	Lima	Breña	Lima Metropolitana	Institución Educativa Patrocinio de San José, 780, Jirón Pomabamba, Chacra Colorada, Breña, Lima, Lima Metropolitana, Lima, 15082, Perú	HOLA	[]	2025-02-08 02:00:14.097645	2025-02-10 23:11:29.552359	Asignado
32	50	\N	46	6	Accidente	2025-02-20	Lima	San Juan de Miraflores	Lima Metropolitana	Jirón Piura, Pamplona, San Juan de Miraflores, Lima, Lima Metropolitana, Lima, 15804, Perú	Choque con un mototaxi	["https://res.cloudinary.com/duruqbipv/image/upload/v1740087409/Siniestros/o6cux61mvmvnw5msa2wm.pdf"]	2025-02-20 21:36:51.94108	2025-02-20 16:42:36.421818	\N
13	10	\N	11	6	Accidente	2006-11-22	Lima	Lima	Lima Metropolitana	238, Avenida Lucanas, Urbanización Barrios Altos, Lima, Lima Metropolitana, Lima, 15011, Perú	fue un accidente en tal lugar	["https://res.cloudinary.com/duruqbipv/image/upload/v1738542373/Siniestros/amx8fbueaupvr7w51ntl.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738542374/Siniestros/p6f6ztfbfrpvbvmcde88.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738542375/Siniestros/zavlrcfeekmiwzf5qcsu.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738542375/Siniestros/sygguwm6xd1o2xli9wqs.png"]	2025-02-03 00:26:17.94105	2025-02-19 20:43:46.685229	Asignado
17	10	9	11	6	Accidente	2001-02-11	Lima	Lima	Lima Metropolitana	Hotel Uruguay, Avenida Uruguay, Urbanización Cercado de Lima, Lima, Lima Metropolitana, Lima, 15106, Perú	1	["https://res.cloudinary.com/duruqbipv/image/upload/v1738547716/Siniestros/ooevj698jk3s6dhkllg6.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738547716/Siniestros/we2cuu6hmwufo4gozmz8.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738547718/Siniestros/wc2iqphssreq98turm5x.png"]	2025-02-03 01:55:19.910261	2025-02-19 23:41:58.034565	Asignado
16	10	\N	11	3	Accidente	2001-02-11	Lima	Lima	Lima Metropolitana	Hotel Uruguay, Avenida Uruguay, Urbanización Cercado de Lima, Lima, Lima Metropolitana, Lima, 15106, Perú	1	["https://res.cloudinary.com/duruqbipv/image/upload/v1738546892/Siniestros/gigckjtekf6phjkzflal.png"]	2025-02-03 01:41:34.856909	2025-02-20 01:07:19.823784	Asignado
33	43	\N	42	\N	Accidente	2001-12-11	Lima	Breña	Lima Metropolitana	Institución educativa inicial Happy World Kids School, 201, Jirón Napo, Chacra Colorada, Breña, Lima, Lima Metropolitana, Lima, 15082, Perú	hola	["https://res.cloudinary.com/duruqbipv/image/upload/v1740423596/Siniestros/nml5iclfugxla25hwqvq.png"]	2025-02-24 19:00:00.409221	\N	\N
34	43	\N	42	\N	Accidente	2001-12-11	Lima	Breña	Lima Metropolitana	Institución educativa inicial Happy World Kids School, 201, Jirón Napo, Chacra Colorada, Breña, Lima, Lima Metropolitana, Lima, 15082, Perú	hola	["https://res.cloudinary.com/duruqbipv/image/upload/v1740423604/Siniestros/swvfpcqxgnktaoqtzrtj.png"]	2025-02-24 19:00:06.243806	\N	\N
31	43	\N	42	3	Accidente	2001-12-11	Lima	Lima	Lima Metropolitana	Malvitec, Jirón Acomayo, Lima, Lima Metropolitana, Lima, 15079, Perú	11	["https://res.cloudinary.com/duruqbipv/image/upload/v1740032591/Siniestros/ciqlhuwsehcc2qkolnpa.png"]	2025-02-20 06:23:13.277881	2025-02-20 12:41:51.984271	Asignado
19	7	3	8	2	Accidente	2025-02-04	Lima	Lima	Lima Metropolitana	Pasaje Juliaca, Urbanización Casineli, Lima, Lima Metropolitana, Lima, 15079, Perú	Incendio en el motor del vehículo	["https://res.cloudinary.com/duruqbipv/image/upload/v1738694160/Siniestros/gjofth65httuy2txuxty.png","https://res.cloudinary.com/duruqbipv/image/upload/v1738694161/Siniestros/dj4hpmmwn314eim3tdpf.png"]	2025-02-04 18:36:04.060256	2025-02-09 04:24:58.392977	Asignado
20	7	4	8	6	Accidente	2025-02-10	Lima	San Martín de Porres	Lima Metropolitana	1, Jirón Carlos La Torre, Urb. El Rosario, San Martín de Porres, Lima, Lima Metropolitana, Lima, 15103, Perú	Robo de autopartes en el estacionamiento	["https://res.cloudinary.com/duruqbipv/image/upload/v1738700326/Siniestros/v2skuvbklutgbkiml2pc.png"]	2025-02-04 20:18:48.39726	2025-02-19 23:45:23.261749	Asignado
35	52	\N	48	2	Choque moto	2025-02-25	Lima	La Molina	Lima Metropolitana	Avenida Alameda del Corregidor, Las Colinas de la Molina, La Molina, Lima, Lima Metropolitana, Lima, 15051, Perú	Sali volando	["https://res.cloudinary.com/duruqbipv/image/upload/v1740461066/Siniestros/guk9ulx3ikfdjcd8sbir.pdf"]	2025-02-25 05:24:28.145347	2025-02-25 00:35:09.85267	\N
12	7	\N	8	\N	Accidente	3333-11-21	Lima	San Martín de Porres	Lima Metropolitana	2, Calle Las Cerezas, Urb. El Rosario, San Martín de Porres, Lima, Lima Metropolitana, Lima, 15103, Perú	Inundación por lluvias extremas	["https://res.cloudinary.com/duruqbipv/image/upload/v1738537700/Siniestros/kcuh0qp0eiecyx1fm3oj.png"]	2025-02-02 23:08:23.018451	2025-02-20 01:26:22.040529	No asignado
\.


--
-- Data for Name: taller; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.taller (tallerid, nombre, direccion, capacidad, estado, telefono, estadoactual) FROM stdin;
1	Taller Mecánico A	Av. Industrial 123	13	Disponible	987654321	4
23	Taller M	Calle 123, Lima	23	Disponible	955443322	4
2	Taller B	Av. Industrial 456, Arequipa	13	Disponible	998877667	9
6	Taller Oficial	Av. Principal 123	14	Disponible	987654321	7
3	Taller C	Jr. Comercial 789, Trujillo	11	Disponible	955443322	4
\.


--
-- Data for Name: talleres_proveedores; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.talleres_proveedores (taller_id, proveedor_id, nombre_taller, nombre_proveedor) FROM stdin;
6	128	Taller Oficial	Makita Tools
6	130	Taller Oficial	Snap-On Tools
1	131	Taller Mecánico A	Autel
2	128	Taller B	Makita Tools
2	131	Taller B	Autel
2	133	Taller B	3M Safety
2	129	Taller B	Castrol
3	129	Taller C	Castrol
3	131	Taller C	Autel
3	144	Taller C	Castrol
3	146	Taller C	Snap-On Tools
23	141	Taller M	Makita
23	143	Taller M	Bosch Automotive
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.usuario (usuarioid, nombre, apellido, email, password, rol) FROM stdin;
1	Lucas	Crystal	lucas@example.com	$2b$10$cLfNH4EluR3ar2eP78KVneOmR5V1uI5LJZfDYj5blnlzHlA93apZq	Personal
4	ernanei	chipana	maur@example.com	$2b$10$PtJtQuzJOr7qjAxfIJKqzOeRPmNft2/KketCHDsXmAhR5KjG3.zLi	Beneficiario
36	michael	venom	venom@gmail.com	$2b$10$BYrFWIgHKobM22CWsQj16uGlIgh54HY9FkQAAIGuyKoGRvgm4G9rG	Beneficiario
2	Juan	Pérez	juan@example.com	$2b$10$W5t7Ro2hV1MWgrlF9mHwiuMU7I6awLGvYKxK/FWnlKCInwM7qR9jW	Beneficiario
5	Pepe	Zaza	zaza@example.com	$2b$10$CrV9SOW0PeZw8KQly7Bdaene9UvGmU3eZ.9EJnVAxVEqg54mrdUqG	Administrador
3	Hunk	Robles	hunk@example.com	$2b$10$rKcQp9drUHIImDTZBPHfOerTUd/YSxZTZ5i/JmWUyh2oIKETSRr.y	Beneficiario
9	siniestro	zero	zero@email.com	$2b$10$Q.KuziCujbguKtKAVlnASewRzEGrnpAIlU1fsRoQuJp19TukDUM6i	Beneficiario
11	ryan	mcarty	ryan@hi.com	$2b$10$pBZX1BpPsK1NPMWjHKdu0OCBqirNAWePb2kweRB0pIHSY2mA0uwoS	Beneficiario
12	pritar	rikard	snake@gmail.com	$2b$10$GdOykfxFkVkcKjuxQbLzzeQy3hqKL6P6JWmSp6IWCbxwdnEzzm9RS	Beneficiario
13	daniel	escribas	prueba@gmail.com	$2b$10$ZoqfIdRdwvrE59wMdzG1IOWQbAUWf8Tq3tiUJPBhJUXVOLT8dxvXG	Beneficiario
15	xokas	waks	ppxo@gmail.com	$2b$10$b0DGiIgcuXc6sOs9A3wvFu6MFNvwbyYRSQlgTa7yUI35a849in.Be	Beneficiario
37	jesus	jesusss	jesuss@gmail.com	$2b$10$Uqd2LKF1.vD./gC16xZlruZYeCNxuOZ4TUDJFR0waioteMCKNlFC.	Beneficiario
38	holaa	lopez	wisnerva22@gmail.com	$2b$10$d51pezEqHv0u0/q63r2eGeuf8k4GBWlP/BhYXrpGU5NLiMHfge3n6	Beneficiario
39	Kike	Page	kikepage@gmail.com	$2b$10$uPYi3kJQ/lYjyLMdpCv6Felir4wT43kKnbYm0vSm0P2Lj2lUN974q	Beneficiario
16	Marco	Lavado	Marcolavado.18@gmail.com	$2b$10$facEHwwUconmsH2cPHDbYetLqIDGZIaoId2mykpfZYXYYSZNVobtO	Beneficiario
18	Jack	lujan carrion	zavaletaryan.18@gmail.com	$2b$10$tq4QL8dHrc2qDmjw7FYQTOLsPZoCulez/M/l5cDC0BNac2/UyPNXW	Beneficiario
41	jonei1ww	valdiviezo	jon123@gmail.com	$2b$10$g0wur505aIroXF5rR0cBguS3hNfTOI1afJsnn/Kvi0x8vtTs8H1y.	Beneficiario
19	speed	lujan carrion	ryanzavaleta.18@gmail.com	$2b$10$tmw06E5hbHp2HixhboqBPuBW205dPDRD3OvuK0vjn8YrEy3M4wV5.	Beneficiario
42	juandedios	castillo	castilloreupo@gmail.com	$2b$10$nw08Vp.wgfF36byTuB5Yku6cxTPDg82txiOfWaCwZ7ChYzZI2NpEW	Beneficiario
43	Wisner	ErnanEI	castilloreupoluis@gmail.com	$2b$10$hCP0pM0eGWy/ELg3ybmzk.OVklD0sql.gAW2Ef7TviJj3L3I2GfLy	Beneficiario
20	juan	carlos	juancarlos@gmail.com	$2b$10$6tju0xW67vx7at60Pg0TWei.WWFrlNanX3o7hRdkmI0LOt.EvdWuS	Beneficiario
21	daniel	escribas	daniel.escribas@unmsm.edu.pe	$2b$10$vpx1lhp2DCl7He/zQiGFnekzrKT4Ii6eBHbkRdUo0nePPQzMiL00W	Beneficiario
10	ernanei	valdiviezo	wisnerva@gmail.com	$2b$10$dOhShfwK.7qPe2t9liMcgeS58mDZJmXbtyitKaXxF8RDuOysaYfnW	Beneficiario
27	luis	roque	roque@gmail.com	$2b$10$mWAuO3sEEIsRYgsSSxJJeeVDTuQLOS4ZQMVCMyIAiLYdcpK2iVhme	Beneficiario
29	hola	valdiviezo	wisneria@gmail.com	$2b$10$gUlyHYqnblVB/SxVfEv4JuP.BSA1i6in0hgFY.AnkZt0TtnFndbfa	Beneficiario
30	milano	jeruzalen	keke123@gmail.com	$2b$10$jIubwilJfj/CJiNfqVc8ouuWai7YOUhGnp6jG4Dk3NZHYeTXBp5Z.	Beneficiario
44	futher	walus	walusft@gmail.com	$2b$10$/qg0tonrNEN.0k7fzj0n6eDNcAhocKd6A4effSOvv7hbSynXi7/YO	Beneficiario
45	Jill	Valentine	jill@gmail.com	$2b$10$Lb1QmyvvjLdzctQDIcw6tenpLv1VjlEACYALBUcBkwRlPLvu6aghe	Beneficiario
46	John	Castro	castrojohn@gmail.com	$2b$10$4j7y14kOj7gstgv7nG1pMuiA.MiKO/pKnNfimNI03S/3AeVWcmway	Beneficiario
48	daniel	escribas	daniel.escriba@unmsm.edu.pe	$2b$10$ICVfUqVPu4sEp1EiYdUB5OacysManUXnQdU2lrP1XdcJ8blUfj0w6	Beneficiario
54	wisneria	valdiviezo	wisner.valdiviezo@unmsm.edu.pe	$2b$10$z5kEQ/WxmWXg8INNSZRw4.DRX50NWyCDml6EJ7Z5bS7TSM2VwnFvK	Beneficiario
17	Nuevo	Usuario	nuevo.usuario@example.com	$2b$10$bCBkAcGn/Hq1GAHOfRazi.w/GacaqR4kpF6oK5UzTZHYBSzvNF5hO	Personal
52	Newton	Rolwax	johna456tv@gmail.com	$2b$10$Nrom8fsi1bjs54BTIPZtk.sOw1rRIGIc.26UCOF8DC2tShnBHx/WS	Beneficiario
51	ernan	goicochea	ernan123@gmail.com	$2b$10$pxSPqi8AMvVQRYq1eS7./urKRwMi/BaWTQokO7BUE6U9Ro9ypy/3i	Beneficiario
8	Carlos	González	carl@example.com	$2b$10$vM0DRAHu.cxcYOZOGFzQK.b7Xh5ICm4fDOWhGv8rHATwo/S0zacha	Beneficiario
53	manuela	goimez	manuela@gmail.com	$2b$10$FY/t/pCF7enOHn3Hsh9TmuKp38DGvToaYb/d3zIjwKo5mNECqlObK	Beneficiario
28	jesus	pérezx	wisnergo@gmail.com	$2b$10$Rz1.NVW4i6d/5elrm2VgOORzo1AG/y0zxaDhyI/E1L1pXPG.qKDhO	Beneficiario
40	jaland	castillo	castillo123@gmail.com	$2b$10$1TpdxCih4XrHCaP2TFd4YOSrZcWEOw5fI99EKN9JBlkLDqeEdn4Ey	Beneficiario
56	jilca	Lavado	jack.zavaleta@unmsm.edu.pe	$2b$10$ogfySsx697iBDMPUVVTGquuKUQ7FHaOMfcbl96Hq60c.dn9GYfDCy	Beneficiario
57	alfael	waura	alfael@gmail.com	$2b$10$8GoRv58YSzYCTKOvw80J1OcpuQ9kPV519iN7dWTRCaStLUt1hfuOG	Beneficiario
47	Diego	Pacotaype	canvaweb2025@gmail.com	$2b$10$DFtzlw8PsBeufv0rwASiceXy.JQnsLlEAEGS4D/zIw/ffIwJeX2Qa	Beneficiario
55	Jesus	Lavado Torres	pasaelmotexd@gmail.com	$2b$10$ipLLWz9fa9BwWinGhbncOO6SKvB1niY.69TIIgInpkRA.IJSzd8Ge	Beneficiario
\.


--
-- Data for Name: vehiculo; Type: TABLE DATA; Schema: public; Owner: seguros_user
--

COPY public.vehiculo (vehiculoid, placa, marca, modelo, tipo, beneficiarioid) FROM stdin;
10	ABC-122	Toyota	Corolla	Sed�n	\N
13	ABC-444	Toyota	Corolla	Sed�n	\N
15	YYY-111	Toysss	Carola	Pickup	\N
7	PQR-159	Kia	Rio	Sedán	41
1	ABC-123	Toyota	Corolla	Sedán	16
8	STU-753	Nissan	Versa	Sedán	10
3	DEF-456	Ford	F-150	Pickup	7
5	JKL-654	Mazda	CX-5	SUV	10
2	XYZ-789	Honda	Civic	Sedán	39
6	MNO-987	Hyundai	Tucson	SUV	42
9	JJJ-000	HONDA	OXYGEN	SEDAN	10
4	GHI-321	Chevrolet	Spark	Hatchback	7
27	XXX-111	Toyota	Corolla	Pickup	51
\.


--
-- Name: beneficiario_beneficiarioid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.beneficiario_beneficiarioid_seq', 52, true);


--
-- Name: documentosreclamacion_documentoid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.documentosreclamacion_documentoid_seq', 81, true);


--
-- Name: pago_pagoid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.pago_pagoid_seq', 1, false);


--
-- Name: password_resets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.password_resets_id_seq', 36, true);


--
-- Name: poliza_polizaid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.poliza_polizaid_seq', 48, true);


--
-- Name: presupuesto_presupuestoid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.presupuesto_presupuestoid_seq', 46, true);


--
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.proveedores_id_proveedor_seq', 159, true);


--
-- Name: reclamacion_reclamacionid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.reclamacion_reclamacionid_seq', 50, true);


--
-- Name: siniestros_siniestroid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.siniestros_siniestroid_seq', 35, true);


--
-- Name: taller_tallerid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.taller_tallerid_seq', 44, true);


--
-- Name: usuario_usuarioid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.usuario_usuarioid_seq', 57, true);


--
-- Name: vehiculo_vehiculoid_seq; Type: SEQUENCE SET; Schema: public; Owner: seguros_user
--

SELECT pg_catalog.setval('public.vehiculo_vehiculoid_seq', 27, true);


--
-- Name: beneficiario beneficiario_email_key; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.beneficiario
    ADD CONSTRAINT beneficiario_email_key UNIQUE (email);


--
-- Name: beneficiario beneficiario_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.beneficiario
    ADD CONSTRAINT beneficiario_pkey PRIMARY KEY (beneficiarioid);


--
-- Name: documentosreclamacion documentosreclamacion_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.documentosreclamacion
    ADD CONSTRAINT documentosreclamacion_pkey PRIMARY KEY (documentoid);


--
-- Name: pago pago_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT pago_pkey PRIMARY KEY (pagoid);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_reset_token_key; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_reset_token_key UNIQUE (reset_token);


--
-- Name: poliza poliza_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.poliza
    ADD CONSTRAINT poliza_pkey PRIMARY KEY (polizaid);


--
-- Name: presupuesto presupuesto_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.presupuesto
    ADD CONSTRAINT presupuesto_pkey PRIMARY KEY (presupuestoid);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id_proveedor);


--
-- Name: reclamacion reclamacion_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.reclamacion
    ADD CONSTRAINT reclamacion_pkey PRIMARY KEY (reclamacionid);


--
-- Name: siniestros siniestros_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.siniestros
    ADD CONSTRAINT siniestros_pkey PRIMARY KEY (siniestroid);


--
-- Name: taller taller_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.taller
    ADD CONSTRAINT taller_pkey PRIMARY KEY (tallerid);


--
-- Name: talleres_proveedores talleres_proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.talleres_proveedores
    ADD CONSTRAINT talleres_proveedores_pkey PRIMARY KEY (taller_id, proveedor_id);


--
-- Name: beneficiario unique_dni; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.beneficiario
    ADD CONSTRAINT unique_dni UNIQUE (dni);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (usuarioid);


--
-- Name: vehiculo vehiculo_pkey; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.vehiculo
    ADD CONSTRAINT vehiculo_pkey PRIMARY KEY (vehiculoid);


--
-- Name: vehiculo vehiculo_placa_key; Type: CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.vehiculo
    ADD CONSTRAINT vehiculo_placa_key UNIQUE (placa);


--
-- Name: idx_reclamacion_fecha; Type: INDEX; Schema: public; Owner: seguros_user
--

CREATE INDEX idx_reclamacion_fecha ON public.reclamacion USING btree (fecha_reclamacion);


--
-- Name: idx_reclamacion_siniestro; Type: INDEX; Schema: public; Owner: seguros_user
--

CREATE INDEX idx_reclamacion_siniestro ON public.reclamacion USING btree (siniestroid);


--
-- Name: beneficiario actualizar_usuario_beneficiario; Type: TRIGGER; Schema: public; Owner: seguros_user
--

CREATE TRIGGER actualizar_usuario_beneficiario AFTER UPDATE ON public.beneficiario FOR EACH ROW EXECUTE FUNCTION public.actualizar_usuario_beneficiario();


--
-- Name: talleres_proveedores before_insert_talleres_proveedores; Type: TRIGGER; Schema: public; Owner: seguros_user
--

CREATE TRIGGER before_insert_talleres_proveedores BEFORE INSERT ON public.talleres_proveedores FOR EACH ROW EXECUTE FUNCTION public.set_names_on_talleres_proveedores();


--
-- Name: taller tr_actualizar_estado_taller_al_cambiar_capacidad; Type: TRIGGER; Schema: public; Owner: seguros_user
--

CREATE TRIGGER tr_actualizar_estado_taller_al_cambiar_capacidad AFTER UPDATE OF capacidad ON public.taller FOR EACH ROW EXECUTE FUNCTION public.actualizar_estado_taller_al_cambiar_capacidad();


--
-- Name: siniestros tr_crear_presupuesto; Type: TRIGGER; Schema: public; Owner: seguros_user
--

CREATE TRIGGER tr_crear_presupuesto AFTER UPDATE OF tallerid ON public.siniestros FOR EACH ROW WHEN (((new.tallerid IS NOT NULL) AND (old.tallerid IS DISTINCT FROM new.tallerid))) EXECUTE FUNCTION public.trigger_crear_presupuesto();


--
-- Name: siniestros trg_actualizar_estado_actual; Type: TRIGGER; Schema: public; Owner: seguros_user
--

CREATE TRIGGER trg_actualizar_estado_actual AFTER INSERT OR UPDATE ON public.siniestros FOR EACH ROW EXECUTE FUNCTION public.actualizar_estado_actual();


--
-- Name: poliza fk_beneficiario; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.poliza
    ADD CONSTRAINT fk_beneficiario FOREIGN KEY (beneficiarioid) REFERENCES public.beneficiario(beneficiarioid);


--
-- Name: siniestros fk_beneficiario; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.siniestros
    ADD CONSTRAINT fk_beneficiario FOREIGN KEY (beneficiarioid) REFERENCES public.beneficiario(beneficiarioid);


--
-- Name: vehiculo fk_beneficiario; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.vehiculo
    ADD CONSTRAINT fk_beneficiario FOREIGN KEY (beneficiarioid) REFERENCES public.beneficiario(beneficiarioid) ON DELETE SET NULL;


--
-- Name: poliza fk_beneficiarioid; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.poliza
    ADD CONSTRAINT fk_beneficiarioid FOREIGN KEY (beneficiarioid) REFERENCES public.beneficiario(beneficiarioid) ON DELETE CASCADE;


--
-- Name: siniestros fk_poliza; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.siniestros
    ADD CONSTRAINT fk_poliza FOREIGN KEY (polizaid) REFERENCES public.poliza(polizaid);


--
-- Name: pago fk_presupuesto; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.pago
    ADD CONSTRAINT fk_presupuesto FOREIGN KEY (presupuestoid) REFERENCES public.presupuesto(presupuestoid);


--
-- Name: talleres_proveedores fk_proveedor; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.talleres_proveedores
    ADD CONSTRAINT fk_proveedor FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id_proveedor) ON DELETE CASCADE;


--
-- Name: documentosreclamacion fk_reclamacion; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.documentosreclamacion
    ADD CONSTRAINT fk_reclamacion FOREIGN KEY (reclamacionid) REFERENCES public.reclamacion(reclamacionid) ON DELETE CASCADE;


--
-- Name: presupuesto fk_siniestro; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.presupuesto
    ADD CONSTRAINT fk_siniestro FOREIGN KEY (siniestroid) REFERENCES public.siniestros(siniestroid);


--
-- Name: reclamacion fk_siniestro; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.reclamacion
    ADD CONSTRAINT fk_siniestro FOREIGN KEY (siniestroid) REFERENCES public.siniestros(siniestroid) ON DELETE CASCADE;


--
-- Name: siniestros fk_taller; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.siniestros
    ADD CONSTRAINT fk_taller FOREIGN KEY (tallerid) REFERENCES public.taller(tallerid);


--
-- Name: talleres_proveedores fk_taller; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.talleres_proveedores
    ADD CONSTRAINT fk_taller FOREIGN KEY (taller_id) REFERENCES public.taller(tallerid) ON DELETE CASCADE;


--
-- Name: beneficiario fk_usuarioid; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.beneficiario
    ADD CONSTRAINT fk_usuarioid FOREIGN KEY (usuarioid) REFERENCES public.usuario(usuarioid) ON DELETE CASCADE;


--
-- Name: siniestros fk_vehiculo; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.siniestros
    ADD CONSTRAINT fk_vehiculo FOREIGN KEY (vehiculoid) REFERENCES public.vehiculo(vehiculoid);


--
-- Name: password_resets password_resets_usuarioid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seguros_user
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_usuarioid_fkey FOREIGN KEY (usuarioid) REFERENCES public.usuario(usuarioid) ON DELETE CASCADE;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT blk_read_time double precision, OUT blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision) TO seguros_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO seguros_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO seguros_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO seguros_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO seguros_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO seguros_user;


--
-- PostgreSQL database dump complete
--

