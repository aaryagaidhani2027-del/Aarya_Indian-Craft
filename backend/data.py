"""
Modular design + product data for the editorial craft fashion prototype.
Everything the UI needs (jackets, silhouettes, quilts, colours, craft treatments,
pricing, compatibility, DNA profiles) lives here — never hard-coded in components.
"""

# --------------------------------------------------------------------------- #
# ATELIER OPTION SYSTEM
# --------------------------------------------------------------------------- #

SILHOUETTES = [
    {"id": "bomber", "label": "Bomber", "adjective": "cropped, easy", "note": "A modern cropped bomber."},
    {"id": "overshirt", "label": "Overshirt", "adjective": "relaxed, layered", "note": "A soft-structured overshirt."},
    {"id": "workwear", "label": "Workwear", "adjective": "structured, utilitarian", "note": "A grounded workwear cut."},
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
    {"id": "none", "label": "None"},
    {"id": "initials", "label": "Initials"},
    {"id": "symbol", "label": "Symbol"},
    {"id": "date", "label": "Date"},
]

# --------------------------------------------------------------------------- #
# PRICING
# --------------------------------------------------------------------------- #

BASE_PRICE = 8500  # INR
INR_TO_USD = 0.012  # approx display rate

PRICE_MODIFIERS = {
    "hand_quilting": {"label": "Hand quilting", "amount": 2500},
    "statement_craft": {"label": "Statement craft", "amount": 2000},
    "personal_embroidery": {"label": "Personal embroidery", "amount": 900},
    "special_fabric": {"label": "Special fabric", "amount": 1500},
}

# quilts that require hand quilting (a special-fabric craft treatment)
HAND_QUILT_IDS = {"patchwork", "abstract"}
SPECIAL_FABRIC_COLOURS = {"indigo", "rust"}


def compute_price(selection: dict) -> dict:
    """Deterministic price breakdown from an atelier selection."""
    lines = [{"label": "Base jacket", "amount": BASE_PRICE}]
    total = BASE_PRICE

    if selection.get("quilt") in HAND_QUILT_IDS:
        m = PRICE_MODIFIERS["hand_quilting"]
        lines.append(m); total += m["amount"]

    if selection.get("craft") == "statement":
        m = PRICE_MODIFIERS["statement_craft"]
        lines.append(m); total += m["amount"]

    if selection.get("personal") and selection.get("personal") != "none":
        m = PRICE_MODIFIERS["personal_embroidery"]
        lines.append(m); total += m["amount"]

    if selection.get("colour") in SPECIAL_FABRIC_COLOURS:
        m = PRICE_MODIFIERS["special_fabric"]
        lines.append(m); total += m["amount"]

    return {
        "lines": lines,
        "total_inr": total,
        "total_usd": round(total * INR_TO_USD),
    }


# --------------------------------------------------------------------------- #
# MADE-ABILITY (deterministic compatibility)
# --------------------------------------------------------------------------- #

# Hard conflicts: (field, value, field, value) -> penalty + copy + suggested fix
CONFLICT_RULES = [
    {
        "when": {"quilt": "patchwork", "silhouette": "bomber"},
        "message": "Patchwork panels can't sit cleanly on a cropped bomber — the seams fight the short hem.",
        "fix": {"silhouette": "overshirt"},
        "fix_label": "Switch to the Overshirt silhouette",
    },
    {
        "when": {"quilt": "organic", "craft": "statement"},
        "message": "Organic quilting loses its softness when pushed to a full Statement craft intensity.",
        "fix": {"craft": "conversation"},
        "fix_label": "Ease craft to Conversation",
    },
    {
        "when": {"colour": "ivory", "craft": "statement"},
        "message": "A Statement craft panel bleeds visibly on warm ivory fabric during hand-finishing.",
        "fix": {"colour": "sand"},
        "fix_label": "Move to pale Sand instead",
    },
]

