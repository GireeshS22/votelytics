"""
Scrape 2026 Tamil Nadu Candidates -> candidates table
=====================================================
Sources:
  1. Wikipedia  — SPA + NDA candidates (constituency no. + party + name)
  2. voterlist.co.in — TVK candidates (constituency no. + name + designation)
  3. voterlist.co.in — NTK candidates (constituency name + candidate name)

Usage:
    poetry run python scripts/scrape_candidates_2026.py
    poetry run python scripts/scrape_candidates_2026.py --dry-run
    poetry run python scripts/scrape_candidates_2026.py --source wikipedia
    poetry run python scripts/scrape_candidates_2026.py --source tvk
    poetry run python scripts/scrape_candidates_2026.py --source ntk
"""

import sys
import os
import re
import argparse

import requests
from bs4 import BeautifulSoup

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.constituency import Constituency
from app.models.candidate import Candidate


ELECTION_YEAR = 2026

WIKIPEDIA_URL = "https://en.wikipedia.org/wiki/2026_Tamil_Nadu_Legislative_Assembly_election"
TVK_URL       = "https://voterlist.co.in/tvk-candidate-list-2026-tamil-nadu/"
NTK_URL       = "https://voterlist.co.in/naam-tamilar-katchi-candidate-list-2026/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; VotelyticsBot/1.0)"
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_soup(url: str) -> BeautifulSoup:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def build_constituency_maps(db: Session):
    """
    Returns two maps:
      ac_number_map : {ac_number: constituency_id}
      name_map      : {normalized_name: constituency_id}
    """
    constituencies = db.query(Constituency).all()
    ac_number_map = {c.ac_number: c for c in constituencies}
    name_map      = {normalize(c.name): c for c in constituencies}
    return ac_number_map, name_map


# Spelling aliases: source name (after normalize) -> DB name (after normalize)
_NAME_ALIASES = {
    "sholingur":          "sholinghur",
    "pappireddippatti":   "pappireddipatti",
    "vridhachalam":       "vriddhachalam",
    "gandharvakottai":    "gandarvakkottai",
    "colachel":           "colachal",
    "tittagudi":          "tittakudi",
}


def normalize(name: str) -> str:
    """Lowercase, strip, remove SC/ST designations, collapse spaces, remove punctuation."""
    name = name.lower().strip()
    # Remove SC/ST/BC reservation suffixes e.g. "(SC)", "(ST)", "(SC/ST)"
    name = re.sub(r"\s*\(s[ct](?:/s[ct])?\)\s*$", "", name)
    name = re.sub(r"[^a-z0-9 ]", "", name)
    name = re.sub(r"\s+", " ", name)
    # Apply spelling aliases
    return _NAME_ALIASES.get(name, name)


def clean_candidate_name(raw: str) -> str:
    """Remove party-designation suffixes like '(Party President)'."""
    return re.sub(r"\s*\(.*?\)\s*$", "", raw).strip()


def upsert_candidate(
    db: Session,
    constituency: Constituency,
    name: str,
    party: str,
    alliance: str,
    dry_run: bool,
) -> str:
    """Insert or update a candidate row. Returns 'inserted'/'updated'/'skipped'."""
    # Use extra_data->election_year for scoping since there's no year column
    existing = (
        db.query(Candidate)
        .filter(
            Candidate.constituency_id == constituency.id,
            Candidate.alliance == alliance,
            Candidate.extra_data["election_year"].as_integer() == ELECTION_YEAR,
        )
        .first()
    )

    if dry_run:
        status = "updated" if existing else "inserted"
        print(f"  [would {status}] {constituency.name} | {alliance} | {party} | {name}")
        return status

    if existing:
        existing.name  = name
        existing.party = party
        return "updated"
    else:
        candidate = Candidate(
            name=name,
            party=party,
            alliance=alliance,
            constituency_id=constituency.id,
            extra_data={"election_year": ELECTION_YEAR},
        )
        db.add(candidate)
        return "inserted"


