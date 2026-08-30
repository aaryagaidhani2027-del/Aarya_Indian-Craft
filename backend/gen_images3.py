import asyncio, os, base64
from pathlib import Path
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
ROOT = Path(__file__).parent; load_dotenv(ROOT/".env")
OUT = ROOT/"assets"/"generated"; API_KEY=os.getenv("EMERGENT_LLM_KEY")
STYLE=("Editorial luxury fashion photography, contemporary global fashion house (The Row/COS spirit). "
 "Warm ivory, charcoal, indigo, muted rust and beige palette, matte natural tones, soft daylight, modern "
 "stone architecture, generous negative space. NOT ethnic/wedding wear, NO gold, NO saree. Medium format.")
P={
 "ajrakh_long_unisex": f"{STYLE} Full-body portrait of an androgynous model in a long contemporary open layer / duster in indigo-and-rust Ajrakh geometric block print, minimal modern styling. Vertical.",
 "kantha_wrap_women": f"{STYLE} Full-body portrait of a contemporary woman in a modern wrap jacket in sand-and-charcoal cotton with fine hand Kantha running-stitch, belted architectural silhouette. Vertical.",
}
async def go(n,p):
 c=LlmChat(api_key=API_KEY,session_id=f"g3-{n}",system_message="Elite fashion image generator.")
 c.with_model("gemini","gemini-3.1-flash-image-preview").with_params(modalities=["image","text"])
 try:
  _t,im=await c.send_message_multimodal_response(UserMessage(text=p))
  if im:(OUT/f"{n}.png").write_bytes(base64.b64decode(im[0]["data"]));print("SAVED",n)
  else:print("NONE",n)
 except Exception as e:print("ERR",n,e)
async def main():
 for n,p in P.items():await go(n,p)
 print("DONE3")
asyncio.run(main())
