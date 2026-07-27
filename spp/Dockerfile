# ─── Stage 1: Build Frontend (Vite / React / TypeScript) ───
FROM node:20-alpine AS builder

WORKDIR /app

# Salin file package.json dan install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Salin seluruh kode frontend
COPY . .

# Build arg untuk konfigurasi URL API saat waktu kompilasi
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

# Lakukan kompilasi TypeScript dan build produksi Vite
RUN npm run build

# ─── Stage 2: Production Server (Nginx Alpine) ───
FROM nginx:alpine

# Hapus konfigurasi default Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Salin konfigurasi Nginx khusus
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Salin hasil build statis dari Stage 1 ke direktori Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port HTTP
EXPOSE 80

# Jalankan Nginx di foreground
CMD ["nginx", "-g", "daemon off;"]
