import io
import os
from datetime import datetime
from decimal import Decimal
from typing import Optional, Tuple

from PIL import Image, ImageDraw, ImageFont
import qrcode
from reportlab.lib.pagesizes import A5, letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from sqlmodel import Session, select

from app.models import Receipt, Payment, Student, Bill, SchoolSetting


def get_school_profile(session: Session) -> dict:
    """Mengambil profil sekolah dari table school_settings."""
    settings = session.exec(select(SchoolSetting)).all()
    setting_map = {s.key: s.value for s in settings}
    return {
        "name": setting_map.get("school_name", "PTDARRAHMAN"),
        "address": setting_map.get("school_address", "Jl. Raya PTDARRAHMAN No. 1, Jakarta"),
        "phone": setting_map.get("school_phone", "(021) 1234567"),
        "logo_url": setting_map.get("school_logo", ""),
    }


def get_font(size: int, bold: bool = False):
    """Mencoba memuat font TrueType beresolusi baik dengan fallback ke default."""
    try:
        if os.name == "nt":
            font_path = "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf"
            if not os.path.exists(font_path):
                font_path = "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf"
            return ImageFont.truetype(font_path, size)
        else:
            font_name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
            return ImageFont.truetype(font_name, size)
    except Exception:
        return ImageFont.load_default()


def get_payment_and_receipt_data(session: Session, identifier: str) -> Tuple[Receipt, Payment, Student, str, dict]:
    """
    Mengambil data lengkap untuk rendering kuitansi.
    identifier bisa berupa payment_id (digit) atau receipt_number (string KWT/...).
    """
    receipt = None
    if identifier.isdigit():
        receipt = session.exec(select(Receipt).where(Receipt.payment_id == int(identifier))).first()
        if not receipt:
            receipt = session.get(Receipt, int(identifier))
    if not receipt:
        receipt = session.exec(select(Receipt).where(Receipt.receipt_number == identifier)).first()

    if not receipt:
        raise ValueError(f"Kuitansi dengan pengenal '{identifier}' tidak ditemukan.")

    payment = session.get(Payment, receipt.payment_id)
    if not payment:
        raise ValueError("Data pembayaran terkait tidak ditemukan.")

    student = session.get(Student, payment.student_id)
    if not student:
        raise ValueError("Data siswa tidak ditemukan.")

    bill_label = "Pembayaran SPP"
    if payment.bill_id:
        bill = session.get(Bill, payment.bill_id)
        if bill:
            bill_label = bill.label
    elif payment.payment_type == "spp":
        bill_label = f"SPP Bulan {payment.spp_month} Tahun {payment.spp_year}"

    school_info = get_school_profile(session)
    return receipt, payment, student, bill_label, school_info