# ── Scrapers ───────────────────────────────────────────────────────────────────

def scrape_wikipedia(db: Session, ac_map: dict, dry_run: bool) -> dict:
    """Scrape SPA + NDA candidates from Wikipedia (Table 6).

    Confirmed row structure (from HTML inspection):
      9-col row (first in each district): district | ac_no | constituency | flag | spa_party | spa_candidate | flag | nda_party | nda_candidate
      8-col row (rest):                              ac_no | constituency | flag | spa_party | spa_candidate | flag | nda_party | nda_candidate
    """
    print("\n[Wikipedia] Scraping SPA + NDA candidates...")
    soup = get_soup(WIKIPEDIA_URL)

    counts = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}

    tables = soup.find_all("table", class_="wikitable")
    # Candidate table is the one with District/SPA/AIADMK+ headers — find it robustly
    candidate_table = None
    for table in tables:
        ths = [th.get_text(strip=True) for th in table.find_all("th")]
        if "District" in ths and "SPA" in ths and "AIADMK+" in ths:
            candidate_table = table
            break

    if candidate_table is None:
        print("  [ERROR] Could not find candidate table on Wikipedia page")
        counts["errors"] += 1
        return counts

    rows = candidate_table.find_all("tr")
    print(f"  Found candidate table with {len(rows)} rows")

    for row in rows:
        # AC number is in a <th> cell; constituency/candidate data in <td> cells
        th_cells = row.find_all("th")
        td_cells = row.find_all("td")

        if len(td_cells) < 7 or not th_cells:
            continue  # skip header rows

        # AC number is the last <th> in the row (others are header labels)
        ac_no_text = th_cells[-1].get_text(strip=True)
        texts      = [c.get_text(separator=" ", strip=True) for c in td_cells]

        # 8-td row (first in district): district(0) constituency(1) flag(2) spa_party(3) spa_cand(4) flag(5) nda_party(6) nda_cand(7)
        # 7-td row (rest):                           constituency(0) flag(1) spa_party(2) spa_cand(3) flag(4) nda_party(5) nda_cand(6)
        if len(texts) >= 8:
            spa_party     = texts[3].strip()
            spa_candidate = clean_candidate_name(texts[4])
            nda_party     = texts[6].strip()
            nda_candidate = clean_candidate_name(texts[7])
        else:
            spa_party     = texts[2].strip()
            spa_candidate = clean_candidate_name(texts[3])
            nda_party     = texts[5].strip()
            nda_candidate = clean_candidate_name(texts[6])

        m = re.search(r"\b(\d{1,3})\b", ac_no_text)
        if not m:
            continue
        ac_no = int(m.group(1))
        if not (1 <= ac_no <= 234):
            continue

        constituency = ac_map.get(ac_no)
        if constituency is None:
            print(f"  [WARN] AC {ac_no} not found in DB")
            counts["errors"] += 1
            continue

        try:
            if spa_candidate and spa_candidate not in ("-", ""):
                action = upsert_candidate(db, constituency, spa_candidate, spa_party, "SPA", dry_run)
                counts[action] += 1

            if nda_candidate and nda_candidate not in ("-", ""):
                action = upsert_candidate(db, constituency, nda_candidate, nda_party, "NDA", dry_run)
                counts[action] += 1

        except Exception as e:
            print(f"  [ERROR] AC {ac_no}: {e}")
            db.rollback()
            counts["errors"] += 1

    if not dry_run:
        db.commit()

    return counts


