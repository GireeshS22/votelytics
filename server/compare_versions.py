"""
Detailed comparison of prediction versions 1, 2, and 3 for Tamil Nadu 2026 elections.
Joins Prediction with Constituency, computes per-constituency diffs, and prints aggregate stats.
"""
import sys
import io
from pathlib import Path

# Force UTF-8 output on Windows so box-drawing / arrow characters don't crash
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.prediction import Prediction
from app.models.constituency import Constituency
from sqlalchemy import func
from collections import defaultdict

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def get_alliance(pred: Prediction) -> str:
    if pred.extra_data and pred.extra_data.get("predicted_winner_alliance"):
        return pred.extra_data["predicted_winner_alliance"]
    return pred.predicted_winner_party or "Unknown"


def reclassify_confidence(win_prob: float, margin_pct: float) -> str:
    """Match the relaxed thresholds used by the API."""
    if win_prob is None or margin_pct is None:
        return "Unknown"
    if win_prob > 0.60 and margin_pct > 8.0:
        return "Safe"
    elif win_prob > 0.52 and margin_pct > 5.5:
        return "Likely"
    elif win_prob > 0.43 and margin_pct > 1.25:
        return "Lean"
    else:
        return "Toss-up"


def fmt(val, decimals=1, suffix=""):
    if val is None:
        return "N/A"
    return f"{val:.{decimals}f}{suffix}"


def truncate(s, width):
    s = str(s)
    return s if len(s) <= width else s[: width - 1] + "…"


# ─────────────────────────────────────────────
# Load data
# ─────────────────────────────────────────────

db = SessionLocal()

YEAR = 2026
VERSIONS = [1, 2, 3]

# Check which versions actually exist
version_counts = {}
for v in VERSIONS:
    cnt = db.query(func.count(Prediction.id)).filter(
        Prediction.predicted_year == YEAR,
        Prediction.version == v,
    ).scalar()
    version_counts[v] = cnt

print("=" * 80)
print(f"  VOTELYTICS - Prediction Version Comparison  (Year {YEAR})")
print("=" * 80)
print()
print("  Version availability:")
for v, cnt in version_counts.items():
    status = f"{cnt} constituencies" if cnt else "NOT FOUND"
    print(f"    v{v}: {status}")
print()

available_versions = [v for v in VERSIONS if version_counts[v] > 0]
if len(available_versions) < 2:
    print("  Need at least 2 versions to compare. Exiting.")
    db.close()
    sys.exit(1)

# Load all predictions for available versions, joined with constituency
all_preds = {}   # version -> {constituency_id: (Prediction, Constituency)}
for v in available_versions:
    rows = (
        db.query(Prediction, Constituency)
        .join(Constituency, Prediction.constituency_id == Constituency.id)
        .filter(
            Prediction.predicted_year == YEAR,
            Prediction.version == v,
        )
        .order_by(Constituency.ac_number)
        .all()
    )
    all_preds[v] = {pred.constituency_id: (pred, const) for pred, const in rows}

# Find constituencies present in ALL available versions
common_ids = set(all_preds[available_versions[0]].keys())
for v in available_versions[1:]:
    common_ids &= set(all_preds[v].keys())

print(f"  Constituencies in ALL {len(available_versions)} version(s): {len(common_ids)}")
print()

# ─────────────────────────────────────────────
# Build per-constituency comparison rows
# ─────────────────────────────────────────────

rows = []   # list of dicts, sorted by ac_number

for cid in sorted(
    common_ids,
    key=lambda cid: all_preds[available_versions[0]][cid][1].ac_number,
):
    row = {"constituency_id": cid}
    _, const = all_preds[available_versions[0]][cid]
    row["name"] = const.name
    row["ac_number"] = const.ac_number
    row["district"] = const.district or ""
    for v in available_versions:
        pred, _ = all_preds[v][cid]
        conf = reclassify_confidence(pred.win_probability, pred.predicted_margin_pct)
        row[f"v{v}_alliance"] = get_alliance(pred)
        row[f"v{v}_party"] = pred.predicted_winner_party or "?"
        row[f"v{v}_confidence"] = conf
        row[f"v{v}_win_prob"] = pred.win_probability
        row[f"v{v}_vote_share"] = pred.predicted_vote_share
    rows.append(row)

# ─────────────────────────────────────────────
# SECTION 1 — Alliance seat counts per version
# ─────────────────────────────────────────────

print("=" * 80)
print("  SECTION 1 — Alliance Seat Counts per Version")
print("=" * 80)

ALLIANCES_OF_INTEREST = ["DMK+", "AIADMK+", "TVK", "NTK"]

