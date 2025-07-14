# Usar una imagen base de Node.js LTS
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package.json ./

# Instalar dependencias de forma más tolerante
RUN npm install --legacy-peer-deps --force || npm install --force
RUN npm cache clean --force

# Copiar el resto de archivos
COPY . ./

# Crear directorio para uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 4000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
