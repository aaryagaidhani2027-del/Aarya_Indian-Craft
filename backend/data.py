"""Modular design + product data for the editorial craft fashion prototype.
Three craft worlds — Quilting (hero), Ajrakh, Kantha — across contemporary pieces."""

# --------------------------------------------------------------------------- #
# ATELIER OPTION SYSTEM
# --------------------------------------------------------------------------- #
SILHOUETTES = [
    {"id": "bomber", "label": "Bomber", "adjective": "cropped, easy"},
    {"id": "overshirt", "label": "Overshirt", "adjective": "relaxed, layered"},
    {"id": "workwear", "label": "Workwear", "adjective": "structured, utilitarian"},
]
QUILTS = [
    {"id": "geometric", "label": "Geometric", "descriptor": "clean geometric quilting"},
    {"id": "patchwork", "label": "Patchwork", "descriptor": "considered patchwork panels"},
    {"id": "abstract", "label": "Abstract", "descriptor": "free abstract stitching"},
    {"id": "organic", "label": "Organic", "descriptor": "soft organic channels"},
]
COLOURS = [
    {"id": "black", "label": "Black", "hex": "#1C1C1A", "poetic": "deep ink black"},
    {"id": "ivory", "label": "Ivory", "hex": "#EDE9E0", "poetic": "warm ivory"},
    {"id": "indigo", "label": "Indigo", "hex": "#2E3A4F", "poetic": "deep indigo"},
    {"id": "rust", "label": "Rust", "hex": "#9A5B43", "poetic": "burnt rust"},
    {"id": "olive", "label": "Olive", "hex": "#5C5F45", "poetic": "muted olive"},
    {"id": "sand", "label": "Sand", "hex": "#C8B99C", "poetic": "pale sand"},
]
CRAFT_INTENSITY = [
    {"id": "whisper", "label": "Whisper", "descriptor": "a craft detail that reveals itself only up close"},
    {"id": "conversation", "label": "Conversation", "descriptor": "craft that speaks quietly across the piece"},
    {"id": "statement", "label": "Statement", "descriptor": "craft worn boldly and unmistakably"},
]
PERSONAL_DETAILS = [
    {"id": "none", "label": "None"}, {"id": "initials", "label": "Initials"},
    {"id": "symbol", "label": "Symbol"}, {"id": "date", "label": "Date"},
]

# --------------------------------------------------------------------------- #
# PRICING
# --------------------------------------------------------------------------- #
BASE_PRICE = 8500
INR_TO_USD = 0.012
PRICE_MODIFIERS = {
    "hand_quilting": {"label": "Hand quilting", "amount": 2500},
    "statement_craft": {"label": "Statement craft", "amount": 2000},
    "personal_embroidery": {"label": "Personal embroidery", "amount": 900},
    "special_fabric": {"label": "Special fabric", "amount": 1500},
}
HAND_QUILT_IDS = {"patchwork", "abstract"}
SPECIAL_FABRIC_COLOURS = {"indigo", "rust"}


def compute_price(selection: dict) -> dict:
    lines = [{"label": "Base jacket", "amount": BASE_PRICE}]
    total = BASE_PRICE
    if selection.get("quilt") in HAND_QUILT_IDS:
        m = PRICE_MODIFIERS["hand_quilting"]; lines.append(m); total += m["amount"]
    if selection.get("craft") == "statement":
        m = PRICE_MODIFIERS["statement_craft"]; lines.append(m); total += m["amount"]
    if selection.get("personal") and selection.get("personal") != "none":
        m = PRICE_MODIFIERS["personal_embroidery"]; lines.append(m); total += m["amount"]
    if selection.get("colour") in SPECIAL_FABRIC_COLOURS:
        m = PRICE_MODIFIERS["special_fabric"]; lines.append(m); total += m["amount"]
    return {"lines": lines, "total_inr": total, "total_usd": round(total * INR_TO_USD)}


