import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException, status
from app.config import get_settings

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
}


def save_upload(file: UploadFile, subfolder: str) -> str:
    """
    Menyimpan file yang di-upload ke dalam folder uploads/{subfolder}/{uuid}_{filename}.
    Validasi ukuran file maksimum (berdasarkan config) dan tipe konten (gambar/PDF).
    Mengembalikan path URL (misal: /uploads/logo/123_logo.png).
    """
    settings = get_settings()

    # Validate file type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipe file '{file.content_type}' tidak diizinkan. Harap upload gambar (JPG/PNG/WEBP) atau PDF.",
        )

    # Prepare directory
    target_dir = os.path.join(settings.upload_dir, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    # Validate file size by reading chunk or checking file
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ukuran file melebisi batas maksimum ({settings.max_upload_size_mb} MB).",
        )

    # Generate filename
    unique_id = uuid.uuid4().hex[:8]
    # Sanitize filename
    clean_filename = "".join(c for c in (file.filename or "file") if c.isalnum() or c in "._- ")
    filename = f"{unique_id}_{clean_filename}"
    file_path = os.path.join(target_dir, filename)

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal menyimpan file: {str(e)}",
        )

    # Return URL path formatted with forward slashes for URLs
    return f"/{settings.upload_dir}/{subfolder}/{filename}".replace("//", "/")
