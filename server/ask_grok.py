"""
ask_grok.py — Ask Grok about the xai_sdk batch API model issue.

Usage:
    poetry run python ask_grok.py
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(".env")

client = OpenAI(
    api_key=os.environ["XAI_API_KEY"],
    base_url="https://api.x.ai/v1",
)

QUESTION = """
I am using the xai_sdk Python package (version 1.9.1) to submit batch requests
via the gRPC API. When I call client.batch.add() with chat requests, I get this error:

    grpc._channel._InactiveRpcError
    status = StatusCode.INVALID_ARGUMENT
    details = "Model grok-4.20-reasoning not supported for endpoint xai_api.Chat/GetCompletion."

I tried both:
  - model="grok-4.20-0309-reasoning"
  - model="grok-4.20-reasoning"

Both fail with the same error about xai_api.Chat/GetCompletion.

But the xAI batch API documentation at docs.x.ai/developers/advanced-api-usage/batch-api
shows Python code examples using model="grok-4.20-reasoning" in client.chat.create()
for batch requests.

Questions:
1. What is the correct model name / approach to use grok-4.20-reasoning with the xai_sdk gRPC batch API?
2. Is there a known incompatibility between grok-4.20 reasoning models and the xai_api.Chat/GetCompletion gRPC endpoint?
3. Should I use a different endpoint or SDK method for grok-4.20 reasoning models in batch?
4. What is the recommended way to run 234 batch requests using grok-4.20-0309-reasoning with x_search tool enabled?

Please give the exact working code/model name.
"""

print("Asking Grok...\n")
print("=" * 60)

response = client.chat.completions.create(
    model="grok-4.20-0309-reasoning",
    messages=[
        {
            "role": "user",
            "content": QUESTION,
        }
    ],
    max_tokens=2000,
)

answer = response.choices[0].message.content
print(answer)
print("=" * 60)
print(f"\nTokens used: {response.usage.total_tokens}")