# --------------------------------------------------------------------------- #
# MADE-ABILITY
# --------------------------------------------------------------------------- #
CONFLICT_RULES = [
    {"when": {"quilt": "patchwork", "silhouette": "bomber"},
     "message": "Patchwork panels can't sit cleanly on a cropped bomber — the seams fight the short hem.",
     "fix": {"silhouette": "overshirt"}, "fix_label": "Switch to the Overshirt silhouette"},
    {"when": {"quilt": "organic", "craft": "statement"},
     "message": "Organic quilting loses its softness when pushed to a full Statement craft intensity.",
     "fix": {"craft": "conversation"}, "fix_label": "Ease craft to Conversation"},
    {"when": {"colour": "ivory", "craft": "statement"},
     "message": "A Statement craft panel bleeds visibly on warm ivory fabric during hand-finishing.",
     "fix": {"colour": "sand"}, "fix_label": "Move to pale Sand instead"},
]
SOFT_DEDUCTIONS = [{"when": {"quilt": "abstract"}, "amount": 4}, {"when": {"personal": "symbol"}, "amount": 2}]


def _matches(rule_when, selection):
    return all(selection.get(k) == v for k, v in rule_when.items())


def compute_madeability(selection: dict) -> dict:
    conflicts = []
    for rule in CONFLICT_RULES:
        if _matches(rule["when"], selection):
            conflicts.append({"message": rule["message"], "fix": rule["fix"], "fix_label": rule["fix_label"]})
    if conflicts:
        return {"score": 42, "makeable": False, "conflicts": conflicts}
    score = 96
    for d in SOFT_DEDUCTIONS:
        if _matches(d["when"], selection):
            score -= d["amount"]
    return {"score": score, "makeable": True, "conflicts": []}


def compose_editorial(selection: dict) -> str:
    sil = next((s for s in SILHOUETTES if s["id"] == selection.get("silhouette")), SILHOUETTES[1])
    quilt = next((q for q in QUILTS if q["id"] == selection.get("quilt")), QUILTS[0])
    colour = next((c for c in COLOURS if c["id"] == selection.get("colour")), COLOURS[0])
    craft = next((c for c in CRAFT_INTENSITY if c["id"] == selection.get("craft")), CRAFT_INTENSITY[0])
    return (f"A {sil['adjective']} silhouette in {colour['poetic']}, combining {quilt['descriptor']} "
            f"with {craft['descriptor']}. Old craft, rendered in a new language — quiet, contemporary, "
            f"and entirely yours.")


# --------------------------------------------------------------------------- #
# DESIGN DNA
# --------------------------------------------------------------------------- #
DNA_QUESTIONS = [
    {"id": "mood", "title": "Choose your mood", "options": [
        {"id": "quiet", "label": "Quiet"}, {"id": "bold", "label": "Bold"}, {"id": "raw", "label": "Raw"},
        {"id": "playful", "label": "Playful"}, {"id": "romantic", "label": "Romantic"}, {"id": "architectural", "label": "Architectural"}]},
    {"id": "texture", "title": "Choose your texture", "options": [
        {"id": "quilted", "label": "Quilted"}, {"id": "cotton", "label": "Cotton"}, {"id": "denim", "label": "Denim"},
        {"id": "silk", "label": "Silk"}, {"id": "linen", "label": "Linen"}, {"id": "leather", "label": "Leather"}]},
    {"id": "palette", "title": "Choose your palette", "options": [
        {"id": "monochrome", "label": "Monochrome"}, {"id": "earth", "label": "Earth"}, {"id": "indigo", "label": "Indigo"},
        {"id": "jewel", "label": "Jewel"}, {"id": "soft", "label": "Soft"}, {"id": "experimental", "label": "Experimental"}]},
    {"id": "silhouette", "title": "Choose your silhouette", "options": [
        {"id": "relaxed", "label": "Relaxed"}, {"id": "structured", "label": "Structured"}, {"id": "oversized", "label": "Oversized"},
        {"id": "cropped", "label": "Cropped"}, {"id": "fluid", "label": "Fluid"}]},
    {"id": "india", "title": "Choose how much India", "subtitle": "How loudly should the craft speak?", "options": [
        {"id": "whisper", "label": "Whisper"}, {"id": "conversation", "label": "Conversation"}, {"id": "statement", "label": "Statement"}]},
]