def generate_receipt_pdf(session: Session, identifier: str) -> bytes:
    """
    Generate kuitansi formal format PDF menggunakan reportlab - B-23.
    """
    receipt, payment, student, bill_label, school_info = get_payment_and_receipt_data(session, identifier)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=colors.HexColor("#0A5C36"),
        alignment=1, # Center
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor("#333333"),
        alignment=1,
        spaceAfter=20
    )
    normal_style = ParagraphStyle('NormalStyle', parent=styles['Normal'], fontSize=11, leading=15)
    bold_style = ParagraphStyle('BoldStyle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15)

    elements = []

    # Header Sekolah
    elements.append(Paragraph(school_info["name"].upper(), title_style))
    elements.append(Paragraph(f"{school_info['address']} | Telp: {school_info['phone']}", subtitle_style))
    elements.append(Spacer(1, 10))

    # Judul Kuitansi
    elements.append(Paragraph("KUITANSI BUKTI PEMBAYARAN", ParagraphStyle('H2', parent=title_style, fontSize=14, textColor=colors.HexColor("#111111"))))
    elements.append(Paragraph(f"No. Kuitansi: <b>{receipt.receipt_number}</b> | Tanggal: {receipt.created_at.strftime('%d-%m-%Y %H:%M')}", ParagraphStyle('CenterInfo', parent=normal_style, alignment=1)))
    elements.append(Spacer(1, 15))

    # Data Siswa & Pembayaran Table
    data = [
        ["NIS Siswa", f": {student.nis}"],
        ["Nama Siswa", f": {student.full_name}"],
        ["Tahun Ajaran", f": {student.academic_year or '-'}"],
        ["Metode Pembayaran", f": {payment.method.upper()} ({payment.channel})"],
        ["Keterangan", f": {payment.notes or '-'}"],
    ]
    t_info = Table(data, colWidths=[150, 350])
    t_info.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#333333")),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 15))

    # Rincian Tagihan Table
    item_data = [
        ["Deskripsi Pembayaran", "Nominal"],
        [bill_label, f"Rp {payment.amount:,.2f}"],
    ]
    if payment.infaq_amount > 0:
        item_data.append(["Infaq / Sedekah", f"Rp {payment.infaq_amount:,.2f}"])
    
    item_data.append(["TOTAL DIBAYAR", f"Rp {payment.total_amount:,.2f}"])

    t_items = Table(item_data, colWidths=[350, 150])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0A5C36")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,1), (-1,-2), 'Helvetica'),
        ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor("#DDDDDD")),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#FDFBF7")),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor("#0A5C36")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 25))

    # Status & Stamp
    status_text = "VOID (DIBATALKAN)" if receipt.is_void else "LUNAS (VERIFIED)"
    status_color = colors.HexColor("#C0392B") if receipt.is_void else colors.HexColor("#0A5C36")
    elements.append(Paragraph(f"STATUS: <b>{status_text}</b>", ParagraphStyle('Status', parent=title_style, fontSize=14, textColor=status_color, alignment=2)))
    
    if receipt.is_void and receipt.void_reason:
        elements.append(Paragraph(f"Alasan Void: {receipt.void_reason}", ParagraphStyle('VoidReason', parent=normal_style, alignment=2, textColor=colors.HexColor("#C0392B"))))

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