# soft deductions that lower a fully-makeable score below 100 without a conflict
SOFT_DEDUCTIONS = [
    {"when": {"quilt": "abstract"}, "amount": 4},
    {"when": {"personal": "symbol"}, "amount": 2},
]


def _matches(rule_when: dict, selection: dict) -> bool:
    return all(selection.get(k) == v for k, v in rule_when.items())


def compute_madeability(selection: dict) -> dict:
    conflicts = []
    for rule in CONFLICT_RULES:
        if _matches(rule["when"], selection):
            conflicts.append({
                "message": rule["message"],
                "fix": rule["fix"],
                "fix_label": rule["fix_label"],
            })

    if conflicts:
        return {"score": 42, "makeable": False, "conflicts": conflicts}

    score = 96
    for d in SOFT_DEDUCTIONS:
        if _matches(d["when"], selection):
            score -= d["amount"]
    return {"score": score, "makeable": True, "conflicts": []}


# --------------------------------------------------------------------------- #
# AI DESIGN MOMENT (deterministic editorial copy from the approved system)
# --------------------------------------------------------------------------- #

def compose_editorial(selection: dict) -> str:
    sil = next((s for s in SILHOUETTES if s["id"] == selection.get("silhouette")), SILHOUETTES[1])
    quilt = next((q for q in QUILTS if q["id"] == selection.get("quilt")), QUILTS[0])
    colour = next((c for c in COLOURS if c["id"] == selection.get("colour")), COLOURS[0])
    craft = next((c for c in CRAFT_INTENSITY if c["id"] == selection.get("craft")), CRAFT_INTENSITY[0])

    return (
        f"A {sil['adjective']} silhouette in {colour['poetic']}, combining {quilt['descriptor']} "
        f"with {craft['descriptor']}. Old craft, rendered in a new language — quiet, contemporary, "
        f"and entirely yours."
    )


# --------------------------------------------------------------------------- #
# DESIGN DNA
# --------------------------------------------------------------------------- #

DNA_QUESTIONS = [
    {
        "id": "mood", "title": "Choose your mood",
        "options": [
            {"id": "quiet", "label": "Quiet"}, {"id": "bold", "label": "Bold"},
            {"id": "raw", "label": "Raw"}, {"id": "playful", "label": "Playful"},
            {"id": "romantic", "label": "Romantic"}, {"id": "architectural", "label": "Architectural"},
        ],
    },
    {
        "id": "texture", "title": "Choose your texture",
        "options": [
            {"id": "quilted", "label": "Quilted"}, {"id": "cotton", "label": "Cotton"},
            {"id": "denim", "label": "Denim"}, {"id": "silk", "label": "Silk"},
            {"id": "linen", "label": "Linen"}, {"id": "leather", "label": "Leather"},
        ],
    },
    {
        "id": "palette", "title": "Choose your palette",
        "options": [
            {"id": "monochrome", "label": "Monochrome"}, {"id": "earth", "label": "Earth"},
            {"id": "indigo", "label": "Indigo"}, {"id": "jewel", "label": "Jewel"},
            {"id": "soft", "label": "Soft"}, {"id": "experimental", "label": "Experimental"},
        ],
    },
    {
        "id": "silhouette", "title": "Choose your silhouette",
        "options": [
            {"id": "relaxed", "label": "Relaxed"}, {"id": "structured", "label": "Structured"},
            {"id": "oversized", "label": "Oversized"}, {"id": "cropped", "label": "Cropped"},
            {"id": "fluid", "label": "Fluid"},
        ],
    },
    {
        "id": "india", "title": "Choose how much India",
        "subtitle": "How loudly should the craft speak?",
        "options": [
            {"id": "whisper", "label": "Whisper"}, {"id": "conversation", "label": "Conversation"},
            {"id": "statement", "label": "Statement"},
        ],
    },
]

