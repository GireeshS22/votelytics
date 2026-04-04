"""
Generate constituency infographic PNGs via Playwright -> upload to Supabase Storage
===================================================================================
Screenshots the /infographic/:slug React page at 1080x1080 and uploads to:
  supabase storage bucket: infographics/2026/{slug}.png

Usage:
    # Generate all constituencies that have v4 predictions
    poetry run python scripts/generate_infographics.py

    # Generate specific slugs
    poetry run python scripts/generate_infographics.py --slugs kolathur,chepauk-thiruvallikeni

    # Regenerate even if already exists in storage
    poetry run python scripts/generate_infographics.py --force

    # Use different frontend URL (default: http://localhost:5173)
    poetry run python scripts/generate_infographics.py --frontend-url http://localhost:5173
"""

import sys
import os
import time
import argparse
import requests as http_requests

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from playwright.sync_api import sync_playwright
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.prediction import Prediction
from app.config import settings

# ── Config ─────────────────────────────────────────────────────────────────────

_BASE               = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SUPABASE_URL        = settings.SUPABASE_URL
SUPABASE_ANON_KEY   = settings.SUPABASE_ANON_KEY
STORAGE_BUCKET      = "infographics"
STORAGE_FOLDER      = "2026"
INFOGRAPHIC_WIDTH   = 1080
INFOGRAPHIC_HEIGHT  = 1080
DEFAULT_FRONTEND    = "http://localhost:5173"


# ── Supabase Storage ───────────────────────────────────────────────────────────

