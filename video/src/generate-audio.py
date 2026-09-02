"""Generate voiceover and background music for the Indian Craft launch video using ElevenLabs."""
import os
import sys
import json
import requests

ELEVENLABS_API_KEY = "sk_eafc9221001cca67cOadb2d73d502716de428bfa1f352892"
BASE_URL = "https://api.elevenlabs.io/v1"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

def generate_voiceover():
    """Generate the voiceover narration."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Voiceover script - 30 seconds of narration
    script = (
        "Old craft. New language. "
        "Indian craft traditions, translated into contemporary fashion. "
        "One jacket. Two worlds. "
        "Geometric quilting on one side. Patchwork on the other. "
        "Your design. Made in India. "
        "AI understands your taste. Indian craft provides the design language. "
        "Discover your design DNA."
    )
    
    # Use the calm editorial voice
    voice_id = "EXAVITQu4vr4xnSDxMaL"
    
    url = f"{BASE_URL}/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    data = {
        "text": script,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.75,
            "style": 0.3,
            "use_speaker_boost": True,
        },
    }
    
    print("Generating voiceover...")
    response = requests.post(url, json=data, headers=headers, timeout=60)
    
    if response.status_code == 200:
        output_path = os.path.join(OUTPUT_DIR, "voiceover.mp3")
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Voiceover saved to {output_path} ({len(response.content)} bytes)")
        return True
    else:
        print(f"Voiceover generation failed: {response.status_code} - {response.text[:200]}")
        return False

def generate_background_music():
    """Generate background music using ElevenLabs sound effects."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    url = f"{BASE_URL}/sound-generation"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
    }
    data = {
        "text": "Soft ambient pad, warm ivory tones, minimal and elegant, luxury fashion brand atmosphere, subtle texture, no drums, no melody, just atmosphere and warmth, cinematic ambient soundscape",
        "duration_seconds": 32,
        "prompt_influence": 0.6,
    }
    
    print("Generating background music...")
    response = requests.post(url, json=data, headers=headers, timeout=120)
    
    if response.status_code == 200:
        output_path = os.path.join(OUTPUT_DIR, "music.mp3")
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Music saved to {output_path} ({len(response.content)} bytes)")
        return True
    else:
        print(f"Music generation failed: {response.status_code} - {response.text[:200]}")
        return False

if __name__ == "__main__":
    vov = generate_voiceover()
    music = generate_background_music()
    
    if vov:
        print("✓ Voiceover ready")
    else:
        print("✗ Voiceover failed")
    if music:
        print("✓ Background music ready")
    else:
        print("✗ Background music failed")