DNA_PROFILES = {
    "quiet_architect": {"id": "quiet_architect", "name": "THE QUIET ARCHITECT",
        "description": "You gravitate toward restrained forms, tactile surfaces and details that reveal themselves slowly.",
        "palette": "Monochrome & Stone", "silhouette": "Structured", "craft_affinity": "Geometric quilting",
        "tags": ["Minimal", "Architectural", "Tactile", "Quiet", "Contemporary"], "recommendations": ["j01", "j02", "j03"]},
    "modern_romantic": {"id": "modern_romantic", "name": "THE MODERN ROMANTIC",
        "description": "You are drawn to softness, fluid lines and craft that feels like a quiet poem worn close to the skin.",
        "palette": "Soft & Sand", "silhouette": "Fluid", "craft_affinity": "Kantha stitching",
        "tags": ["Soft", "Fluid", "Warm", "Romantic", "Intimate"], "recommendations": ["j07", "j09", "j02"]},
    "bold_expressive": {"id": "bold_expressive", "name": "THE BOLD EXPRESSIVE",
        "description": "You want presence and print — bold, textured, earthy and unmistakably expressive.",
        "palette": "Indigo & Rust", "silhouette": "Oversized", "craft_affinity": "Ajrakh block print",
        "tags": ["Bold", "Textured", "Earthy", "Expressive", "Modern"], "recommendations": ["j04", "j05", "j06"]},
    "raw_purist": {"id": "raw_purist", "name": "THE RAW PURIST",
        "description": "You love honest materials, visible making and craft that carries memory and time.",
        "palette": "Earth & Indigo", "silhouette": "Relaxed", "craft_affinity": "Kantha stitching",
        "tags": ["Quiet", "Tactile", "Raw", "Story-led", "Grounded"], "recommendations": ["j08", "j07", "j09"]},
    "experimental_voice": {"id": "experimental_voice", "name": "THE EXPERIMENTAL VOICE",
        "description": "You treat clothing as a canvas — print loud, colour unexpected and rules entirely optional.",
        "palette": "Jewel & Experimental", "silhouette": "Cropped", "craft_affinity": "Ajrakh block print",
        "tags": ["Expressive", "Artful", "Fearless", "Unexpected", "Experimental"], "recommendations": ["j05", "j06", "j04"]},
}

_DNA_WEIGHTS = {
    "mood": {"quiet": "quiet_architect", "architectural": "quiet_architect", "romantic": "modern_romantic",
             "raw": "raw_purist", "bold": "bold_expressive", "playful": "experimental_voice"},
    "texture": {"quilted": "quiet_architect", "linen": "modern_romantic", "silk": "modern_romantic",
                "denim": "raw_purist", "cotton": "raw_purist", "leather": "bold_expressive"},
    "palette": {"monochrome": "quiet_architect", "soft": "modern_romantic", "earth": "bold_expressive",
                "indigo": "bold_expressive", "jewel": "experimental_voice", "experimental": "experimental_voice"},
    "silhouette": {"structured": "quiet_architect", "fluid": "modern_romantic", "relaxed": "raw_purist",
                   "oversized": "bold_expressive", "cropped": "experimental_voice"},
    "india": {"whisper": "quiet_architect", "conversation": "raw_purist", "statement": "bold_expressive"},
}


def _recommendation_reason(profile, jacket):
    return (f"Its {jacket['silhouette'].lower()} cut in {jacket['colour'].lower()} speaks to your "
            f"{profile['palette'].lower()} palette, and its {jacket['craft_type'].lower()} craft reflects your "
            f"affinity for {profile['craft_affinity'].lower()}.")


