# Base image Python 3.12 Slim untuk efisiensi ukuran dan keamanan
FROM python:3.12-slim

# Set environment variables untuk Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install dependencies sistem dasar jika dibutuhkan oleh ReportLab / OpenPyXL / Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory di dalam kontainer
WORKDIR /app

# Salin file requirements.txt dan install dependencies Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode aplikasi backend
COPY . .

# Buat direktori upload jika belum ada
RUN mkdir -p uploads

# Expose port aplikasi
EXPOSE 8000

# Perintah default untuk menjalankan aplikasi menggunakan Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
