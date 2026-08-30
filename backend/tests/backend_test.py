"""Backend API tests for the editorial fashion prototype."""
import os
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://design-reversible.preview.emergentagent.com").rstrip("/")
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
        assert "categories" in data and "jackets" in data
        assert data["categories"][0] == "All"
        assert len(data["jackets"]) == 12

    def test_list_minimal_category(self, client):
        r = client.get(f"{API}/jackets", params={"category": "Minimal"})
        assert r.status_code == 200
        data = r.json()
        assert all(j["category"] == "Minimal" for j in data["jackets"])
        assert len(data["jackets"]) >= 1

    def test_hero_jacket(self, client):
        r = client.get(f"{API}/jackets/j01")
        assert r.status_code == 200
        j = r.json()
        assert j["id"] == "j01"
        assert j["hero"] is True
        assert j["name"] == "The Reversible Quilted Jacket"

    def test_missing_jacket_404(self, client):
        r = client.get(f"{API}/jackets/does_not_exist")
        assert r.status_code == 404


# ---------------- Atelier options + compute ---------------- #
class TestAtelier:
    def test_options(self, client):
        r = client.get(f"{API}/atelier/options")
        assert r.status_code == 200
        d = r.json()
        for k in ["silhouettes", "quilts", "colours", "craft_intensity", "personal_details", "modifiers"]:
            assert k in d
        assert d["base_price_inr"] == 8500

    def test_compute_valid_default(self, client):
        payload = {"silhouette": "overshirt", "quilt": "geometric",
                   "colour": "ivory", "craft": "conversation", "personal": "none"}
        r = client.post(f"{API}/atelier/compute", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["price"]["total_inr"] == 8500
        assert d["madeability"]["score"] == 96
        assert d["madeability"]["makeable"] is True
        assert isinstance(d["editorial"], str) and len(d["editorial"]) > 10
        assert d["price"]["total_usd"] == round(8500 * 0.012)

    def test_compute_invalid_bomber_patchwork(self, client):
        payload = {"silhouette": "bomber", "quilt": "patchwork",
                   "colour": "black", "craft": "conversation", "personal": "none"}
        r = client.post(f"{API}/atelier/compute", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["madeability"]["score"] == 42
        assert d["madeability"]["makeable"] is False
        assert len(d["madeability"]["conflicts"]) >= 1
        c = d["madeability"]["conflicts"][0]
        assert "message" in c and "fix" in c and "fix_label" in c
        assert c["fix"].get("silhouette") == "overshirt"

    def test_compute_pricing_full_stack(self, client):
        # patchwork(+2500) + statement(+2000) + personal!=none(+900) + indigo(+1500) = 8500+6900=15400
        payload = {"silhouette": "overshirt", "quilt": "patchwork",
                   "colour": "indigo", "craft": "statement",
                   "personal": "initials", "personal_value": "AB"}
        r = client.post(f"{API}/atelier/compute", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["price"]["total_inr"] == 15400
        labels = [ln["label"] for ln in d["price"]["lines"]]
        assert "Base jacket" in labels
        assert "Hand quilting" in labels
        assert "Statement craft" in labels
        assert "Personal embroidery" in labels
        assert "Special fabric" in labels

    def test_compute_pricing_rust_special_fabric(self, client):
        # abstract quilt(+2500 hand quilting) + rust(+1500 special)
        payload = {"silhouette": "overshirt", "quilt": "abstract",
                   "colour": "rust", "craft": "conversation", "personal": "none"}
        r = client.post(f"{API}/atelier/compute", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["price"]["total_inr"] == 8500 + 2500 + 1500


# ---------------- Design DNA ---------------- #
class TestDna:
    def test_questions(self, client):
        r = client.get(f"{API}/dna/questions")
        assert r.status_code == 200
        d = r.json()
        assert len(d["questions"]) == 5
        for q in d["questions"]:
            assert "id" in q and "options" in q and len(q["options"]) >= 3

    def test_result_deterministic(self, client):
        answers = {"mood": "quiet", "texture": "quilted", "palette": "monochrome",
                   "silhouette": "structured", "india": "whisper"}
        r = client.post(f"{API}/dna/result", json={"answers": answers})
        assert r.status_code == 200
        d = r.json()
        assert "name" in d and "palette" in d and "silhouette" in d
        assert "craft_affinity" in d and "tags" in d
        # Iteration 2: exactly 5 style attribute tags
        assert len(d["tags"]) == 5, f"expected 5 tags, got {len(d['tags'])}: {d['tags']}"
        assert all(isinstance(t, str) and t.strip() for t in d["tags"])
        assert len(d["recommended_jackets"]) == 3
        # Iteration 2: each recommendation includes a non-empty deterministic 'reason'
        for rec in d["recommended_jackets"]:
            assert "reason" in rec, f"missing reason on rec {rec.get('id')}"
            assert isinstance(rec["reason"], str) and len(rec["reason"].strip()) > 10
        assert d["id"] == "quiet_architect"

    def test_result_second_profile(self, client):
        answers = {"mood": "bold", "texture": "leather", "palette": "indigo",
                   "silhouette": "oversized", "india": "statement"}
        r = client.post(f"{API}/dna/result", json={"answers": answers})
        assert r.status_code == 200
        d = r.json()
        assert len(d["recommended_jackets"]) == 3


# ---------------- Craft story + audio ---------------- #
class TestCraftStory:
    def test_story(self, client):
        r = client.get(f"{API}/craft-story")
        assert r.status_code == 200
        d = r.json()
        assert "title" in d and "heading" in d and "body" in d and "passport" in d
        assert "narration" not in d  # must NOT be exposed

    def test_audio_status(self, client):
        r = client.get(f"{API}/craft-story/audio/status")
        assert r.status_code == 200
        d = r.json()
        assert d["configured"] is True

    def test_audio_stream(self, client):
        r = client.get(f"{API}/craft-story/audio", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("audio/mpeg")
        assert len(r.content) > 1000


# ---------------- Media ---------------- #
class TestMedia:
    def test_hero_media_present(self, client):
        r = client.get(f"{API}/media/hero_male", allow_redirects=True, timeout=30)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert ct.startswith("image/")


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
        assert "order_id" in d and len(d["order_id"]) > 0
        assert d["status"] == "confirmed"
        assert d["delivery_estimate_days"] == 21 + 5
