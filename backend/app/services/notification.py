import json
import urllib.error
import urllib.request
from decimal import Decimal
from typing import Optional, List, Dict
from datetime import datetime
from sqlmodel import Session, select

from app.models import SchoolSetting, ParentStudent, User, Student, AuditLog


def get_notification_settings(session: Session) -> Dict[str, str]:
    """Mengambil konfigurasi API Notifikasi (WhatsApp Fonnte / SMTP) dari school_settings."""
    settings = session.exec(select(SchoolSetting)).all()
    setting_map = {s.key: s.value for s in settings}
    return {
        "whatsapp_api_token": setting_map.get("whatsapp_api_token", "") or setting_map.get("fonnte_token", ""),
        "school_name": setting_map.get("school_name", "PTDARRAHMAN"),
        "school_phone": setting_map.get("school_phone", ""),
    }


def send_whatsapp_fonnte(token: str, target_phone: str, message: str) -> bool:
    """Mengirim pesan WhatsApp via Fonnte API."""
    url = "https://api.fonnte.com/send"
    data = {
        "target": target_phone,
        "message": message,
        "countryCode": "62",
    }
    headers = {
        "Authorization": token,
        "Content-Type": "application/json",
    }
    try:
        req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            return res_json.get("status") is True or str(res_json.get("status", "")).lower() == "true"
    except Exception:
        return False


def send_payment_success_notification(
    session: Session,
    student_id: int,
    total_amount: Decimal,
    receipt_number: str,
    channel: str,
    notes: Optional[str] = None,
):
    """
    Mengirimkan notifikasi bukti bayar kepada Wali Siswa (via WhatsApp Fonnte / Email / Portal).
    Mencatat jejak pengiriman notifikasi ke AuditLog agar Admin dapat memonitor status pengantaran.
    """
    student = session.get(Student, student_id)
    if not student:
        return

    cfg = get_notification_settings(session)
    school_name = cfg["school_name"]
    wa_token = cfg["whatsapp_api_token"]

    # Cari nomor HP dan Email Wali
    links = session.exec(select(ParentStudent).where(ParentStudent.student_id == student_id)).all()
    parent_phone = None
    parent_email = None
    parent_name = "Bapak/Ibu Parents"

    for l in links:
        parent = session.get(User, l.parent_id)
        if parent:
            if parent.phone:
                parent_phone = parent.phone
                parent_name = parent.full_name
            if parent.email:
                parent_email = parent.email
            if parent_phone:
                break

    amt_str = f"{float(total_amount):,.2f}"
    message = (
        f"*NOTIFIKASI PEMBAYARAN RESMI*\n"
        f"Sekolah: {school_name}\n\n"
        f"Halo {parent_name},\n"
        f"Pembayaran untuk siswa *{student.full_name}* (NIS: {student.nis}) telah berhasil dikonfirmasi.\n\n"
        f"• No Kuitansi: *{receipt_number}*\n"
        f"• Total Bayar: *Rp {amt_str}*\n"
        f"• Saluran: {channel.upper()}\n"
        f"• Waktu: {datetime.utcnow().strftime('%d-%m-%Y %H:%M:%S')} UTC\n\n"
        f"Kuitansi digital berformat PDF dan gambar PNG siap diunduh melalui portal Parents. Terima kasih."
    )

    delivery_status = "DELIVERED_PORTAL"
    external_sent = False

    # Jika token WA dikonfigurasi dan ada nomor HP Wali, kirim pesan eksternal via WhatsApp
    if wa_token and parent_phone:
        success = send_whatsapp_fonnte(wa_token, parent_phone, message)
        if success:
            delivery_status = f"DELIVERED_WHATSAPP ({parent_phone})"
            external_sent = True
        else:
            delivery_status = f"FAILED_WHATSAPP_FALLBACK_PORTAL ({parent_phone})"
    elif parent_phone:
        delivery_status = f"PORTAL_LOGGED (WA Token Not Configured for {parent_phone})"

    # Record di AuditLog
    audit = AuditLog(
        user_id=None,
        action="SEND_NOTIFICATION",
        entity_type="student",
        entity_id=student_id,
        detail=f"Notifikasi pembayaran Rp {amt_str} (KWT: {receipt_number}) dikirim ke {parent_name}. Status: {delivery_status}",
    )
    session.add(audit)
    session.commit()