def compute_dna(answers: dict) -> dict:
    scores = {k: 0 for k in DNA_PROFILES}
    for q, ans in answers.items():
        p = _DNA_WEIGHTS.get(q, {}).get(ans)
        if p:
            scores[p] += 1
    best = max(DNA_PROFILES, key=lambda p: (scores[p], -list(DNA_PROFILES).index(p)))
    profile = dict(DNA_PROFILES[best])
    profile["recommended_jackets"] = [
        {**j, "reason": _recommendation_reason(profile, j)} for j in JACKETS if j["id"] in profile["recommendations"]]
    return profile


# --------------------------------------------------------------------------- #
# COLLECTION — 3 craft worlds, 9 contemporary pieces
# --------------------------------------------------------------------------- #
JACKETS = [
    {"id": "j01", "name": "The Reversible Quilted Jacket", "hero": True, "reversible": True,
     "tagline": "One jacket. Two worlds.", "gender": "Men", "craft_type": "Quilting",
     "silhouette": "Overshirt", "quilt": "Geometric", "colour": "Ivory", "craft_intensity": "Conversation",
     "price_inr": 8500, "production_days": 21, "piece_no": "001",
     "image": "quilt_men", "front_image": "quilt_still", "reverse_image": "quilt_still", "detail_image": "quilt_hands",
     "tags": ["Reversible", "Hero"], "material": "Handloom cotton, recycled fill",
     "craft": "Contemporary Indian quilting", "technique": "Hand running-stitch quilting",
     "description": "The piece that started it all. Geometric quilting on one side, patchwork on the other — two moods in a single, wearable jacket."},
    {"id": "j02", "name": "The Reversible Cropped Quilted Jacket", "reversible": True, "tagline": "Two sides. One you.",
     "gender": "Women", "craft_type": "Quilting", "silhouette": "Overshirt", "quilt": "Geometric", "colour": "Sand",
     "craft_intensity": "Conversation", "price_inr": 8900, "production_days": 21, "piece_no": "002",
     "image": "quilt_women", "front_image": "quilt_still", "reverse_image": "quilt_still", "detail_image": "quilt_hands",
     "tags": ["Reversible", "Cropped"], "material": "Handloom cotton, recycled fill",
     "craft": "Contemporary Indian quilting", "technique": "Hand running-stitch quilting",
     "description": "A cropped reversible quilted jacket in warm ivory and sand — fine geometry, two ways to wear it."},
    {"id": "j03", "name": "The Patchwork Overshirt", "gender": "Unisex", "craft_type": "Quilting",
     "silhouette": "Overshirt", "quilt": "Patchwork", "colour": "Olive", "craft_intensity": "Conversation",
     "price_inr": 11000, "production_days": 25, "piece_no": "003",
     "image": "patchwork_overshirt_unisex", "front_image": "patchwork_overshirt_unisex", "reverse_image": "quilt_still", "detail_image": "quilt_closeup",
     "tags": ["Patchwork", "Unisex"], "material": "Reclaimed quilted panels",
     "craft": "Hand-pieced patchwork quilting", "technique": "Visible-seam patchwork",
     "description": "A unisex overshirt pieced from olive, indigo and sand quilted panels — seams left honest."},

    {"id": "j04", "name": "The Ajrakh Overshirt", "gender": "Men", "craft_type": "Ajrakh",
     "silhouette": "Overshirt", "quilt": "Geometric", "colour": "Indigo", "craft_intensity": "Conversation",
     "price_inr": 7900, "production_days": 16, "piece_no": "004",
     "image": "ajrakh_overshirt_men", "front_image": "ajrakh_overshirt_men", "reverse_image": "ajrakh_texture", "detail_image": "ajrakh_texture",
     "tags": ["Ajrakh", "Relaxed"], "material": "Cotton",
     "craft": "Ajrakh", "technique": "Hand block printing",
     "description": "A contemporary relaxed overshirt in indigo-and-rust Ajrakh — centuries-old geometry, worn open over a tee."},
    {"id": "j05", "name": "The Ajrakh Box Jacket", "gender": "Women", "craft_type": "Ajrakh",
     "silhouette": "Workwear", "quilt": "Geometric", "colour": "Indigo", "craft_intensity": "Statement",
     "price_inr": 9900, "production_days": 18, "piece_no": "005",
     "image": "ajrakh_box_women", "front_image": "ajrakh_box_women", "reverse_image": "ajrakh_texture", "detail_image": "ajrakh_texture",
     "tags": ["Ajrakh", "Structured"], "material": "Cotton",
     "craft": "Ajrakh", "technique": "Hand block printing",
     "description": "A structured contemporary jacket in deep indigo Ajrakh — old print, sharp modern lines."},
    {"id": "j06", "name": "The Ajrakh Long Layer", "gender": "Unisex", "craft_type": "Ajrakh",
     "silhouette": "Overshirt", "quilt": "Abstract", "colour": "Rust", "craft_intensity": "Conversation",
     "price_inr": 11500, "production_days": 18, "piece_no": "006",
     "image": "ajrakh_long_unisex", "front_image": "ajrakh_long_unisex", "reverse_image": "ajrakh_texture", "detail_image": "ajrakh_texture",
     "tags": ["Ajrakh", "Longline"], "material": "Cotton",
     "craft": "Ajrakh", "technique": "Hand block printing",
     "description": "A long contemporary open layer in Ajrakh print — minimal, unisex, quietly striking."},

    {"id": "j07", "name": "The Kantha Wrap Jacket", "gender": "Women", "craft_type": "Kantha",
     "silhouette": "Workwear", "quilt": "Organic", "colour": "Sand", "craft_intensity": "Conversation",
     "price_inr": 10900, "production_days": 20, "piece_no": "007",
     "image": "kantha_wrap_women", "front_image": "kantha_wrap_women", "reverse_image": "kantha_texture", "detail_image": "kantha_texture",
     "tags": ["Kantha", "Wrap"], "material": "Cotton",
     "craft": "Kantha", "technique": "Hand Kantha stitching",
     "description": "A contemporary wrap silhouette in hand-stitched Kantha textile — architectural and soft at once."},
    {"id": "j08", "name": "The Kantha Work Jacket", "gender": "Men", "craft_type": "Kantha",
     "silhouette": "Workwear", "quilt": "Organic", "colour": "Olive", "craft_intensity": "Conversation",
     "price_inr": 9500, "production_days": 20, "piece_no": "008",
     "image": "kantha_workjacket_men", "front_image": "kantha_workjacket_men", "reverse_image": "kantha_texture", "detail_image": "kantha_texture",
     "tags": ["Kantha", "Workwear"], "material": "Cotton",
     "craft": "Kantha", "technique": "Hand Kantha stitching",
     "description": "A modern relaxed workwear silhouette held together by fine Kantha running-stitch."},
    {"id": "j09", "name": "The Kantha Overshirt", "gender": "Unisex", "craft_type": "Kantha",
     "silhouette": "Overshirt", "quilt": "Organic", "colour": "Sand", "craft_intensity": "Whisper",
     "price_inr": 8900, "production_days": 18, "piece_no": "009",
     "image": "kantha_overshirt_women", "front_image": "kantha_overshirt_women", "reverse_image": "kantha_texture", "detail_image": "kantha_texture",
     "tags": ["Kantha", "Minimal"], "material": "Cotton",
     "craft": "Kantha", "technique": "Hand Kantha stitching",
     "description": "A minimal contemporary overshirt with visible hand stitching — quiet, unisex, everyday."},
]

