import subprocess
import json
import os
import argparse
from openai import OpenAI
import asyncio
import urllib.request

client = OpenAI()

# Bash tool - Let the LLM figure out what command to run.
tools = [
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": "Execute a bash command and return its stdout and stderr.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The bash command to execute"
                    }
                },
                "required": ["command"]
            }
        }
    }
]

system_prompt = "You are a helpful coding assistant. You have access to a bash tool to execute commands on the user's machine. Use it to read files, write files, search code, run tests, and anything else needed."
max_context_size = 128_000
compaction_threshold = 0.8


inbound_q = asyncio.Queue() # Messages intended for agent
outbound_q = asyncio.Queue() # Messages intended for user


# Context Management using compaction
def compact(messages):
    # Grab the last 5 messages - this is similar to emptying the queue in MemGPT and repopulating it with recent X messages
    last_messages = messages[:-5]
    messages = messages[:-1]

    # Create summary - Replacing the working context
    messages.append({"role": "user", "content": "Summarise the conversation so far"})
    summary_response = client.chat.completions.create(
        model="gpt-4.1",
        messages=messages
    )

    # DEBUG summary
    print(summary_response.choices[0].message.content)

    # System Prompt + Summary + last 5 messages
    return [messages[0], summary_response.choices[0].message] + last_messages


async def main_loop():
    # Context
    messages = [{"role": "system", "content": system_prompt}]

    while True:
        # 1. Get the user input
        user_input = await inbound_q.get()

        # Support "/" commands
        match user_input:
            case "/compact":
                messages = compact(messages)
                continue
            case "/exit":
                os._exit(0)

        # 2. Add it as message to messages
        messages.append({"role": "user", "content": user_input})

        # 3-4. Call the LLM and process tool calls in a loop
        while True:
            response = client.chat.completions.create(
                model="gpt-4.1",
                messages=messages,
                tools=tools,
            )
            msg = response.choices[0].message
            messages.append(msg)

            if response.usage.total_tokens >= max_context_size * compaction_threshold:
                messages = compact(messages)
                continue

            # 5. When the message is not a tool call, show it to the user
            if not msg.tool_calls:
                await outbound_q.put(msg.content)
                break

            # Process each tool call
            for tool_call in msg.tool_calls:
                args = json.loads(tool_call.function.arguments)
                command = args["command"]
                print(f"\n$ {command}")

                result = subprocess.run(
                    command, shell=True, capture_output=True, text=True, timeout=30
                )
                output = result.stdout + result.stderr

                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": output or "(no output)",
                })


async def input_loop():
    loop = asyncio.get_event_loop()
    while True:
        # Read the agent response from the console
        # This is plumbing to make sync operation "input" async
        user_input = await loop.run_in_executor(None, input, "\nYou: ")

        # User input added to the input queue
        await inbound_q.put(user_input)

        # Wait for the agent response
        agent_response = await outbound_q.get()

        # Print the agent response to the console
        print(f"Assistant: {agent_response}")


API_BASE = "http://localhost:8000/api"


async def api_loop():
    last_id = -1

    # Catch up: fetch existing messages to find the latest id
    req = urllib.request.Request(f"{API_BASE}/messages?limit=1")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        if data["messages"]:
            last_id = data["messages"][-1]["id"]

    while True:
        await asyncio.sleep(1)

        # Poll for new user messages
        req = urllib.request.Request(f"{API_BASE}/messages?limit=50&after_id={last_id}")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())

        for msg in data["messages"]:
            last_id = msg["id"]
            if msg["role"] != "user":
                continue

            # Feed to agent
            await inbound_q.put(msg["content"])

            # Wait for agent response
            agent_response = await outbound_q.get()

            # Post agent response back to the API
            payload = json.dumps({"role": "agent", "content": agent_response}).encode()
            req = urllib.request.Request(
                f"{API_BASE}/messages",
                data=payload,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read())
                last_id = result["id"]


async def main(interactive: bool):
    asyncio.create_task(main_loop())

    if interactive:
        await input_loop()
    else:
        await api_loop()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--interactive", action="store_true", help="Use CLI instead of chat API")
    args = parser.parse_args()
    asyncio.run(main(args.interactive))