DNA_PROFILES = {
    "quiet_architect": {
        "id": "quiet_architect",
        "name": "THE QUIET ARCHITECT",
        "description": "You gravitate toward tactile materials, restrained palettes and unexpected detail.",
        "palette": "Monochrome & Stone",
        "silhouette": "Structured",
        "craft_affinity": "Geometric quilting",
        "tags": ["Restrained", "Tactile", "Architectural", "Considered"],
        "recommendations": ["j01", "j04", "j07"],
    },
    "modern_romantic": {
        "id": "modern_romantic",
        "name": "THE MODERN ROMANTIC",
        "description": "You are drawn to softness, fluid lines and craft that feels like a quiet poem.",
        "palette": "Soft & Sand",
        "silhouette": "Fluid",
        "craft_affinity": "Organic quilting",
        "tags": ["Soft", "Fluid", "Warm", "Intimate"],
        "recommendations": ["j03", "j06", "j09"],
    },
    "bold_minimalist": {
        "id": "bold_minimalist",
        "name": "THE BOLD MINIMALIST",
        "description": "You want presence without noise — clean volume, deep colour, zero clutter.",
        "palette": "Indigo & Ink",
        "silhouette": "Oversized",
        "craft_affinity": "Abstract quilting",
        "tags": ["Confident", "Clean", "Graphic", "Modern"],
        "recommendations": ["j02", "j05", "j08"],
    },
    "raw_purist": {
        "id": "raw_purist",
        "name": "THE RAW PURIST",
        "description": "You love honest materials, visible making and the beauty of the unfinished.",
        "palette": "Earth & Indigo",
        "silhouette": "Relaxed",
        "craft_affinity": "Patchwork",
        "tags": ["Honest", "Earthy", "Handmade", "Grounded"],
        "recommendations": ["j04", "j10", "j11"],
    },
    "experimental_voice": {
        "id": "experimental_voice",
        "name": "THE EXPERIMENTAL VOICE",
        "description": "You treat clothing as a canvas — craft loud, colour unexpected, rules optional.",
        "palette": "Jewel & Experimental",
        "silhouette": "Cropped",
        "craft_affinity": "Statement craft",
        "tags": ["Expressive", "Fearless", "Artful", "Unexpected"],
        "recommendations": ["j08", "j11", "j12"],
    },
}

# scoring weights: answer -> profile points
_DNA_WEIGHTS = {
    "mood": {
        "quiet": "quiet_architect", "architectural": "quiet_architect",
        "romantic": "modern_romantic", "raw": "raw_purist",
        "bold": "bold_minimalist", "playful": "experimental_voice",
    },
    "texture": {
        "quilted": "quiet_architect", "linen": "modern_romantic",
        "silk": "modern_romantic", "denim": "raw_purist",
        "cotton": "raw_purist", "leather": "bold_minimalist",
    },
    "palette": {
        "monochrome": "quiet_architect", "soft": "modern_romantic",
        "earth": "raw_purist", "indigo": "bold_minimalist",
        "jewel": "experimental_voice", "experimental": "experimental_voice",
    },
    "silhouette": {
        "structured": "quiet_architect", "fluid": "modern_romantic",
        "relaxed": "raw_purist", "oversized": "bold_minimalist",
        "cropped": "experimental_voice",
    },
    "india": {
        "whisper": "quiet_architect", "conversation": "modern_romantic",
        "statement": "experimental_voice",
    },
}


def compute_dna(answers: dict) -> dict:
    scores = {k: 0 for k in DNA_PROFILES}
    for q, ans in answers.items():
        profile = _DNA_WEIGHTS.get(q, {}).get(ans)
        if profile:
            scores[profile] += 1
    # deterministic tie-break by profile declaration order
    best = max(DNA_PROFILES, key=lambda p: (scores[p], -list(DNA_PROFILES).index(p)))
    profile = dict(DNA_PROFILES[best])
    profile["recommended_jackets"] = [j for j in JACKETS if j["id"] in profile["recommendations"]]
    return profile


# --------------------------------------------------------------------------- #
# JACKET CATALOGUE (12 curated concepts)
# --------------------------------------------------------------------------- #
# image keys map to generated media names served at /api/media/{key}

