# simple-agent

The simplest possible AI coding agent. One tool (bash), one loop.

> **Note:** This code is intentionally kept simple and rough around the edges. It avoids abstractions and polished patterns to show a clear sense of progression as features are added. Don't expect production-quality code — that's by design.

## How it works

```
User prompt → LLM → bash tool call → execute → feed output back → LLM → ... → text response
```

The agent gives the LLM a single `bash` tool. It figures out what commands to run — reading files, writing code, searching, running tests — all through bash.

## Setup

```bash
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
export OPENAI_API_KEY="your-key-here"
```

## Usage

### Interactive mode (CLI)

```bash
./venv/bin/python agent.py --interactive
```

Then just type what you want:

```
You: create a hello world python script and run it

$ cat << 'EOF' > hello.py
print("Hello, World!")
EOF

$ python3 hello.py
Hello, World!
```

### Chat UI mode (default)

The agent can be used through a web-based chat interface. This requires running three things:

**1. Start the backend**

```bash
./venv/bin/pip install -r chat_app/backend/requirements.txt
./venv/bin/python -m uvicorn chat_app.backend.server:app --port 8000
```

**2. Start the frontend**

```bash
cd chat_app/frontend
npm install
npm run dev
```

**3. Start the agent**

```bash
./venv/bin/python agent.py
```

Open http://localhost:5173 in your browser.

The agent polls the backend API for new user messages and posts its responses back. The frontend connects via SSE for real-time updates.

### API

The backend exposes a simple REST API:

- `POST /api/messages` — send a message (`{"role": "user"|"agent", "content": "..."}`)
- `GET /api/messages?limit=50&before_id=N&after_id=N` — fetch messages with pagination
- `GET /api/messages/stream` — SSE endpoint for real-time updates
- `GET /api/health` — health check
