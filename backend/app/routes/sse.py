import asyncio
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse


class ConnectionManager:
    """
    Mengelola koneksi SSE (Server-Sent Events) klien yang aktif.
    Digunakan untuk penyiaran (broadcast) perubahan konfigurasi secara real-time dan notifikasi pembayaran.
    """
    def __init__(self):
        self.active_connections: List[asyncio.Queue] = []

    async def connect(self, queue: asyncio.Queue):
        self.active_connections.append(queue)

    def disconnect(self, queue: asyncio.Queue):
        if queue in self.active_connections:
            self.active_connections.remove(queue)

    async def broadcast(self, event_type: str, data: Dict[str, Any]):
        message = {
            "event": event_type,
            "data": json.dumps(data)
        }
        for queue in list(self.active_connections):
            try:
                await queue.put(message)
            except Exception:
                self.disconnect(queue)

    def broadcast_sync(self, event_type: str, data: Dict[str, Any]):
        """Helper untuk memanggil broadcast dari endpoint FastAPI sinkronus."""
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.broadcast(event_type, data))
        except RuntimeError:
            # Jika tidak ada loop yang berjalan di thread aktif
            pass


manager = ConnectionManager()
router = APIRouter()


@router.get("/events")
async def sse_events(request: Request, last_event_id: Optional[str] = None):
    """
    Endpoint SSE (Server-Sent Events) untuk menerima notifikasi real-time
    seperti perubahan konfigurasi sistem (settings_changed) atau pembayaran berhasil (payment_success).
    """
    queue = asyncio.Queue()
    await manager.connect(queue)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                message = await queue.get()
                yield message
        except asyncio.CancelledError:
            pass
        finally:
            manager.disconnect(queue)

    return EventSourceResponse(event_generator())