alliance_counts = {}   # version -> alliance -> count
for v in available_versions:
    alliance_counts[v] = defaultdict(int)
    for cid, (pred, _) in all_preds[v].items():
        a = get_alliance(pred)
        alliance_counts[v][a] += 1

# Collect all alliances across versions
all_alliances = sorted(
    set(a for v in available_versions for a in alliance_counts[v]),
    key=lambda a: -sum(alliance_counts[v].get(a, 0) for v in available_versions),
)

# Header
hdr_parts = ["  {:<18}".format("Alliance")]
for v in available_versions:
    hdr_parts.append(f"  v{v:>5}")
print("".join(hdr_parts))
print("  " + "-" * (18 + 7 * len(available_versions)))

for a in all_alliances:
    row_parts = ["  {:<18}".format(truncate(a, 18))]
    for v in available_versions:
        cnt = alliance_counts[v].get(a, 0)
        row_parts.append(f"  {cnt:>5}")
    print("".join(row_parts))

print()

# ─────────────────────────────────────────────
# SECTION 2 — Winner Changes between versions
# ─────────────────────────────────────────────

print("=" * 80)
print("  SECTION 2 — Winner Changes Between Versions")
print("=" * 80)

def count_changes(v_from, v_to):
    changes = []
    for row in rows:
        a_from = row.get(f"v{v_from}_alliance")
        a_to = row.get(f"v{v_to}_alliance")
        if a_from is None or a_to is None:
            continue
        if a_from != a_to:
            changes.append({
                "ac": row["ac_number"],
                "name": row["name"],
                "from": a_from,
                "to": a_to,
                "prob_from": row.get(f"v{v_from}_win_prob"),
                "prob_to": row.get(f"v{v_to}_win_prob"),
                "conf_from": row.get(f"v{v_from}_confidence"),
                "conf_to": row.get(f"v{v_to}_confidence"),
            })
    return changes

version_pairs = []
for i in range(len(available_versions)):
    for j in range(i + 1, len(available_versions)):
        version_pairs.append((available_versions[i], available_versions[j]))

change_map = {}
for vf, vt in version_pairs:
    changes = count_changes(vf, vt)
    change_map[(vf, vt)] = changes
    print(f"\n  v{vf} -> v{vt}: {len(changes)} seat(s) changed winner")
    if changes:
        col_w = [4, 28, 12, 14, 14, 10, 10, 10, 10]
        hdr = (f"  {'AC':<{col_w[0]}}  {'Constituency':<{col_w[1]}}  "
               f"{'v{0} Alliance'.format(vf):<{col_w[2]}}  {'v{0} Alliance'.format(vt):<{col_w[3]}}  "
               f"{'v{0} Prob'.format(vf):<{col_w[4]}}  {'v{0} Prob'.format(vt):<{col_w[5]}}  "
               f"{'Conf'.format(vf):<{col_w[6]}}  {'Conf'.format(vt):<{col_w[7]}}")
        print(hdr)
        print("  " + "-" * (sum(col_w) + 2 * len(col_w)))
        for c in changes:
            prob_f = fmt(c["prob_from"], 3)
            prob_t = fmt(c["prob_to"], 3)
            print(
                f"  {c['ac']:<{col_w[0]}}  "
                f"{truncate(c['name'], col_w[1]):<{col_w[1]}}  "
                f"{truncate(c['from'], col_w[2]):<{col_w[2]}}  "
                f"{truncate(c['to'], col_w[3]):<{col_w[3]}}  "
                f"{prob_f:<{col_w[4]}}  "
                f"{prob_t:<{col_w[5]}}  "
                f"{truncate(c['conf_from'] or '', col_w[6]):<{col_w[6]}}  "
                f"{truncate(c['conf_to'] or '', col_w[7]):<{col_w[7]}}"
            )

print()

# ─────────────────────────────────────────────
# SECTION 3 — Average Win Probability by Alliance per Version
# ─────────────────────────────────────────────

print("=" * 80)
print("  SECTION 3 — Average Win Probability by Alliance per Version")
print("=" * 80)

avg_prob = {}   # version -> alliance -> [probs]
for v in available_versions:
    avg_prob[v] = defaultdict(list)
    for cid, (pred, _) in all_preds[v].items():
        a = get_alliance(pred)
        if pred.win_probability is not None:
            avg_prob[v][a].append(pred.win_probability)

hdr_parts = ["  {:<18}".format("Alliance")]
for v in available_versions:
    hdr_parts.append(f"  {'v' + str(v) + ' Avg Prob':>12}")
print("".join(hdr_parts))
print("  " + "-" * (18 + 14 * len(available_versions)))

