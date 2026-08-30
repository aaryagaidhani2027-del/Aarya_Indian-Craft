"""Backend API tests for the editorial fashion prototype (iteration 3).

Covers: expanded catalogue (10 jackets), gender+craft filters, crafts endpoint,
Ajrakh/Kantha/Kalamkari specifics, DNA (5 tags + 3 recs in j01-j10, differing profiles),
regression atelier compute (valid + invalid conflict), craft story (no narration),
audio status + audio streaming, media endpoints, checkout.
"""
import os
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Catalogue ---------------- #
class TestCatalogue:
    def test_list_all_jackets(self, client):
        r = client.get(f"{API}/jackets")
        assert r.status_code == 200
        data = r.json()
        assert "jackets" in data and "genders" in data and "crafts" in data
        # Iteration 3: 10 jackets in the expanded catalogue
        assert len(data["jackets"]) == 10, f"expected 10 jackets, got {len(data['jackets'])}"
        assert data["genders"] == ["All", "Women", "Men", "Unisex"], data["genders"]
        assert data["crafts"] == ["All", "Quilting", "Ajrakh", "Kantha", "Kalamkari"], data["crafts"]
        ids = {j["id"] for j in data["jackets"]}
        assert ids == {f"j{n:02d}" for n in range(1, 11)}, ids
        # each jacket must have gender + craft_type + unique image
        images = [j["image"] for j in data["jackets"]]
        assert len(set(images)) == len(images), "images must be unique per jacket"
        for j in data["jackets"]:
            assert j["gender"] in {"Women", "Men", "Unisex"}
            assert j["craft_type"] in {"Quilting", "Ajrakh", "Kantha", "Kalamkari"}

    def test_filter_women_ajrakh(self, client):
        r = client.get(f"{API}/jackets", params={"gender": "Women", "craft": "Ajrakh"})
        assert r.status_code == 200
        d = r.json()
        assert len(d["jackets"]) == 1
        assert d["jackets"][0]["name"] == "The Ajrakh Box Jacket"

    def test_filter_men_kantha(self, client):
        r = client.get(f"{API}/jackets", params={"gender": "Men", "craft": "Kantha"})
        assert r.status_code == 200
        d = r.json()
        assert len(d["jackets"]) == 1
        assert d["jackets"][0]["name"] == "The Kantha Work Jacket"

    def test_filter_kalamkari(self, client):
        r = client.get(f"{API}/jackets", params={"craft": "Kalamkari"})
        assert r.status_code == 200
        d = r.json()
        assert len(d["jackets"]) >= 1
        assert any("Kalamkari" in j["name"] for j in d["jackets"])

    def test_no_empty_craft_categories(self, client):
        for craft in ["Quilting", "Ajrakh", "Kantha", "Kalamkari"]:
            r = client.get(f"{API}/jackets", params={"craft": craft})
            assert r.status_code == 200
            assert len(r.json()["jackets"]) >= 1, f"craft {craft} is empty"

    def test_crafts_endpoint(self, client):
        r = client.get(f"{API}/crafts")
        assert r.status_code == 200
        d = r.json()
        assert "crafts" in d and len(d["crafts"]) == 4
        for c in d["crafts"]:
            assert c.get("title") and c.get("image") and c.get("description")

    def test_hero_jacket_reversible(self, client):
        r = client.get(f"{API}/jackets/j01")
        assert r.status_code == 200
        j = r.json()
        assert j["id"] == "j01"
        assert j.get("hero") is True
        assert j.get("reversible") is True

    def test_j10_kalamkari_exists(self, client):
        r = client.get(f"{API}/jackets/j10")
        assert r.status_code == 200
        j = r.json()
        assert j["craft_type"] == "Kalamkari"

    def test_missing_jacket_404(self, client):
        r = client.get(f"{API}/jackets/j99")
        assert r.status_code == 404


