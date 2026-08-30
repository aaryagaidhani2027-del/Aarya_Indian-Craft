"""Expansion imagery: distinct products across crafts + craft-language textures."""
import asyncio, os, base64
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
OUT = ROOT / "assets" / "generated"
OUT.mkdir(parents=True, exist_ok=True)
API_KEY = os.getenv("EMERGENT_LLM_KEY")

STYLE = (
    "Editorial luxury fashion photography for a contemporary global fashion house (The Row / COS / "
    "Jacquemus spirit). Warm ivory, charcoal, black, indigo, muted rust, olive and sand palette. Matte, "
    "natural tones, soft cinematic daylight, modern concrete/stone architecture, generous negative space, "
    "minimal styling. Genuinely wearable in Mumbai, London, New York, Tokyo. Absolutely NOT ethnic/wedding "
    "wear, NO saree, NO lehenga, NO sherwani, NO gold, NO paisley. Medium format, shallow depth of field."
)

PROMPTS = {
    "ajrakh_overshirt_men": f"{STYLE} Full-body portrait of a contemporary South Asian man, early 30s, in a relaxed modern overshirt made of indigo-and-rust Ajrakh geometric block-printed cotton, worn open over a plain tee. Vertical.",
    "kantha_workjacket_men": f"{STYLE} Full-body portrait of a contemporary man in a modern workwear jacket in tonal olive cotton with fine hand Kantha running-stitch texture, utilitarian and clean. Vertical.",
    "indigo_bomber_men": f"{STYLE} Full-body portrait of a contemporary man in a minimal urban bomber jacket, deep natural indigo with subtle geometric quilting, clean city styling. Vertical.",
    "cropped_quilt_women": f"{STYLE} Full-body portrait of a contemporary South Asian woman, late 20s, in a cropped reversible quilted jacket in warm ivory with fine geometric quilting, modern trousers. Vertical.",
    "wrap_quilt_women": f"{STYLE} Full-body portrait of a contemporary woman in an architectural quilted wrap jacket in charcoal, sculptural belted silhouette, minimal. Vertical.",
    "ajrakh_box_women": f"{STYLE} Full-body portrait of a contemporary woman in a boxy cropped jacket made of deep indigo Ajrakh geometric block print, structured and modern. Vertical.",
    "kantha_overshirt_women": f"{STYLE} Full-body portrait of a contemporary woman in an oversized overshirt in soft sand cotton with subtle Kantha running-stitch, relaxed and fluid. Vertical.",
    "patchwork_overshirt_unisex": f"{STYLE} Full-body portrait of an androgynous model in a unisex patchwork overshirt pieced from muted olive, indigo and sand quilted panels, honest visible seams, contemporary. Vertical.",
    "kalamkari_jacket_unisex": f"{STYLE} Full-body portrait of a model in a modern statement jacket featuring abstract hand-painted Kalamkari narrative panels in madder-rust and indigo on cream, contemporary art-driven, restrained. Vertical.",
    "ajrakh_texture": f"{STYLE} Extreme macro of Ajrakh block-printed cotton: precise geometric repeat in deep indigo, madder rust and cream, tactile hand-printed detail filling the frame. No human.",
    "kantha_texture": f"{STYLE} Extreme macro of Kantha hand-stitching: fine tonal running stitches across layered natural cotton in sand and ivory, subtle raised texture. No human.",
    "kalamkari_texture": f"{STYLE} Extreme macro of hand-painted Kalamkari textile: fine natural-dye linework, madder and indigo on cream, abstract narrative detail, tactile. No human.",
}


async def gen_one(name, prompt):
    chat = LlmChat(api_key=API_KEY, session_id=f"g2-{name}", system_message="Elite fashion image generator.")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    try:
        _t, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
        if images:
            (OUT / f"{name}.png").write_bytes(base64.b64decode(images[0]["data"]))
            print(f"SAVED {name}.png")
        else:
            print(f"NO IMAGE {name}")
    except Exception as e:
        print(f"ERROR {name}: {e}")


async def main():
    for n, p in PROMPTS.items():
        await gen_one(n, p)
    print("ALL_DONE")


if __name__ == "__main__":
    asyncio.run(main())
