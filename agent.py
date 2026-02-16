import subprocess
import json
from openai import OpenAI

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

messages = [{"role": "system", "content": system_prompt}]

while True:
    # 1. Get the user input
    user_input = input("\nYou: ")
    if not user_input.strip():
        continue

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

        # 5. When the message is not a tool call, show it to the user
        if not msg.tool_calls:
            print(f"\nAssistant: {msg.content}")
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