# ---------------- Atelier compute regression ---------------- #
class TestAtelier:
    def test_compute_valid_default(self, client):
        payload = {"silhouette": "overshirt", "quilt": "geometric",
                   "colour": "ivory", "craft": "conversation", "personal": "none"}
        r = client.post(f"{API}/atelier/compute", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["madeability"]["score"] == 96
        assert d["madeability"]["makeable"] is True
        assert isinstance(d["editorial"], str) and len(d["editorial"]) > 10
        assert d["price"]["total_inr"] == 8500

    def test_compute_invalid_bomber_patchwork(self, client):
        payload = {"silhouette": "bomber", "quilt": "patchwork",
                   "colour": "black", "craft": "conversation", "personal": "none"}
        r = client.post(f"{API}/atelier/compute", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["madeability"]["score"] == 42
        assert d["madeability"]["makeable"] is False
        conflicts = d["madeability"]["conflicts"]
        assert len(conflicts) >= 1
        c = conflicts[0]
        assert c.get("message") and c.get("fix") and c.get("fix_label")
        assert c["fix"].get("silhouette") == "overshirt"


# ---------------- Design DNA ---------------- #
class TestDna:
    def test_result_quiet_architect(self, client):
        answers = {"mood": "quiet", "texture": "quilted", "palette": "monochrome",
                   "silhouette": "structured", "india": "whisper"}
        r = client.post(f"{API}/dna/result", json={"answers": answers})
        assert r.status_code == 200
        d = r.json()
        assert len(d["tags"]) == 5
        assert len(d["recommended_jackets"]) == 3
        valid_ids = {f"j{n:02d}" for n in range(1, 11)}
        for rec in d["recommended_jackets"]:
            assert rec["id"] in valid_ids, f"rec id {rec['id']} not in j01-j10"
            assert rec.get("reason") and len(rec["reason"].strip()) > 10
        assert d["id"] == "quiet_architect"

    def test_result_different_profiles(self, client):
        a1 = {"mood": "quiet", "texture": "quilted", "palette": "monochrome",
              "silhouette": "structured", "india": "whisper"}
        a2 = {"mood": "playful", "texture": "silk", "palette": "jewel",
              "silhouette": "cropped", "india": "statement"}
        r1 = client.post(f"{API}/dna/result", json={"answers": a1}).json()
        r2 = client.post(f"{API}/dna/result", json={"answers": a2}).json()
        assert r1["id"] != r2["id"], "different DNA answers must yield different profiles"
        rec1 = {r["id"] for r in r1["recommended_jackets"]}
        rec2 = {r["id"] for r in r2["recommended_jackets"]}
        assert rec1 != rec2, "different profiles must produce different recommendations"


# ---------------- Craft story + audio ---------------- #
class TestCraftStory:
    def test_story_no_narration(self, client):
        r = client.get(f"{API}/craft-story")
        assert r.status_code == 200
        d = r.json()
        assert "title" in d and "heading" in d and "body" in d and "passport" in d
        assert "narration" not in d

    def test_audio_status_configured(self, client):
        r = client.get(f"{API}/craft-story/audio/status")
        assert r.status_code == 200
        assert r.json().get("configured") is True

    def test_audio_stream(self, client):
        r = client.get(f"{API}/craft-story/audio", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(r.content) > 1000


# ---------------- Media ---------------- #
class TestMedia:
    @pytest.mark.parametrize("name", ["ajrakh_overshirt_men", "kantha_texture"])
    def test_media_serves_image(self, client, name):
        r = client.get(f"{API}/media/{name}", allow_redirects=True, timeout=30)
        assert r.status_code == 200, f"{name} -> {r.status_code}"
        assert r.headers.get("content-type", "").startswith("image/"), (name, r.headers)


# ---------------- Checkout ---------------- #
class TestCheckout:
    def test_checkout_returns_order(self, client):
        payload = {
            "jacket_name": "TEST_The Reversible Quilted Jacket",
            "selection": {"silhouette": "overshirt", "quilt": "geometric",
                          "colour": "ivory", "craft": "conversation", "personal": "none"},
            "size": "M", "price_inr": 8500, "price_usd": 102,
            "production_days": 21, "customer_name": "TEST_User",
            "email": "test@example.com",
        }
        r = client.post(f"{API}/checkout", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d.get("order_id") and len(d["order_id"]) > 0
        assert d["status"] == "confirmed"
        assert d["delivery_estimate_days"] == 26
