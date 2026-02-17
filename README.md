# simple-agent

The simplest possible AI coding agent. One tool (bash), one loop.

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

```bash
./venv/bin/python agent.py
```

Then just type what you want:

```
You: create a hello world python script and run it

$ cat << 'EOF' > hello.py
print("Hello, World!")
EOF

$ python3 hello.py
Hello, World!