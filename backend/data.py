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
        "description": "You gravitate toward restrained forms, tactile surfaces and details that reveal themselves slowly.",
        "palette": "Monochrome & Stone",
        "silhouette": "Structured",
        "craft_affinity": "Geometric quilting",
        "tags": ["Minimal", "Architectural", "Tactile", "Quiet", "Contemporary"],
        "recommendations": ["j01", "j06", "j04"],
    },
    "modern_romantic": {
        "id": "modern_romantic",
        "name": "THE MODERN ROMANTIC",
        "description": "You are drawn to softness, fluid lines and craft that feels like a quiet poem worn close to the skin.",
        "palette": "Soft & Sand",
        "silhouette": "Fluid",
        "craft_affinity": "Organic quilting",
        "tags": ["Soft", "Fluid", "Warm", "Romantic", "Intimate"],
        "recommendations": ["j05", "j08", "j03"],
    },
    "bold_minimalist": {
        "id": "bold_minimalist",
        "name": "THE BOLD MINIMALIST",
        "description": "You want presence without noise — clean volume, deep colour and zero clutter.",
        "palette": "Indigo & Ink",
        "silhouette": "Oversized",
        "craft_affinity": "Abstract quilting",
        "tags": ["Bold", "Clean", "Graphic", "Confident", "Modern"],
        "recommendations": ["j04", "j10", "j07"],
    },
    "raw_purist": {
        "id": "raw_purist",
        "name": "THE RAW PURIST",
        "description": "You love honest materials, visible making and the quiet beauty of the unfinished.",
        "palette": "Earth & Indigo",
        "silhouette": "Relaxed",
        "craft_affinity": "Patchwork",
        "tags": ["Honest", "Earthy", "Handmade", "Raw", "Grounded"],
        "recommendations": ["j03", "j09", "j02"],
    },
    "experimental_voice": {
        "id": "experimental_voice",
        "name": "THE EXPERIMENTAL VOICE",
        "description": "You treat clothing as a canvas — craft loud, colour unexpected and rules entirely optional.",
        "palette": "Jewel & Experimental",
        "silhouette": "Cropped",
        "craft_affinity": "Statement craft",
        "tags": ["Expressive", "Artful", "Fearless", "Unexpected", "Experimental"],
        "recommendations": ["j10", "j09", "j07"],
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


def _recommendation_reason(profile: dict, jacket: dict) -> str:
    """Deterministic 'AI' explanation linking the profile to an approved jacket."""
    return (
        f"Its {jacket['silhouette'].lower()} cut in {jacket['colour'].lower()} speaks to your "
        f"{profile['palette'].lower()} palette, and its {jacket['craft_type'].lower()} craft reflects your "
        f"affinity for {profile['craft_affinity'].lower()}."
    )


def compute_dna(answers: dict) -> dict:
    scores = {k: 0 for k in DNA_PROFILES}
    for q, ans in answers.items():
        profile = _DNA_WEIGHTS.get(q, {}).get(ans)
        if profile:
            scores[profile] += 1
    # deterministic tie-break by profile declaration order
    best = max(DNA_PROFILES, key=lambda p: (scores[p], -list(DNA_PROFILES).index(p)))
    profile = dict(DNA_PROFILES[best])
    recs = []
    for j in JACKETS:
        if j["id"] in profile["recommendations"]:
            recs.append({**j, "reason": _recommendation_reason(profile, j)})
    profile["recommended_jackets"] = recs
    return profile


# --------------------------------------------------------------------------- #
# JACKET CATALOGUE (12 curated concepts)
# --------------------------------------------------------------------------- #
# image keys map to generated media names served at /api/media/{key}

JACKETS = [
    {"id": "j01", "name": "The Reversible Quilted Jacket", "hero": True, "reversible": True,
     "tagline": "One jacket. Two worlds.", "gender": "Men", "craft_type": "Quilting",
     "silhouette": "Overshirt", "quilt": "Geometric", "colour": "Ivory", "craft_intensity": "Conversation",
     "price_inr": 8500, "production_days": 21, "piece_no": "001",
     "image": "hero_male", "front_image": "jacket_front", "reverse_image": "jacket_reverse", "detail_image": "quilt_closeup",
     "tags": ["Reversible", "Hero"], "material": "Handloom cotton, recycled fill",
     "craft": "Contemporary Indian quilting", "technique": "Hand running-stitch quilting",
     "description": "The piece that started it all. Ivory geometric quilting on one side, deep sand on the other — two moods in a single, wearable jacket."},

    {"id": "j02", "name": "The Ajrakh Overshirt", "gender": "Men", "craft_type": "Ajrakh",
     "silhouette": "Overshirt", "quilt": "Geometric", "colour": "Indigo", "craft_intensity": "Conversation",
     "price_inr": 9500, "production_days": 22, "piece_no": "002",
     "image": "ajrakh_overshirt_men", "front_image": "ajrakh_overshirt_men", "reverse_image": "ajrakh_texture", "detail_image": "ajrakh_texture",
     "tags": ["Ajrakh", "Relaxed"], "material": "Ajrakh block-printed cotton",
     "craft": "Ajrakh block printing", "technique": "Natural-dye resist block printing",
     "description": "A relaxed modern overshirt in indigo-and-rust Ajrakh — centuries-old geometry, worn open over a tee."},

    {"id": "j03", "name": "The Kantha Work Jacket", "gender": "Men", "craft_type": "Kantha",
     "silhouette": "Workwear", "quilt": "Organic", "colour": "Olive", "craft_intensity": "Conversation",
     "price_inr": 10500, "production_days": 24, "piece_no": "003",
     "image": "kantha_workjacket_men", "front_image": "kantha_workjacket_men", "reverse_image": "kantha_texture", "detail_image": "kantha_texture",
     "tags": ["Kantha", "Utility"], "material": "Layered tonal cotton",
     "craft": "Kantha hand-stitching", "technique": "Running-stitch storytelling",
     "description": "A grounded workwear cut in tonal olive, held together by fine Kantha running-stitch."},

    {"id": "j04", "name": "The Indigo Quilted Bomber", "gender": "Men", "craft_type": "Quilting",
     "silhouette": "Bomber", "quilt": "Geometric", "colour": "Indigo", "craft_intensity": "Whisper",
     "price_inr": 9000, "production_days": 20, "piece_no": "004",
     "image": "indigo_bomber_men", "front_image": "indigo_bomber_men", "reverse_image": "jacket_reverse", "detail_image": "quilt_closeup",
     "tags": ["Indigo", "Urban"], "material": "Natural-dyed cotton",
     "craft": "Contemporary Indian quilting", "technique": "Fine geometric quilting",
     "description": "A minimal urban bomber in deep natural indigo — the quietest way to wear the craft."},

    {"id": "j05", "name": "The Reversible Cropped Quilted Jacket", "gender": "Women", "craft_type": "Quilting", "reversible": True,
     "tagline": "Two sides. One you.", "silhouette": "Cropped", "quilt": "Geometric", "colour": "Sand", "craft_intensity": "Conversation",
     "price_inr": 8900, "production_days": 21, "piece_no": "005",
     "image": "cropped_quilt_women", "front_image": "cropped_quilt_women", "reverse_image": "jacket_reverse", "detail_image": "quilt_closeup",
     "tags": ["Reversible", "Cropped"], "material": "Handloom cotton, recycled fill",
     "craft": "Contemporary Indian quilting", "technique": "Hand running-stitch quilting",
     "description": "A cropped reversible quilted jacket in warm ivory and sand — fine geometry, two ways to wear it."},

    {"id": "j06", "name": "The Quilted Wrap Jacket", "gender": "Women", "craft_type": "Quilting",
     "silhouette": "Wrap", "quilt": "Organic", "colour": "Black", "craft_intensity": "Conversation",
     "price_inr": 11500, "production_days": 24, "piece_no": "006",
     "image": "wrap_quilt_women", "front_image": "wrap_quilt_women", "reverse_image": "jacket_reverse", "detail_image": "quilt_closeup",
     "tags": ["Architectural", "Belted"], "material": "Structured cotton",
     "craft": "Contemporary Indian quilting", "technique": "Sculptural quilting",
     "description": "An architectural quilted wrap in charcoal — a sculptural, belted silhouette with quiet craft."},

    {"id": "j07", "name": "The Ajrakh Box Jacket", "gender": "Women", "craft_type": "Ajrakh",
     "silhouette": "Box", "quilt": "Geometric", "colour": "Indigo", "craft_intensity": "Statement",
     "price_inr": 12000, "production_days": 25, "piece_no": "007",
     "image": "ajrakh_box_women", "front_image": "ajrakh_box_women", "reverse_image": "ajrakh_texture", "detail_image": "ajrakh_texture",
     "tags": ["Ajrakh", "Structured"], "material": "Ajrakh block-printed cotton",
     "craft": "Ajrakh block printing", "technique": "Natural-dye resist block printing",
     "description": "A boxy, structured jacket in deep indigo Ajrakh — old geometry, sharp modern lines."},

    {"id": "j08", "name": "The Kantha Oversized Overshirt", "gender": "Women", "craft_type": "Kantha",
     "silhouette": "Overshirt", "quilt": "Organic", "colour": "Sand", "craft_intensity": "Whisper",
     "price_inr": 9800, "production_days": 22, "piece_no": "008",
     "image": "kantha_overshirt_women", "front_image": "kantha_overshirt_women", "reverse_image": "kantha_texture", "detail_image": "kantha_texture",
     "tags": ["Kantha", "Oversized"], "material": "Soft layered cotton",
     "craft": "Kantha hand-stitching", "technique": "Running-stitch storytelling",
     "description": "An oversized, fluid overshirt in soft sand with a whisper of Kantha running-stitch."},

    {"id": "j09", "name": "The Patchwork Overshirt", "gender": "Unisex", "craft_type": "Quilting",
     "silhouette": "Overshirt", "quilt": "Patchwork", "colour": "Olive", "craft_intensity": "Conversation",
     "price_inr": 11000, "production_days": 25, "piece_no": "009",
     "image": "patchwork_overshirt_unisex", "front_image": "patchwork_overshirt_unisex", "reverse_image": "jacket_reverse", "detail_image": "quilt_closeup",
     "tags": ["Patchwork", "Unisex"], "material": "Reclaimed quilted panels",
     "craft": "Hand-pieced patchwork", "technique": "Visible-seam patchwork quilting",
     "description": "A unisex overshirt pieced from olive, indigo and sand quilted panels — seams left honest."},

    {"id": "j10", "name": "The Kalamkari Statement Jacket", "gender": "Unisex", "craft_type": "Kalamkari",
     "silhouette": "Box", "quilt": "Abstract", "colour": "Rust", "craft_intensity": "Statement",
     "price_inr": 13500, "production_days": 28, "piece_no": "010",
     "image": "kalamkari_jacket_unisex", "front_image": "kalamkari_jacket_unisex", "reverse_image": "kalamkari_texture", "detail_image": "kalamkari_texture",
     "tags": ["Kalamkari", "Statement"], "material": "Hand-painted natural-dye cotton",
     "craft": "Kalamkari hand-painting", "technique": "Natural-dye narrative hand-painting",
     "description": "A modern statement piece carrying abstract hand-painted Kalamkari panels in madder and indigo."},
]

GENDERS = ["All", "Women", "Men", "Unisex"]
CRAFTS_FILTER = ["All", "Quilting", "Ajrakh", "Kantha", "Kalamkari"]
CATEGORIES = ["All", "Quilting", "Ajrakh", "Kantha", "Kalamkari"]

CRAFTS = [
    {"id": "Quilting", "title": "QUILTING", "image": "quilt_closeup",
     "description": "Modern quilting translated into reversible contemporary outerwear."},
    {"id": "Ajrakh", "title": "AJRAKH", "image": "ajrakh_texture",
     "description": "Geometric block printing translated into modern shirts, jackets and separates."},
    {"id": "Kantha", "title": "KANTHA", "image": "kantha_texture",
     "description": "Hand-stitched storytelling translated into contemporary layering pieces."},
    {"id": "Kalamkari", "title": "KALAMKARI", "image": "kalamkari_texture",
     "description": "Narrative textile traditions translated into modern statement pieces."},
]


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
