from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key="rc_d6997819ca04a069778b23fcb1981d89b3513ea476f01b04007f88a1321e3347",
)

response = client.chat.completions.create(
    model="Qwen/Qwen3-0.6B",
    max_tokens=4096,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the fastest way to get to the airport?"},
    ],
)

print(response.choices[0].message.content)