for a in all_alliances:
    row_parts = ["  {:<18}".format(truncate(a, 18))]
    for v in available_versions:
        probs = avg_prob[v].get(a, [])
        if probs:
            avg = sum(probs) / len(probs)
            row_parts.append(f"  {avg:>11.3f} ")
        else:
            row_parts.append(f"  {'N/A':>12}")
    print("".join(row_parts))

print()

# ─────────────────────────────────────────────
# SECTION 4 — Confidence Level Distribution per Version
# ─────────────────────────────────────────────

print("=" * 80)
print("  SECTION 4 — Confidence Level Distribution per Version (reclassified)")
print("=" * 80)

CONF_LEVELS = ["Safe", "Likely", "Lean", "Toss-up"]

conf_dist = {}   # version -> conf -> count
for v in available_versions:
    conf_dist[v] = defaultdict(int)
    for cid, (pred, _) in all_preds[v].items():
        c = reclassify_confidence(pred.win_probability, pred.predicted_margin_pct)
        conf_dist[v][c] += 1

hdr_parts = ["  {:<10}".format("Level")]
for v in available_versions:
    hdr_parts.append(f"  v{v:>5}  {'%':>6}")
print("".join(hdr_parts))
print("  " + "-" * (10 + 15 * len(available_versions)))

total_preds = {v: sum(conf_dist[v].values()) for v in available_versions}

for cl in CONF_LEVELS:
    row_parts = ["  {:<10}".format(cl)]
    for v in available_versions:
        cnt = conf_dist[v].get(cl, 0)
        pct = (cnt / total_preds[v] * 100) if total_preds[v] else 0
        row_parts.append(f"  {cnt:>5}  {pct:>5.1f}%")
    print("".join(row_parts))

# totals
row_parts = ["  {:<10}".format("TOTAL")]
for v in available_versions:
    row_parts.append(f"  {total_preds[v]:>5}  {'100%':>6}")
print("  " + "-" * (10 + 15 * len(available_versions)))
print("".join(row_parts))

print()

# ─────────────────────────────────────────────
# SECTION 5 — Per-Constituency Full Comparison Table
# ─────────────────────────────────────────────

print("=" * 80)
print("  SECTION 5 — Per-Constituency Detailed Comparison")
print("=" * 80)

# Only print if 3 versions present (otherwise it gets very wide)
if len(available_versions) >= 2:
    # Build columns dynamically
    version_label = "/".join([f"v{v}" for v in available_versions])

    # Print header
    AC_W = 4
    NAME_W = 26
    per_v_cols = [("Alliance", 10), ("Party", 12), ("Prob", 6), ("Conf", 8), ("VS%", 6)]

    hdr = f"  {'AC':<{AC_W}}  {'Constituency':<{NAME_W}}"
    sep = f"  {'':-<{AC_W}}  {'':-<{NAME_W}}"

    for v in available_versions:
        hdr += f"  [v{v}] {'Alliance':<10} {'Party':<12} {'Prob':>5} {'Conf':<8} {'VS%':>5}"
        sep += f"  {'':-<{2+1}} {'':-<{10}} {'':-<{12}} {'':-<{5}} {'':-<{8}} {'':-<{5}}"

    # Add CHANGED marker column
    if len(available_versions) >= 2:
        hdr += "  Changed?"
        sep += "  " + "-" * 8

    print(hdr)
    print(sep)

    for row in rows:
        line = f"  {row['ac_number']:<{AC_W}}  {truncate(row['name'], NAME_W):<{NAME_W}}"
        for v in available_versions:
            al = truncate(row.get(f"v{v}_alliance", "?"), 10)
            pt = truncate(row.get(f"v{v}_party", "?"), 12)
            pr = row.get(f"v{v}_win_prob")
            pr_s = fmt(pr, 3) if pr is not None else "N/A"
            cf = truncate(row.get(f"v{v}_confidence", "?"), 8)
            vs = row.get(f"v{v}_vote_share")
            vs_s = fmt(vs, 1) if vs is not None else "N/A"
            line += f"  [v{v}] {al:<10} {pt:<12} {pr_s:>5} {cf:<8} {vs_s:>5}"

        # Check if alliance changed across any two consecutive versions
        changed_flags = []
        for i in range(len(available_versions) - 1):
            va = available_versions[i]
            vb = available_versions[i + 1]
            if row.get(f"v{va}_alliance") != row.get(f"v{vb}_alliance"):
                changed_flags.append(f"v{va}→v{vb}")

        if changed_flags:
            line += f"  *** {', '.join(changed_flags)}"

        print(line)

print()

