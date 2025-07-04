import pool from '../config/db';
import bcrypt from "bcrypt";
// Definimos la interfaz para el usuario
export interface User {
  UsuarioID?: number;
  Nombre: string;
  Apellido: string;
  Email: string;
  Password: string;
  Rol: 'Personal' | 'Administrador' | 'Beneficiario';
}

export interface User2 {
  usuarioid?: number; // Cambia UsuarioID a usuarioid
  nombre: string;     // Cambia Nombre a nombre
  apellido: string;   // Cambia Apellido a apellido
  email: string;      // Cambia Email a email
  password: string;   // Cambia Password a password
  rol: 'Personal' | 'Administrador' | 'Beneficiario'; // Cambia Rol a rol
}

// Función para buscar un usuario por su correo electrónico
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { rows } = await pool.query(
      'SELECT usuarioid as UsuarioID, nombre as Nombre, apellido as Apellido, email as Email, password as Password, rol as Rol FROM usuario WHERE email = $1 LIMIT 1',
      [email]
    );

    // Si no se encuentra el usuario, retornamos null
    if (rows.length === 0) {
      return null;
    }

    // Retornamos el primer resultado encontrado
    return rows[0];
  } catch (error) {
    console.error('Error al ejecutar findUserByEmail:', error);
    throw new Error('Error en la base de datos');
  }
};

// Función para crear un usuario
export const createUser = async (user: User): Promise<void> => {
  try {
    // Llamada al procedimiento almacenado para crear el usuario
    await pool.query(
      'INSERT INTO usuario (nombre, apellido, email, password, rol) VALUES ($1, $2, $3, $4, $5)',
      [user.Nombre, user.Apellido, user.Email, user.Password, user.Rol]
    );
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    throw new Error('Error en la base de datos');
  }
};


export const savePasswordResetToken = async (usuarioid: number, token: string, expiresAt: Date): Promise<void> => {
  try {
    // Eliminar tokens anteriores del usuario
    await pool.query("DELETE FROM password_resets WHERE usuarioid = $1", [usuarioid]);

    // Insertar el nuevo token en la tabla password_resets
    await pool.query(
      "INSERT INTO password_resets (usuarioid, reset_token, reset_expires) VALUES ($1, $2, $3)",
      [usuarioid, token, expiresAt]
    );
  } catch (error) {
    console.error("Error al guardar el token de recuperación:", error);
    throw new Error("Error en la base de datos");
  }
};

// Función para buscar un token de recuperación

export const findUserByEmail2 = async (email: string): Promise<User2 | null> => {
  try {
    const { rows } = await pool.query(
      'SELECT usuarioid, nombre, apellido, email, password, rol FROM usuario WHERE email = $1 LIMIT 1',
      [email]
    );

    // Si no se encuentra el usuario, retornamos null
    if (rows.length === 0) {
      return null;
    }
    console.log("📌 Query devuelve:", rows[0]); // 🛠️ Debug
    // Retornamos el primer resultado encontrado
    return rows[0];
  } catch (error) {
    console.error('Error al ejecutar findUserByEmail:', error);
    throw new Error('Error en la base de datos');
  }
};

export const findPasswordResetToken = async (token: string) => {
  try {
    const { rows } = await pool.query(
      "SELECT usuarioid, reset_expires FROM password_resets WHERE reset_token = $1 AND reset_expires > NOW() LIMIT 1",
      [token]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("Error al buscar el token:", error);
    throw new Error("Error en la base de datos");
  }
};

export const updateUserPassword = async (usuarioid: number, newPassword: string) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE usuario SET password = $1 WHERE usuarioid = $2", [hashedPassword, usuarioid]);
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    throw new Error("Error en la base de datos");
  }
};

export const deletePasswordResetToken = async (token: string) => {
  try {
    await pool.query("DELETE FROM password_resets WHERE reset_token = $1", [token]);
  } catch (error) {
    console.error("Error al eliminar el token de recuperación:", error);
    throw new Error("Error en la base de datos");
  }
};