def generate_receipt_image(session: Session, identifier: str) -> bytes:
    """
    Generate kuitansi format PNG image bergaya PTDARRAHMAN Ivory/Emerald
    untuk kemudahan sharing 1-click di WhatsApp - B-23.
    Dilengkapi QR Code verifikasi.
    """
    receipt, payment, student, bill_label, school_info = get_payment_and_receipt_data(session, identifier)

    width, height = 800, 1150
    # Ivory background #FDFBF7 -> (253, 251, 247)
    img = Image.new("RGB", (width, height), color=(253, 251, 247))
    draw = ImageDraw.Draw(img)

    # Fonts
    font_title = get_font(32, bold=True)
    font_sub = get_font(18, bold=False)
    font_h2 = get_font(26, bold=True)
    font_body = get_font(20, bold=False)
    font_body_bold = get_font(20, bold=True)
    font_large = get_font(34, bold=True)
    font_small = get_font(16, bold=False)

    # 1. Top Banner (Emerald #0A5C36 -> (10, 92, 54))
    draw.rectangle([(0, 0), (width, 140)], fill=(10, 92, 54))
    draw.text((400, 45), school_info["name"].upper(), font=font_title, fill=(255, 255, 255), anchor="mm")
    draw.text((400, 95), "BUKTI PEMBAYARAN SAH", font=font_sub, fill=(220, 240, 230), anchor="mm")

    # 2. Receipt Header Info
    y = 180
    draw.text((40, y), "No. Kuitansi:", font=font_body, fill=(100, 100, 100))
    draw.text((220, y), receipt.receipt_number, font=font_body_bold, fill=(30, 30, 30))
    y += 35
    draw.text((40, y), "Tanggal:", font=font_body, fill=(100, 100, 100))
    draw.text((220, y), receipt.created_at.strftime("%d-%m-%Y %H:%M"), font=font_body, fill=(30, 30, 30))

    # Divider line
    y += 50
    draw.line([(40, y), (width - 40, y)], fill=(210, 205, 195), width=2)

    # 3. Student Details
    y += 30
    draw.text((40, y), "DATA SISWA", font=font_h2, fill=(10, 92, 54))
    y += 45
    draw.text((40, y), "NIS:", font=font_body, fill=(100, 100, 100))
    draw.text((220, y), student.nis, font=font_body_bold, fill=(30, 30, 30))
    y += 35
    draw.text((40, y), "Nama Siswa:", font=font_body, fill=(100, 100, 100))
    draw.text((220, y), student.full_name, font=font_body_bold, fill=(30, 30, 30))
    y += 35
    draw.text((40, y), "Tahun Ajaran:", font=font_body, fill=(100, 100, 100))
    draw.text((220, y), f"{student.academic_year or '-'}", font=font_body, fill=(30, 30, 30))

    # Divider line
    y += 50
    draw.line([(40, y), (width - 40, y)], fill=(210, 205, 195), width=2)

    # 4. Payment Details Card
    y += 30
    draw.text((40, y), "RINCIAN PEMBAYARAN", font=font_h2, fill=(10, 92, 54))
    y += 50

    # Box for items
    box_top = y
    box_bottom = y + (160 if payment.infaq_amount > 0 else 110)
    draw.rectangle([(40, box_top), (width - 40, box_bottom)], fill=(245, 242, 235), outline=(220, 215, 205), width=1)

    y += 25
    draw.text((65, y), bill_label[:35], font=font_body, fill=(40, 40, 40))
    draw.text((width - 65, y), f"Rp {payment.amount:,.0f}", font=font_body_bold, fill=(40, 40, 40), anchor="ra")

    if payment.infaq_amount > 0:
        y += 40
        draw.text((65, y), "Infaq / Sedekah", font=font_body, fill=(40, 40, 40))
        draw.text((width - 65, y), f"Rp {payment.infaq_amount:,.0f}", font=font_body, fill=(40, 40, 40), anchor="ra")

    # 5. Total Bar
    y = box_bottom + 30
    draw.rectangle([(40, y), (width - 40, y + 80)], fill=(10, 92, 54))
    draw.text((70, y + 40), "TOTAL DIBAYAR", font=font_h2, fill=(255, 255, 255), anchor="lm")
    draw.text((width - 70, y + 40), f"Rp {payment.total_amount:,.0f}", font=font_large, fill=(255, 255, 255), anchor="rm")

    # 6. Status Stamp & QR Code
    y += 130

    # Stamp box (LUNAS or VOID)
    stamp_text = "VOID / BATAL" if receipt.is_void else "LUNAS (SAH)"
    stamp_color = (192, 57, 43) if receipt.is_void else (10, 92, 54)
    draw.rectangle([(40, y), (340, y + 90)], outline=stamp_color, width=5)
    draw.text((190, y + 45), stamp_text, font=font_h2, fill=stamp_color, anchor="mm")

    # QR Code generation
    qr_prefix = "VOID/BATAL" if receipt.is_void else "VERIFIED"
    qr_data = f"{qr_prefix}: {receipt.receipt_number} | Rp {payment.total_amount:,.0f} | {student.nis}"
    qr = qrcode.QRCode(version=1, box_size=5, border=1)
    qr.add_data(qr_data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    qr_img = qr_img.resize((150, 150))
    img.paste(qr_img, (width - 200, y - 30))

    # 7. Footer
    draw.line([(0, height - 70), (width, height - 70)], fill=(220, 215, 205), width=1)
    footer_msg = "Simpan gambar ini sebagai bukti pembayaran yang sah di WhatsApp."
    draw.text((400, height - 35), footer_msg, font=font_small, fill=(120, 120, 120), anchor="mm")

    # Save to BytesIO
    out_buf = io.BytesIO()
    img.save(out_buf, format="PNG")
    png_bytes = out_buf.getvalue()
    out_buf.close()
    return png_bytes
