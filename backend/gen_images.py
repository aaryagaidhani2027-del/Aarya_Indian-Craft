"""
One-off build-time image generation for the editorial fashion prototype.
Generates a handful of spectacular reusable images via Gemini Nano Banana
(Emergent LLM key) and saves them to backend/assets/generated/.
Run: python gen_images.py
"""
import asyncio
import os
import base64
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
OUT = ROOT / "assets" / "generated"
OUT.mkdir(parents=True, exist_ok=True)

API_KEY = os.getenv("EMERGENT_LLM_KEY")

STYLE = (
    "Editorial luxury fashion photography, contemporary global fashion house aesthetic "
    "(in the spirit of The Row, COS, Jacquemus). Warm ivory, charcoal, black and stone "
    "colour palette. Muted, natural, matte tones. Soft cinematic daylight, generous negative "
    "space, minimal styling. Absolutely NOT ethnic wear, NO paisley, NO gold, NO wedding vibe. "
    "Premium, modern, wearable in a global city. Shot on medium format, shallow depth of field."
)

PROMPTS = {
    "hero_male": (
        f"{STYLE} Full-body cinematic portrait of a contemporary South Asian man, mid-30s, "
        "standing confidently, wearing a modern reversible quilted jacket in warm ivory with subtle "
        "geometric quilting. Clean concrete studio backdrop. Vertical composition."
    ),
    "hero_female": (
        f"{STYLE} Full-body cinematic portrait of a contemporary South Asian woman, late-20s, "
        "wearing the same reversible quilted jacket in deep indigo with fine geometric quilting, "
        "relaxed silhouette. Soft stone-coloured seamless backdrop. Vertical composition."
    ),
    "jacket_front": (
        f"{STYLE} Product still-life of a reversible quilted jacket, FRONT view, laid flat / ghost "
        "mannequin, charcoal outer shell with clean geometric quilt lines, minimal, floating on a warm "
        "ivory background. No human. Centered vertical composition."
    ),
    "jacket_reverse": (
        f"{STYLE} Product still-life of the SAME reversible quilted jacket flipped to its REVERSE side, "
        "warm sand / ivory inner with a subtle contrasting craft panel, ghost mannequin, floating on a "
        "charcoal background. No human. Centered vertical composition."
    ),
    "quilt_closeup": (
        f"{STYLE} Extreme macro close-up of hand-quilted textile: fine running-stitch quilting on natural "
        "cotton in stone and ivory tones, tactile thread detail, raised channels, artisanal but "
        "contemporary. Fills the frame. No human."
    ),
    "artisan": (
        f"{STYLE} Documentary editorial shot of an artisan's hands hand-quilting fabric with needle and "
        "thread on a wooden table, natural window light, warm neutral tones, focus on craft and hands, "
        "quiet and dignified, no face. Horizontal composition."
    ),
}


async def gen_one(name: str, prompt: str):
    chat = LlmChat(api_key=API_KEY, session_id=f"gen-{name}",
                   system_message="You are an elite fashion image generator.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(
        modalities=["image", "text"])
    msg = UserMessage(text=prompt)
    try:
        _text, images = await chat.send_message_multimodal_response(msg)
        if images:
            img_bytes = base64.b64decode(images[0]["data"])
            (OUT / f"{name}.png").write_bytes(img_bytes)
            print(f"SAVED {name}.png ({len(img_bytes)} bytes)")
        else:
            print(f"NO IMAGE for {name}")
    except Exception as e:
        print(f"ERROR {name}: {e}")


async def main():
    for name, prompt in PROMPTS.items():
        await gen_one(name, prompt)


if __name__ == "__main__":
    asyncio.run(main())