def upload_to_supabase(slug: str, png_bytes: bytes) -> str:
    """Upload PNG to Supabase Storage and return public URL."""
    path = f"{STORAGE_FOLDER}/{slug}.png"
    url  = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"

    resp = http_requests.post(
        url,
        headers={
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type":  "image/png",
            "x-upsert":      "true",  # overwrite if exists
        },
        data=png_bytes,
        timeout=30,
    )

    if resp.status_code not in (200, 201):
        raise Exception(f"Supabase upload failed ({resp.status_code}): {resp.text}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"
    return public_url


def check_exists_in_supabase(slug: str) -> bool:
    """Check if infographic already exists in Supabase Storage."""
    path = f"{STORAGE_FOLDER}/{slug}.png"
    url  = f"{SUPABASE_URL}/storage/v1/object/info/public/{STORAGE_BUCKET}/{path}"
    resp = http_requests.get(url, timeout=10)
    return resp.status_code == 200


def get_public_url(slug: str) -> str:
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{STORAGE_FOLDER}/{slug}.png"


# ── Screenshot ─────────────────────────────────────────────────────────────────

def screenshot_constituency(page, slug: str, frontend_url: str) -> bytes:
    """Navigate to infographic page and take 1080x1080 screenshot."""
    target_url = f"{frontend_url}/infographic/{slug}"
    print(f"\n    -> Loading: {target_url}")

    # goto with domcontentloaded is faster than networkidle for SPA
    page.goto(target_url, wait_until="domcontentloaded", timeout=30000)
    print(f"    -> DOM loaded")

    # Wait for React to mount and render #infographic (includes loading state)
    try:
        page.wait_for_selector("#infographic", timeout=20000)
        print(f"    -> #infographic found")
    except Exception:
        content = page.content()
        print(f"    -> #infographic NOT found after 20s")
        print(f"    -> Page title: {page.title()} | URL: {page.url}")
        print(f"    -> Is FastAPI server running on port 8000?")
        print(f"    -> Body snippet: {content[200:600]}")
        raise Exception(f"#infographic not found — check frontend + API servers are both running")

    # Wait for data to finish loading (data-status attribute changes from "loading")
    try:
        page.wait_for_function(
            "() => document.querySelector('#infographic')?.getAttribute('data-status') !== 'loading'",
            timeout=20000,
        )
        status = page.eval_on_selector("#infographic", "el => el.getAttribute('data-status')")
        print(f"    -> Data loaded (status={status})")
        if status == "loading":
            raise Exception("Still loading after 20s — API server may be down or slow")
    except Exception as e:
        print(f"    -> WARNING: {e}")

    # Extra wait for fonts + bar animations to settle
    page.wait_for_timeout(1000)

    element = page.query_selector("#infographic")
    if not element:
        raise Exception(f"#infographic disappeared after wait for slug='{slug}'")

    png_bytes = element.screenshot(type="png")
    print(f"    -> Screenshot taken ({len(png_bytes) // 1024} KB)")
    return png_bytes


# ── Save URL to DB ─────────────────────────────────────────────────────────────

def save_url_to_constituency(constituency: Constituency, url: str, db: Session):
    """Store infographic URL in constituency extra_data."""
    extra = constituency.extra_data or {}
    extra["infographic_url"] = url
    constituency.extra_data = extra
    db.commit()


# ── Main ───────────────────────────────────────────────────────────────────────

def get_constituencies_to_process(db: Session, slugs: list[str] | None) -> list[Constituency]:
    """Get constituencies that have v4 predictions."""
    if slugs:
        return db.query(Constituency).filter(Constituency.slug.in_(slugs)).all()

    # Get constituency IDs that have v4 predictions
    predicted_ids = {
        r.constituency_id
        for r in db.query(Prediction.constituency_id)
        .filter(Prediction.predicted_year == 2026, Prediction.version == 4)
        .all()
    }

    return (
        db.query(Constituency)
        .filter(Constituency.id.in_(predicted_ids))
        .filter(Constituency.slug.isnot(None))
        .order_by(Constituency.ac_number)
        .all()
    )


def main():
    parser = argparse.ArgumentParser(description="Generate constituency infographics")
    parser.add_argument("--slugs", type=str, help="Comma-separated list of slugs")
    parser.add_argument("--force", action="store_true", help="Regenerate even if already exists")
    parser.add_argument("--frontend-url", type=str, default=DEFAULT_FRONTEND)
    args = parser.parse_args()

    slugs = [s.strip() for s in args.slugs.split(",")] if args.slugs else None

    db = SessionLocal()
    try:
        constituencies = get_constituencies_to_process(db, slugs)
        print(f"Constituencies to process: {len(constituencies)}")

        if not constituencies:
            print("No constituencies found. Make sure v4 predictions exist.")
            return

        success = 0
        skipped = 0
        errors  = 0

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            def new_page():
                ctx = browser.new_context(
                    viewport={"width": INFOGRAPHIC_WIDTH, "height": INFOGRAPHIC_HEIGHT},
                    device_scale_factor=2,
                )
                return ctx.new_page()

            page = new_page()

            for i, c in enumerate(constituencies, 1):
                slug = c.slug
                print(f"\n[{i}/{len(constituencies)}] {c.name} (slug={slug})")

                try:
                    # Skip if already exists (unless --force)
                    if not args.force and check_exists_in_supabase(slug):
                        print(f"    -> skipped (already in Supabase)")
                        skipped += 1
                        url = get_public_url(slug)
                        save_url_to_constituency(c, url, db)
                        continue

                    png_bytes = screenshot_constituency(page, slug, args.frontend_url)

                    # Save locally first
                    local_dir = os.path.join(_BASE, "data", "infographics")
                    os.makedirs(local_dir, exist_ok=True)
                    local_path = os.path.join(local_dir, f"{slug}.png")
                    with open(local_path, "wb") as f:
                        f.write(png_bytes)
                    print(f"    -> Saved locally: {local_path}")

                    # Upload to Supabase
                    print(f"    -> Uploading to Supabase...")
                    url = upload_to_supabase(slug, png_bytes)
                    save_url_to_constituency(c, url, db)
                    print(f"    -> DONE: {url}")
                    success += 1

                except Exception as e:
                    print(f"    -> ERROR: {e}")
                    errors += 1
                    # Create a fresh page so broken state doesn't affect next iteration
                    try:
                        page.close()
                    except Exception:
                        pass
                    page = new_page()
                    print(f"    -> Fresh browser page created for next iteration")

                time.sleep(0.3)

            browser.close()

    finally:
        db.close()

    print(f"\nDone. Success={success} Skipped={skipped} Errors={errors}")


if __name__ == "__main__":
    main()
