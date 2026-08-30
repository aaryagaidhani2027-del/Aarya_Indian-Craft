from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse, RedirectResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Dict
import uuid
from datetime import datetime, timezone

import data as design

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

MEDIA_DIR = ROOT_DIR / "assets" / "generated"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Fallback editorial imagery if AI generation hasn't produced a file yet.
MEDIA_FALLBACK = {
    "hero_male": "https://images.unsplash.com/photo-1673276628202-737bf3020ac2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "hero_female": "https://images.unsplash.com/photo-1633293822049-dee1b40a99c5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "jacket_front": "https://images.unsplash.com/photo-1614110620182-f6cdc3dafd4a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "jacket_reverse": "https://images.unsplash.com/photo-1633293822049-dee1b40a99c5?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "quilt_closeup": "https://images.unsplash.com/photo-1643313260651-9c335822ecde?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "artisan": "https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
}

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------- #
# Models
# --------------------------------------------------------------------------- #
class AtelierSelection(BaseModel):
    silhouette: str = "overshirt"
    quilt: str = "geometric"
    colour: str = "ivory"
    craft: str = "conversation"
    personal: str = "none"
    personal_value: Optional[str] = None


class DnaAnswers(BaseModel):
    answers: Dict[str, str]


class CheckoutRequest(BaseModel):
    jacket_name: str
    selection: Optional[AtelierSelection] = None
    size: str
    price_inr: int
    price_usd: int
    production_days: int
    customer_name: Optional[str] = None
    email: Optional[str] = None


# --------------------------------------------------------------------------- #
# Media (AI-generated editorial imagery, reused across the app)
# --------------------------------------------------------------------------- #
@api_router.get("/media/{name}")
async def get_media(name: str):
    safe = name.replace("..", "").replace("/", "")
    fp = MEDIA_DIR / f"{safe}.png"
    if fp.exists():
        return FileResponse(str(fp), media_type="image/png")
    if safe in MEDIA_FALLBACK:
        return RedirectResponse(MEDIA_FALLBACK[safe])
    raise HTTPException(status_code=404, detail="media not found")


# --------------------------------------------------------------------------- #
# Catalogue + options
# --------------------------------------------------------------------------- #
@api_router.get("/")
async def root():
    return {"brand": "OLD CRAFT. NEW LANGUAGE."}


@api_router.get("/jackets")
async def list_jackets(category: Optional[str] = None):
    items = design.JACKETS
    if category and category != "All":
        items = [j for j in items if j["category"] == category]
    return {"categories": design.CATEGORIES, "jackets": items}


@api_router.get("/jackets/{jacket_id}")
async def get_jacket(jacket_id: str):
    j = next((x for x in design.JACKETS if x["id"] == jacket_id), None)
    if not j:
        raise HTTPException(status_code=404, detail="jacket not found")
    return j


@api_router.get("/atelier/options")
async def atelier_options():
    return {
        "silhouettes": design.SILHOUETTES,
        "quilts": design.QUILTS,
        "colours": design.COLOURS,
        "craft_intensity": design.CRAFT_INTENSITY,
        "personal_details": design.PERSONAL_DETAILS,
        "base_price_inr": design.BASE_PRICE,
        "modifiers": design.PRICE_MODIFIERS,
    }


@api_router.post("/atelier/compute")
async def atelier_compute(selection: AtelierSelection):
    sel = selection.dict()
    price = design.compute_price(sel)
    made = design.compute_madeability(sel)
    editorial = design.compose_editorial(sel)
    return {"price": price, "madeability": made, "editorial": editorial, "selection": sel}


# --------------------------------------------------------------------------- #
# Design DNA
# --------------------------------------------------------------------------- #
@api_router.get("/dna/questions")
async def dna_questions():
    return {"questions": design.DNA_QUESTIONS}


@api_router.post("/dna/result")
async def dna_result(payload: DnaAnswers):
    return design.compute_dna(payload.answers)


# --------------------------------------------------------------------------- #
# Craft story + passport
# --------------------------------------------------------------------------- #
@api_router.get("/craft-story")
async def craft_story():
    story = dict(design.CRAFT_STORY)
    story.pop("narration", None)
    return story


@api_router.get("/craft-story/audio")
async def craft_story_audio():
    """Serve the narrated craft story. Generates once via ElevenLabs, then caches."""
    cache = MEDIA_DIR / "craft_story.mp3"
    if cache.exists():
        return FileResponse(str(cache), media_type="audio/mpeg")

    api_key = os.environ.get("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="audio_not_configured")

    try:
        from elevenlabs.client import ElevenLabs
        eleven = ElevenLabs(api_key=api_key)
        audio_gen = eleven.text_to_speech.convert(
            text=design.CRAFT_STORY["narration"],
            voice_id="EXAVITQu4vr4xnSDxMaL",  # calm editorial voice
            model_id="eleven_multilingual_v2",
        )
        audio = b"".join(chunk for chunk in audio_gen)
        cache.write_bytes(audio)
        return Response(content=audio, media_type="audio/mpeg")
    except Exception as e:
        logger.error(f"ElevenLabs error: {e}")
        raise HTTPException(status_code=502, detail="audio_generation_failed")


@api_router.get("/craft-story/audio/status")
async def craft_story_audio_status():
    cache = MEDIA_DIR / "craft_story.mp3"
    return {
        "ready": cache.exists() or bool(os.environ.get("ELEVENLABS_API_KEY")),
        "configured": bool(os.environ.get("ELEVENLABS_API_KEY")),
    }


# --------------------------------------------------------------------------- #
# Checkout (prototype)
# --------------------------------------------------------------------------- #
@api_router.post("/checkout")
async def checkout(req: CheckoutRequest):
    order_id = str(uuid.uuid4())[:8].upper()
    doc = req.dict()
    doc.update({
        "order_id": order_id,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.orders.insert_one(doc)
    return {
        "order_id": order_id,
        "status": "confirmed",
        "message": "Your jacket is now in the hands of our artisans.",
        "delivery_estimate_days": req.production_days + 5,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
