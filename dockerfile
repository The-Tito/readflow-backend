# Usamos una imagen ligera de Node
FROM node:20-alpine

# Instalamos dependencias necesarias para que Prisma funcione en Alpine
# (OpenSSL es crítico para que Prisma se conecte a Postgres)
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
# Copiamos la carpeta de prisma antes de instalar para poder generar el cliente
COPY prisma ./prisma/

ARG NODE_ENV
RUN if [ "$NODE_ENV" = "production" ]; then \
      npm install --omit=dev; \
    else \
      npm install; \
    fi

# GENERAMOS EL CLIENTE DE PRISMA
# Esto es vital para que TypeScript/JavaScript reconozca tus modelos
RUN npx prisma generate

COPY . .

EXPOSE 3333

ENV NODE_ENV $NODE_ENV

# Ajustamos el comando de inicio
# En desarrollo, a veces es útil correr las migraciones automáticamente
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'production' ]; then npx prisma migrate deploy && npm start; else npx prisma generate && npm run dev; fi"]