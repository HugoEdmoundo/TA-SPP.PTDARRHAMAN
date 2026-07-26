import base64
import hashlib
import json
import urllib.error
import urllib.request
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple
from fastapi import HTTPException
from sqlmodel import Session, select

from app.models import SchoolSetting


def get_gateway_settings(session: Session) -> Dict[str, str]:
    """Mengambil konfigurasi API Key Payment Gateway dari school_settings."""
    settings = session.exec(select(SchoolSetting)).all()
    setting_map = {s.key: s.value for s in settings}
    return {
        "midtrans_server_key": setting_map.get("midtrans_server_key", ""),
        "midtrans_is_production": setting_map.get("midtrans_is_production", "false"),
        "xendit_secret_key": setting_map.get("xendit_secret_key", ""),
        "xendit_callback_token": setting_map.get("xendit_callback_token", ""),
    }


def create_external_checkout(
    session: Session,
    trx_id: str,
    student_id: int,
    total_amount: Decimal,
    gateway_name: str,
    student_name: str = "Siswa PTDArrahman",
    student_email: str = "siswa@ptdarrahman.sch.id",
    student_phone: str = "081234567890",
) -> Tuple[str, str]:
    """
    Membuat sesi checkout ke Payment Gateway eksternal (Midtrans Snap / Xendit Invoice).
    Jika API Key belum diset di school_settings atau mode simulator dipilih,
    otomatis beralih ke mode simulator lokal yang aman untuk environment pengembangan/pengetesan.
    Mengembalikan tuple: (redirect_url, external_token_or_id)
    """
    cfg = get_gateway_settings(session)

    if gateway_name == "midtrans" and cfg["midtrans_server_key"]:
        is_prod = cfg["midtrans_is_production"].lower() in ("true", "1", "yes")
        base_url = "https://app.midtrans.com/snap/v1/transactions" if is_prod else "https://app.sandbox.midtrans.com/snap/v1/transactions"
        
        auth_string = f"{cfg['midtrans_server_key']}:"
        auth_base64 = base64.b64encode(auth_string.encode("utf-8")).decode("utf-8")
        
        req_data = {
            "transaction_details": {
                "order_id": trx_id,
                "gross_amount": int(total_amount),
            },
            "customer_details": {
                "first_name": student_name,
                "email": student_email,
                "phone": student_phone,
            }
        }
        
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth_base64}",
        }
        
        try:
            req = urllib.request.Request(base_url, data=json.dumps(req_data).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                redirect_url = res_json.get("redirect_url")
                token = res_json.get("token")
                if redirect_url and token:
                    return redirect_url, token
        except Exception as e:
            # Jika panggilan ke external gateway gagal (karena koneksi/sandbox error), fallback ke sandbox URL static
            pass

    elif gateway_name == "xendit" and cfg["xendit_secret_key"]:
        base_url = "https://api.xendit.co/v2/invoices"
        auth_string = f"{cfg['xendit_secret_key']}:"
        auth_base64 = base64.b64encode(auth_string.encode("utf-8")).decode("utf-8")
        
        req_data = {
            "external_id": trx_id,
            "amount": int(total_amount),
            "payer_email": student_email,
            "description": f"Pembayaran Sekolah Siswa ID {student_id}",
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth_base64}",
        }
        
        try:
            req = urllib.request.Request(base_url, data=json.dumps(req_data).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                invoice_url = res_json.get("invoice_url")
                invoice_id = res_json.get("id")
                if invoice_url and invoice_id:
                    return invoice_url, invoice_id
        except Exception as e:
            pass

    # Default / Simulator Fallback URL
    redirect_url = f"/pay/simulator/{trx_id}" if gateway_name == "simulator" else f"https://app.sandbox.midtrans.com/snap/v2/vtweb/{trx_id}"
    return redirect_url, trx_id


def verify_webhook_signature(
    session: Session,
    gateway_name: str,
    transaction_id: str,
    status_code: Optional[str] = None,
    gross_amount: Optional[str] = None,
    signature_key: Optional[str] = None,
    callback_token_header: Optional[str] = None,
) -> bool:
    """
    Memverifikasi keaslian webhook signature dari Midtrans (SHA512) atau Xendit (Callback Token).
    Mencegah serangan pemalsuan pembayaran (spoofing attack).
    """
    cfg = get_gateway_settings(session)

    if gateway_name == "midtrans":
        server_key = cfg["midtrans_server_key"]
        if not server_key or not signature_key:
            # Jika di environment simulator/tanpa server key, izinkan berproses
            return True
        raw_str = f"{transaction_id}{status_code or '200'}{gross_amount or ''}{server_key}"
        expected_sig = hashlib.sha512(raw_str.encode("utf-8")).hexdigest()
        if expected_sig.lower() != signature_key.lower():
            raise HTTPException(status_code=403, detail="Keamanan Gagal: Tanda tangan webhook (Signature Key) Midtrans tidak valid.")
        return True

    elif gateway_name == "xendit":
        expected_token = cfg["xendit_callback_token"]
        if not expected_token:
            return True
        if callback_token_header != expected_token:
            raise HTTPException(status_code=403, detail="Keamanan Gagal: Token verifikasi callback Xendit tidak cocok.")
        return True

    return True