JACKETS = [
    {
        "id": "j01", "name": "The Reversible Quilted Jacket", "hero": True,
        "tagline": "One jacket. Two worlds.", "category": "Contemporary",
        "silhouette": "Overshirt", "quilt": "Geometric", "colour": "Ivory",
        "craft_intensity": "Conversation", "price_inr": 8500, "production_days": 21,
        "image": "hero_male", "reverse_image": "jacket_reverse", "front_image": "jacket_front",
        "detail_image": "quilt_closeup",
        "tags": ["Reversible", "Hero", "Everyday"],
        "material": "Handloom cotton, recycled fill",
        "craft": "Contemporary Indian quilting",
        "description": "The piece that started it all. Ivory geometric quilting on one side, deep sand on the other — two moods in a single, wearable jacket.",
    },
    {"id": "j02", "name": "Ink Line", "category": "Minimal", "silhouette": "Bomber",
     "quilt": "Geometric", "colour": "Black", "craft_intensity": "Whisper",
     "price_inr": 8500, "production_days": 18, "image": "jacket_front",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Monochrome", "Clean"], "material": "Cotton canvas",
     "craft": "Machine-guided geometric quilting",
     "description": "The quietest jacket in the collection. Pure ink black, fine geometric lines, nothing to prove."},

    {"id": "j03", "name": "Sand Hour", "category": "Minimal", "silhouette": "Overshirt",
     "quilt": "Organic", "colour": "Sand", "craft_intensity": "Whisper",
     "price_inr": 8500, "production_days": 19, "image": "hero_female",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Soft", "Warm"], "material": "Brushed cotton",
     "craft": "Organic hand-guided channels",
     "description": "Warm pale sand with soft organic quilting — the jacket you reach for without thinking."},

    {"id": "j04", "name": "Field Study", "category": "Contemporary", "silhouette": "Workwear",
     "quilt": "Patchwork", "colour": "Olive", "craft_intensity": "Conversation",
     "price_inr": 11000, "production_days": 24, "image": "hero_male",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Utility", "Earth"], "material": "Handloom cotton",
     "craft": "Hand-pieced patchwork",
     "description": "A grounded workwear cut in muted olive, pieced from hand-quilted patchwork panels."},

    {"id": "j05", "name": "Nightfold", "category": "Contemporary", "silhouette": "Bomber",
     "quilt": "Geometric", "colour": "Indigo", "craft_intensity": "Conversation",
     "price_inr": 10000, "production_days": 22, "image": "hero_female",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Indigo", "Evening"], "material": "Natural-dyed cotton",
     "craft": "Indigo geometric quilting",
     "description": "Deep natural indigo with a clean bomber line — city evenings, rendered in craft."},

    {"id": "j06", "name": "Quiet River", "category": "Minimal", "silhouette": "Overshirt",
     "quilt": "Organic", "colour": "Ivory", "craft_intensity": "Whisper",
     "price_inr": 8500, "production_days": 20, "image": "jacket_reverse",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Ivory", "Calm"], "material": "Handloom cotton",
     "craft": "Organic quilting",
     "description": "Warm ivory, flowing organic channels — restraint as a design language."},

    {"id": "j07", "name": "Grid Theory", "category": "Statement", "silhouette": "Workwear",
     "quilt": "Geometric", "colour": "Black", "craft_intensity": "Statement",
     "price_inr": 12500, "production_days": 26, "image": "jacket_front",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Graphic", "Bold"], "material": "Structured cotton twill",
     "craft": "Statement geometric quilting",
     "description": "A structured black jacket where geometric quilting becomes the whole point."},

    {"id": "j08", "name": "Rust Signal", "category": "Statement", "silhouette": "Bomber",
     "quilt": "Abstract", "colour": "Rust", "craft_intensity": "Statement",
     "price_inr": 13000, "production_days": 27, "image": "hero_male",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Rust", "Expressive"], "material": "Special natural-dyed fabric",
     "craft": "Free abstract stitching",
     "description": "Burnt rust and free abstract quilting — a jacket that speaks first."},

    {"id": "j09", "name": "Silk Margin", "category": "Contemporary", "silhouette": "Overshirt",
     "quilt": "Organic", "colour": "Sand", "craft_intensity": "Conversation",
     "price_inr": 11500, "production_days": 23, "image": "hero_female",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Fluid", "Refined"], "material": "Silk-cotton blend",
     "craft": "Organic quilting on silk margin",
     "description": "A fluid overshirt in warm sand with a whisper of silk at the edges."},

    {"id": "j10", "name": "Raw Ledger", "category": "Experimental", "silhouette": "Workwear",
     "quilt": "Patchwork", "colour": "Indigo", "craft_intensity": "Conversation",
     "price_inr": 12000, "production_days": 25, "image": "jacket_front",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Handmade", "Indigo"], "material": "Recycled indigo denim",
     "craft": "Visible-seam patchwork",
     "description": "Pieced from recycled indigo, seams left honest and visible."},

    {"id": "j11", "name": "Open Score", "category": "Experimental", "silhouette": "Bomber",
     "quilt": "Abstract", "colour": "Olive", "craft_intensity": "Statement",
     "price_inr": 13500, "production_days": 28, "image": "quilt_closeup",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Artful", "Olive"], "material": "Mixed reclaimed cotton",
     "craft": "Improvised abstract quilting",
     "description": "Muted olive treated as a canvas — no two pieces stitched alike."},

    {"id": "j12", "name": "Prism Fold", "category": "Experimental", "silhouette": "Overshirt",
     "quilt": "Abstract", "colour": "Rust", "craft_intensity": "Statement",
     "price_inr": 13500, "production_days": 28, "image": "hero_female",
     "reverse_image": "jacket_reverse", "front_image": "jacket_front", "detail_image": "quilt_closeup",
     "tags": ["Bold", "Experimental"], "material": "Special natural-dyed fabric",
     "craft": "Statement abstract quilting",
     "description": "The loudest voice in the room — rust, abstraction, and unapologetic craft."},
]