# ─────────────────────────────────────────────
# SECTION 6 — Summary of Constituencies That Changed
# ─────────────────────────────────────────────

print("=" * 80)
print("  SECTION 6 — Summary: Constituencies with ANY Alliance Change")
print("=" * 80)

all_changed = set()
for vf, vt in version_pairs:
    for c in change_map[(vf, vt)]:
        all_changed.add(c["ac"])

print(f"\n  Total constituencies with at least one alliance change: {len(all_changed)}")
print(f"  Total constituencies with NO change across all versions: {len(rows) - len(all_changed)}")

# Show them with all version data
if all_changed:
    print(f"\n  {'AC':<5}  {'Constituency':<28}", end="")
    for v in available_versions:
        print(f"  v{v} Alliance", end="")
    print()
    print("  " + "-" * (5 + 28 + 16 * len(available_versions)))

    for row in rows:
        if row["ac_number"] in all_changed:
            print(f"  {row['ac_number']:<5}  {truncate(row['name'], 28):<28}", end="")
            for v in available_versions:
                al = row.get(f"v{v}_alliance", "N/A")
                print(f"  {truncate(al, 12):<14}", end="")
            print()

print()

# ─────────────────────────────────────────────
# SECTION 7 — Win Probability Shifts (Top movers)
# ─────────────────────────────────────────────

if len(available_versions) >= 2:
    print("=" * 80)
    print("  SECTION 7 — Top 20 Win Probability Shifts (v1 → latest version)")
    print("=" * 80)

    v_first = available_versions[0]
    v_last = available_versions[-1]

    prob_shifts = []
    for row in rows:
        p_first = row.get(f"v{v_first}_win_prob")
        p_last = row.get(f"v{v_last}_win_prob")
        if p_first is not None and p_last is not None:
            diff = p_last - p_first
            prob_shifts.append({
                "ac": row["ac_number"],
                "name": row["name"],
                "alliance": row.get(f"v{v_last}_alliance", "?"),
                "p_first": p_first,
                "p_last": p_last,
                "diff": diff,
            })

    prob_shifts.sort(key=lambda x: abs(x["diff"]), reverse=True)

    print(f"\n  Top 20 by absolute change (v{v_first} → v{v_last}):")
    print(f"  {'AC':<5}  {'Constituency':<28}  {'Alliance':<12}  "
          f"{'v' + str(v_first) + ' Prob':>8}  {'v' + str(v_last) + ' Prob':>8}  {'Change':>8}")
    print("  " + "-" * 80)
    for ps in prob_shifts[:20]:
        direction = "+" if ps["diff"] >= 0 else ""
        print(
            f"  {ps['ac']:<5}  {truncate(ps['name'], 28):<28}  "
            f"{truncate(ps['alliance'], 12):<12}  "
            f"{ps['p_first']:>8.3f}  {ps['p_last']:>8.3f}  "
            f"{direction}{ps['diff']:>7.3f}"
        )

    print()

# ─────────────────────────────────────────────
# SECTION 8 — Flip Analysis: net gains / losses
# ─────────────────────────────────────────────

if len(available_versions) >= 2:
    print("=" * 80)
    print("  SECTION 8 — Net Seat Gains / Losses per Alliance (v1 → latest)")
    print("=" * 80)

    v_first = available_versions[0]
    v_last = available_versions[-1]

    gained = defaultdict(list)  # alliance -> list of seat names gained
    lost = defaultdict(list)    # alliance -> list of seat names lost

    for row in rows:
        a_first = row.get(f"v{v_first}_alliance")
        a_last = row.get(f"v{v_last}_alliance")
        if a_first and a_last and a_first != a_last:
            lost[a_first].append(row["name"])
            gained[a_last].append(row["name"])

    all_net_alliances = sorted(set(list(gained.keys()) + list(lost.keys())))

    print(f"\n  {'Alliance':<18}  {'Gained':>7}  {'Lost':>7}  {'Net':>7}")
    print("  " + "-" * 50)
    for a in all_net_alliances:
        g = len(gained.get(a, []))
        l = len(lost.get(a, []))
        net = g - l
        net_s = ('+' if net > 0 else '') + str(net)
        print(f"  {truncate(a, 18):<18}  {g:>7}  {l:>7}  {net_s:>7}")

    print()
    for a in all_net_alliances:
        if gained.get(a):
            print(f"  {a} GAINED: {', '.join(gained[a])}")
        if lost.get(a):
            print(f"  {a} LOST:   {', '.join(lost[a])}")
        if gained.get(a) or lost.get(a):
            print()

db.close()

print("=" * 80)
print("  Analysis complete.")
print("=" * 80)