def scrape_tvk(db: Session, ac_map: dict, name_map: dict, dry_run: bool) -> dict:
    """Scrape TVK candidates from voterlist.co.in."""
    print("\n[TVK] Scraping TVK candidates...")
    soup = get_soup(TVK_URL)

    counts = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}

    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        for row in rows[1:]:
            cols = row.find_all(["td", "th"])
            if len(cols) < 2:
                continue

            texts = [c.get_text(separator=" ", strip=True) for c in cols]

            # Format: S.No | "No. Constituency Name" | "Candidate Name (Designation)"
            # Extract AC number from constituency column
            constituency_text = texts[1] if len(texts) > 1 else ""
            candidate_raw     = texts[2] if len(texts) > 2 else texts[1]

            m = re.match(r"^(\d{1,3})[.\s]+(.+)$", constituency_text.strip())
            if m:
                ac_no = int(m.group(1))
                constituency = ac_map.get(ac_no)
            else:
                # Fall back to name matching
                constituency = name_map.get(normalize(constituency_text))
                ac_no = None

            if constituency is None:
                if constituency_text:
                    print(f"  [WARN] TVK: could not match '{constituency_text}'")
                    counts["errors"] += 1
                continue

            candidate_name = clean_candidate_name(candidate_raw)
            if not candidate_name:
                continue

            action = upsert_candidate(db, constituency, candidate_name, "TVK", "TVK", dry_run)
            counts[action] += 1

    if not dry_run:
        db.commit()

    return counts


def scrape_ntk(db: Session, name_map: dict, dry_run: bool) -> dict:
    """Scrape NTK candidates from voterlist.co.in."""
    print("\n[NTK] Scraping NTK candidates...")
    soup = get_soup(NTK_URL)

    counts = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}

    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        for row in rows[1:]:
            cols = row.find_all(["td", "th"])
            if len(cols) < 2:
                continue

            texts = [c.get_text(separator=" ", strip=True) for c in cols]

            # NTK format: Candidate Name | Constituency Name
            candidate_name    = clean_candidate_name(texts[0])
            constituency_text = texts[1].strip()

            # Skip garbage rows: pure numbers, very short, or suspiciously long
            if re.fullmatch(r"\d+", constituency_text) or len(constituency_text) > 60:
                continue

            # Try AC number first, fall back to name
            m = re.match(r"^(\d{1,3})[.\s]+(.+)$", constituency_text.strip())
            if m:
                ac_no = int(m.group(1))
                constituency = name_map.get(ac_no)  # name_map keyed by name, not ac_no
                if constituency is None:
                    from app.database import SessionLocal as _SL
                    # use name fallback
                    constituency = name_map.get(normalize(m.group(2)))
            else:
                constituency = name_map.get(normalize(constituency_text))

            if constituency is None:
                print(f"  [WARN] NTK: could not match '{constituency_text}'")
                counts["errors"] += 1
                continue

            if not candidate_name:
                continue

            action = upsert_candidate(db, constituency, candidate_name, "NTK", "NTK", dry_run)
            counts[action] += 1

    if not dry_run:
        db.commit()

    return counts


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scrape 2026 candidates into DB")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing to DB")
    parser.add_argument("--source", choices=["wikipedia", "tvk", "ntk", "all"], default="all")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        ac_map, name_map = build_constituency_maps(db)
        print(f"Loaded {len(ac_map)} constituencies from DB")

        total = {"inserted": 0, "updated": 0, "skipped": 0, "errors": 0}

        if args.source in ("wikipedia", "all"):
            counts = scrape_wikipedia(db, ac_map, args.dry_run)
            print(f"  Wikipedia -> inserted={counts['inserted']} updated={counts['updated']} errors={counts['errors']}")
            for k in total: total[k] += counts.get(k, 0)

        if args.source in ("tvk", "all"):
            counts = scrape_tvk(db, ac_map, name_map, args.dry_run)
            print(f"  TVK       -> inserted={counts['inserted']} updated={counts['updated']} errors={counts['errors']}")
            for k in total: total[k] += counts.get(k, 0)

        if args.source in ("ntk", "all"):
            counts = scrape_ntk(db, name_map, args.dry_run)
            print(f"  NTK       -> inserted={counts['inserted']} updated={counts['updated']} errors={counts['errors']}")
            for k in total: total[k] += counts.get(k, 0)

        print(f"\n{'[DRY RUN] ' if args.dry_run else ''}TOTAL -> inserted={total['inserted']} updated={total['updated']} errors={total['errors']}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
