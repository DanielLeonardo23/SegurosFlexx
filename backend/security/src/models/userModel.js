"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePasswordResetToken = exports.updateUserPassword = exports.findPasswordResetToken = exports.findUserByEmail2 = exports.savePasswordResetToken = exports.createUser = exports.findUserByEmail = void 0;
const db_1 = __importDefault(require("../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
// Función para buscar un usuario por su correo electrónico
const findUserByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield db_1.default.query('SELECT usuarioid as UsuarioID, nombre as Nombre, apellido as Apellido, email as Email, password as Password, rol as Rol FROM usuario WHERE email = $1 LIMIT 1', [email]);
        // Si no se encuentra el usuario, retornamos null
        if (rows.length === 0) {
            return null;
        }
        // Retornamos el primer resultado encontrado
        return rows[0];
    }
    catch (error) {
        console.error('Error al ejecutar findUserByEmail:', error);
        throw new Error('Error en la base de datos');
    }
});
exports.findUserByEmail = findUserByEmail;
// Función para crear un usuario
const createUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Llamada al procedimiento almacenado para crear el usuario
        yield db_1.default.query('INSERT INTO usuario (nombre, apellido, email, password, rol) VALUES ($1, $2, $3, $4, $5)', [user.Nombre, user.Apellido, user.Email, user.Password, user.Rol]);
    }
    catch (error) {
        console.error('Error al crear el usuario:', error);
        throw new Error('Error en la base de datos');
    }
});
exports.createUser = createUser;
const savePasswordResetToken = (usuarioid, token, expiresAt) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Eliminar tokens anteriores del usuario
        yield db_1.default.query("DELETE FROM password_resets WHERE usuarioid = $1", [usuarioid]);
        // Insertar el nuevo token en la tabla password_resets
        yield db_1.default.query("INSERT INTO password_resets (usuarioid, reset_token, reset_expires) VALUES ($1, $2, $3)", [usuarioid, token, expiresAt]);
    }
    catch (error) {
        console.error("Error al guardar el token de recuperación:", error);
        throw new Error("Error en la base de datos");
    }
});
exports.savePasswordResetToken = savePasswordResetToken;
// Función para buscar un token de recuperación
const findUserByEmail2 = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield db_1.default.query('SELECT usuarioid, nombre, apellido, email, password, rol FROM usuario WHERE email = $1 LIMIT 1', [email]);
        // Si no se encuentra el usuario, retornamos null
        if (rows.length === 0) {
            return null;
        }
        console.log("📌 Query devuelve:", rows[0]); // 🛠️ Debug
        // Retornamos el primer resultado encontrado
        return rows[0];
    }
    catch (error) {
        console.error('Error al ejecutar findUserByEmail:', error);
        throw new Error('Error en la base de datos');
    }
});
exports.findUserByEmail2 = findUserByEmail2;
const findPasswordResetToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield db_1.default.query("SELECT usuarioid, reset_expires FROM password_resets WHERE reset_token = $1 AND reset_expires > NOW() LIMIT 1", [token]);
        return rows.length > 0 ? rows[0] : null;
    }
    catch (error) {
        console.error("Error al buscar el token:", error);
        throw new Error("Error en la base de datos");
    }
});
exports.findPasswordResetToken = findPasswordResetToken;
const updateUserPassword = (usuarioid, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        yield db_1.default.query("UPDATE usuario SET password = $1 WHERE usuarioid = $2", [hashedPassword, usuarioid]);
    }
    catch (error) {
        console.error("Error al actualizar la contraseña:", error);
        throw new Error("Error en la base de datos");
    }
});
exports.updateUserPassword = updateUserPassword;
const deletePasswordResetToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db_1.default.query("DELETE FROM password_resets WHERE reset_token = $1", [token]);
    }
    catch (error) {
        console.error("Error al eliminar el token de recuperación:", error);
        throw new Error("Error en la base de datos");
    }
});
exports.deletePasswordResetToken = deletePasswordResetToken;