CATEGORIES = ["All", "Minimal", "Contemporary", "Statement", "Experimental"]

CRAFT_STORY = {
    "title": "Know what you're wearing",
    "heading": "The quiet revolution of contemporary Indian quilting",
    "body": (
        "Long before quilting became a global craft word, it lived in Indian homes as 'razai' and "
        "'sujni' — layers of worn cotton stitched back into warmth. What looks like decoration is "
        "actually structure: every running stitch holds the fill, the fabric and the memory together.\n\n"
        "We take that same logic and speak it in a new language. No wedding motifs, no gold — just the "
        "honest geometry of the stitch, made by artisans who have quilted for generations, translated "
        "into a jacket you can wear from Mumbai to Tokyo.\n\n"
        "When you wear this piece, you're wearing a craft that refused to disappear."
    ),
    "narration": (
        "Long before quilting became a global craft word, it lived in Indian homes as razai and sujni. "
        "Layers of worn cotton, stitched back into warmth. What looks like decoration is actually "
        "structure. Every running stitch holds the fill, the fabric, and the memory together. "
        "We take that same logic and speak it in a new language. No wedding motifs, no gold. Just the "
        "honest geometry of the stitch, made by artisans who have quilted for generations, translated "
        "into a jacket you can wear from Mumbai to Tokyo. When you wear this piece, you are wearing a "
        "craft that refused to disappear."
    ),
    "passport": {
        "craft": "Contemporary Indian quilting",
        "technique": "Hand running-stitch (kantha-derived), reworked geometric",
        "material": "Handloom cotton, recycled fill",
        "origin": "West Bengal & Gujarat, India",
        "maker": "A collective of 40+ quilting artisans",
        "production_time": "21 days",
    },
}
