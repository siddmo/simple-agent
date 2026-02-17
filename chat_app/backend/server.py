import asyncio
from datetime import datetime, timezone

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from chat_app.backend.models import Message, MessageCreate, MessageListResponse, Role

# In-memory store
messages: list[Message] = []
next_id: int = 0
sse_clients: list[asyncio.Queue] = []


async def broadcast(event: str, data: str):
    for q in list(sse_clients):
        try:
            await q.put({"event": event, "data": data})
        except Exception:
            pass


def add_message(role: Role, content: str) -> Message:
    global next_id
    msg = Message(
        id=next_id,
        role=role,
        content=content,
        timestamp=datetime.now(timezone.utc),
    )
    messages.append(msg)
    next_id += 1
    return msg


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/messages", status_code=201)
async def post_message(body: MessageCreate):
    msg = add_message(body.role, body.content)
    await broadcast("message", msg.model_dump_json())
    return msg


@app.get("/api/messages")
async def get_messages(
    limit: int = Query(default=50, ge=1, le=200),
    after_id: int | None = Query(default=None),
    before_id: int | None = Query(default=None),
):
    filtered = messages

    if after_id is not None:
        filtered = [m for m in filtered if m.id > after_id]
    if before_id is not None:
        filtered = [m for m in filtered if m.id < before_id]

    has_more = len(filtered) > limit
    result = filtered[-limit:]

    return MessageListResponse(messages=result, has_more=has_more)


@app.get("/api/messages/stream")
async def message_stream():
    client_queue: asyncio.Queue = asyncio.Queue()
    sse_clients.append(client_queue)

    async def generate():
        try:
            while True:
                event = await client_queue.get()
                yield event
        except asyncio.CancelledError:
            pass
        finally:
            if client_queue in sse_clients:
                sse_clients.remove(client_queue)

    return EventSourceResponse(generate())
