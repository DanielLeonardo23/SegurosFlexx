# Build stage
FROM node:18-alpine as build

WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluidas las de desarrollo)
RUN npm install && npm cache clean --force

# Copiar código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puerto
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
