# -- Build stage: compila el bundle web de Expo --------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias primero (aprovecha cache de Docker)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copiar el resto del codigo
COPY . .

# La API key se pasa como build arg para que quede embebida en el bundle estatico
# (EXPO_PUBLIC_ variables son sustituidas en tiempo de build, no de runtime)
ARG EXPO_PUBLIC_API_KEY
ENV EXPO_PUBLIC_API_KEY=$EXPO_PUBLIC_API_KEY

ARG EXPO_PUBLIC_API_URL=http://localhost:8000
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Exportar como SPA web estatica
RUN npx expo export --platform web


# -- Runtime stage: nginx sirve los archivos estaticos -------------------------
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/salas.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