GENDERS = ["All", "Women", "Men", "Unisex"]
CRAFTS_FILTER = ["All", "Quilting", "Ajrakh", "Kantha"]
CATEGORIES = ["All", "Quilting", "Ajrakh", "Kantha"]

CRAFTS = [
    {"id": "Quilting", "title": "QUILTING", "tagline": "The geometry of the everyday.",
     "image": "quilt_still", "description": "Modern quilting translated into reversible contemporary outerwear."},
    {"id": "Ajrakh", "title": "AJRAKH", "tagline": "Print, translated.",
     "image": "ajrakh_texture", "description": "Geometric block printing translated into modern shirts, jackets and separates."},
    {"id": "Kantha", "title": "KANTHA", "tagline": "Stories, stitched forward.",
     "image": "kantha_texture", "description": "Hand-stitched storytelling translated into contemporary layering pieces."},
]

# --------------------------------------------------------------------------- #
# CRAFT STORY — per craft (audio narration stays the Quilting recording)
# --------------------------------------------------------------------------- #
CRAFT_STORY = {
    "Quilting": {
        "title": "Know what you're wearing",
        "heading": "The quiet revolution of contemporary Indian quilting",
        "hero_image": "quilt_hands",
        "body": ("Quilting is more than the joining of fabric. In Indian homes it lived as razai and sujni — "
                 "layers of worn cotton stitched back into warmth. What looks like decoration is actually "
                 "structure: every running stitch holds the fill, the fabric and the memory together.\n\n"
                 "We speak that logic in a new language — no motifs, no gold, just the honest geometry of the "
                 "stitch, translated into a jacket you can wear from Mumbai to Tokyo."),
        "narration": ("Quilting is more than the joining of fabric. In Indian homes it lived as razai and sujni, "
                      "layers of worn cotton stitched back into warmth. What looks like decoration is actually "
                      "structure. Every running stitch holds the fill, the fabric, and the memory together. We "
                      "speak that logic in a new language. No motifs, no gold. Just the honest geometry of the "
                      "stitch, translated into a jacket you can wear from Mumbai to Tokyo."),
        "passport": {"craft": "Quilting", "technique": "Hand quilting", "material": "Cotton textile",
                     "origin": "India", "production_time": "18 days"},
    },
    "Ajrakh": {
        "title": "Know what you're wearing",
        "heading": "Ajrakh — print, built layer by layer",
        "hero_image": "ajrakh_texture",
        "body": ("Ajrakh begins with the block — a rhythm of print, resist and dye built layer by layer. Each "
                 "length of cloth passes through the maker's hands many times, indigo over madder over the "
                 "resist, until the geometry locks into place.\n\n"
                 "We take that patience and cut it into contemporary silhouettes — the print, translated for how "
                 "we live now."),
        "narration": ("Ajrakh begins with the block — a rhythm of print, resist and dye built layer by layer. "
                      "Each length of cloth passes through the maker's hands many times, indigo over madder over "
                      "the resist, until the geometry locks into place. We take that patience and cut it into "
                      "contemporary silhouettes — the print, translated for how we live now."),
        "passport": {"craft": "Ajrakh", "technique": "Hand block printing", "material": "Cotton",
                     "origin": "Gujarat, India", "production_time": "16 days"},
    },
    "Kantha": {
        "title": "Know what you're wearing",
        "heading": "Kantha — a language of memory and time",
        "hero_image": "kantha_texture",
        "body": ("Kantha turns the simple act of stitching into a language of memory, texture and time. Layers of "
                 "cloth are held by rows of fine running stitch, each line a little uneven, a little human.\n\n"
                 "We keep that hand visible and set it into modern layering pieces — stories, stitched forward."),
        "narration": ("Kantha turns the simple act of stitching into a language of memory, texture and time. "
                      "Layers of cloth are held by rows of fine running stitch, each line a little uneven, a "
                      "little human. We keep that hand visible and set it into modern layering pieces — stories, "
                      "stitched forward."),
        "passport": {"craft": "Kantha", "technique": "Hand Kantha stitching", "material": "Cotton",
                     "origin": "West Bengal, India", "production_time": "20 days"},
    },
}
