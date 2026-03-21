"""
Service for generating election predictions using ChatGPT
Maps historical results to current alliances and generates 2026 predictions
"""
from openai import OpenAI
import json
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
import time

from app.models.constituency import Constituency
from app.models.election import ElectionResult
from app.models.prediction import Prediction
from app.schemas.prediction import ChatGPTResponse


def load_alliance_config(alliance_file_path: str) -> Dict:
    """Load alliance configuration from JSON file"""
    with open(alliance_file_path, 'r') as f:
        return json.load(f)


def load_trends_summary(trends_file_path: str) -> str:
    """Load and format trends summary"""
    with open(trends_file_path, 'r') as f:
        full_text = f.read()

    # Extract key sections for concise summary - Updated January 2026
    summary = """CURRENT POLITICAL CONTEXT (January 2026):

GOVERNMENT: DMK incumbent (2021-2026) facing mixed performance
- Criticized for law & order failures and corruption allegations
- Strong on welfare schemes (women's assistance, free bus rides, breakfast schemes)
- Clean sweep in 2024 Lok Sabha (39/39 seats) provides momentum
- Significant anti-incumbency sentiment detected

ALLIANCES (January 2026 - UPDATED):
- DMK-led Secular Progressive Alliance (SPA) - 13 partners, largely intact
- AIADMK-BJP NDA alliance - CONSOLIDATED with PMK (Anbumani) and AMMK joining
- TVK (Actor Vijay) - standalone, KA Sengottaiyan joined as chief coordinator (Nov 2025)
- NTK (Seeman) - standalone, contesting all 234 seats
- DMDK - undecided as of Jan 25, 2026

MAJOR DEVELOPMENTS (Late 2025 - January 2026):
- PMK (Anbumani faction) joined NDA - January 7, 2026
- AMMK (TTV Dhinakaran) rejoined NDA - January 22-23, 2026
- KA Sengottaiyan (ex-AIADMK) joined TVK - November 2025
- PM Modi rally at Madurantakam - January 23, 2026 (unified NDA front, EPS as CM candidate)
- NDA consolidation gaining momentum
- DMDK still undecided despite NDA efforts

TOP VOTER CONCERNS:
1. Women Safety (27.3%)
2. Liquor & Drug Menace (21.8%)
3. Unemployment (17.6%)
4. Corruption (14.2%)
5. Language/Cultural Identity (9.5%)
6. Inflation (6.4%)

KEY DYNAMICS:
- Tamil Nadu historically alternates DMK and AIADMK
- NDA consolidation (PMK + AMMK) strengthens opposition front
- Anti-incumbency vs welfare schemes
- Four-way split: DMK+ vs NDA vs TVK vs NTK
- TVK as wildcard for splitting anti-incumbency votes

PARTY PERFORMANCE CONTEXT:
- NTK (Seeman): Historically gets 3-6% statewide, strong social media presence but limited ground impact
- TVK (Vijay): New entrant with massive star power, KA Sengottaiyan brings AIADMK cadre influence
- PMK: Vanniyar base (6-8% statewide), now part of NDA (Anbumani faction)
- AMMK: AIADMK splinter votes now consolidated back to NDA
- DMK+ vs AIADMK+ (NDA): Primary contest for power, NDA stronger with consolidations"""

    return summary


def map_party_to_alliance(party: str, alliance_mapping: Dict) -> str:
    """Map a party name to its 2026 alliance"""
    # Normalize party name
    party_normalized = party.strip().upper()

    # Direct mapping
    for key, alliance in alliance_mapping.items():
        if key.upper() == party_normalized:
            return alliance

    # Fuzzy matching for common variations
    if 'DMK' in party_normalized and 'AIADMK' not in party_normalized and 'MDMK' not in party_normalized:
        return 'DMK+'
    elif 'AIADMK' in party_normalized or 'ADMK' in party_normalized:
        return 'AIADMK+'
    elif 'CONGRESS' in party_normalized or 'INC' in party_normalized:
        return 'DMK+'
    elif 'BJP' in party_normalized or 'JANATA' in party_normalized:
        return 'AIADMK+'
    elif 'VCK' in party_normalized:
        return 'DMK+'
    elif 'PMK' in party_normalized:
        return 'AIADMK+'  # PMK joined NDA January 2026
    elif 'NTK' in party_normalized or 'NAAM TAMILAR' in party_normalized:
        return 'NTK'
    elif 'MDMK' in party_normalized:
        return 'DMK+'
    elif 'CPI' in party_normalized or 'COMMUNIST' in party_normalized:
        return 'DMK+'
    elif 'MNM' in party_normalized:
        return 'DMK+'
    elif 'AMMK' in party_normalized:
        return 'AIADMK+'  # AMMK rejoined NDA January 2026
    elif 'DMDK' in party_normalized:
        return 'DMK+'  # DMDK joined DMK+ alliance - March 2026
    else:
        return 'Others'


def fetch_constituency_historical_data(
    constituency_id: int,
    db: Session,
    alliance_mapping: Dict
) -> Dict[str, Any]:
    """
    Fetch historical election results for a constituency
    Map parties to current 2026 alliances
    """
    constituency = db.query(Constituency).filter(Constituency.id == constituency_id).first()

    if not constituency:
        return None

    # Get results for 2021, 2016, 2011
    years = [2021, 2016, 2011]
    historical_data = {}

    for year in years:
        results = db.query(ElectionResult).filter(
            ElectionResult.constituency_id == constituency_id,
            ElectionResult.year == year
        ).order_by(ElectionResult.rank).all()

        if not results:
            continue

        # Map results to alliances
        alliance_votes = {}
        top_candidates = []
        total_votes = sum([r.total_votes or 0 for r in results])

        for result in results[:10]:  # Top 10 candidates
            alliance = map_party_to_alliance(result.party, alliance_mapping)

            if alliance not in alliance_votes:
                alliance_votes[alliance] = {
                    'votes': 0,
                    'candidates': []
                }

            alliance_votes[alliance]['votes'] += (result.total_votes or 0)
            alliance_votes[alliance]['candidates'].append({
                'name': result.candidate_name,
                'party': result.party,
                'votes': result.total_votes,
                'vote_share': result.vote_share_pct,
                'rank': result.rank
            })

            if len(top_candidates) < 5:
                top_candidates.append({
                    'name': result.candidate_name,
                    'party': result.party,
                    'alliance': alliance,
                    'votes': result.total_votes,
                    'vote_share': result.vote_share_pct,
                    'rank': result.rank
                })

        # Calculate alliance vote shares
        alliance_shares = {}
        for alliance, data in alliance_votes.items():
            vote_share = (data['votes'] / total_votes * 100) if total_votes > 0 else 0
            alliance_shares[alliance] = {
                'votes': data['votes'],
                'vote_share': round(vote_share, 2),
                'top_candidate': data['candidates'][0] if data['candidates'] else None
            }

        # Sort alliances by vote share
        sorted_alliances = sorted(alliance_shares.items(), key=lambda x: x[1]['vote_share'], reverse=True)

        historical_data[year] = {
            'total_votes': total_votes,
            'alliance_shares': dict(sorted_alliances),
            'top_candidates': top_candidates,
            'winner': results[0].party if results else None,
            'winner_alliance': map_party_to_alliance(results[0].party, alliance_mapping) if results else None,
            'winner_vote_share': results[0].vote_share_pct if results else 0,
            'margin_pct': results[0].margin_pct if results else 0
        }

    return {
        'constituency': {
            'id': constituency.id,
            'name': constituency.name,
            'ac_number': constituency.ac_number,
            'district': constituency.district,
            'region': constituency.region or 'Unknown',
            'population': constituency.population,
            'urban_pct': constituency.urban_population_pct,
            'literacy_rate': constituency.literacy_rate
        },
        'historical_results': historical_data
    }


def build_prediction_prompt(
    constituency_data: Dict,
    alliance_config: Dict,
    trends_summary: str,
    previous_prediction: Optional[Dict] = None
) -> str:
    """Build comprehensive prompt for ChatGPT"""

    const = constituency_data['constituency']
    hist = constituency_data['historical_results']

    prompt = f"""You are an expert Tamil Nadu political analyst. Predict the 2026 Assembly Election outcome for this constituency based on historical data and current trends.

CONSTITUENCY: {const['name']} (AC #{const['ac_number']})
DISTRICT: {const['district']} | REGION: {const['region']}
DEMOGRAPHICS: Population {const['population']:,} | Urban {const['urban_pct']:.1f}% | Literacy {const['literacy_rate']:.1f}%

{trends_summary}
"""

    # Add previous prediction if available (for version 2+)
    if previous_prediction:
        _v_labels = {1: "November 2025", 2: "January 2026", 3: "March 2026"}
        _v_num    = previous_prediction.get('version', 1)
        _v_label  = _v_labels.get(_v_num, f"Version {_v_num}")
        prompt += f"""
PREVIOUS PREDICTION (Version {_v_num} — {_v_label}):
- Predicted Winner: {previous_prediction.get('winner_alliance', 'N/A')} ({previous_prediction.get('winner_party', 'N/A')})
- Vote Share: {previous_prediction.get('vote_share', 0):.1f}%
- Margin: {previous_prediction.get('margin_pct', 0):.1f}%
- Confidence: {previous_prediction.get('confidence_level', 'N/A')}
- Key Factors: {previous_prediction.get('key_factors', 'N/A')[:300]}...

NOTE: This is your previous prediction. Re-evaluate objectively based on the latest political context above.
You may confirm, adjust margins, or change the winner - base your decision purely on evidence and political analysis.

"""

    prompt += """CURRENT ALLIANCE STRUCTURE (2026):
"""

    # Add alliance details
    for alliance_name, alliance_info in alliance_config['alliances'].items():
        if alliance_name in ['DMK+', 'AIADMK+', 'NTK', 'TVK', 'DMDK']:
            partners = ', '.join([p['party'] for p in alliance_info['partners'][:5]])
            prompt += f"- {alliance_name}: {partners}\n"

    prompt += f"\nHISTORICAL RESULTS (mapped to 2026 alliances):\n\n"

    # Add historical results
    for year in [2021, 2016, 2011]:
        if year in hist:
            data = hist[year]
            prompt += f"{year} Election:\n"
            prompt += f"Winner: {data['winner_alliance']} alliance ({data['winner']}) - {data['winner_vote_share']:.1f}% (Margin: {data['margin_pct']:.1f}%)\n"
            prompt += f"Alliance Performance:\n"

            for alliance, share_data in list(data['alliance_shares'].items())[:4]:
                prompt += f"  - {alliance}: {share_data['vote_share']:.1f}%\n"
            prompt += "\n"

    # Calculate swing
    if 2021 in hist and 2016 in hist:
        prompt += "SWING ANALYSIS (2016 → 2021):\n"
        for alliance in ['DMK+', 'AIADMK+', 'NTK', 'Others']:
            vote_2021 = hist[2021]['alliance_shares'].get(alliance, {}).get('vote_share', 0)
            vote_2016 = hist[2016]['alliance_shares'].get(alliance, {}).get('vote_share', 0)
            swing = vote_2021 - vote_2016
            if swing != 0:
                prompt += f"  - {alliance}: {swing:+.1f}%\n"
        prompt += "\n"

    prompt += """TASK: Predict the 2026 election outcome for this constituency at ALLIANCE level.

Consider:
- Historical voting patterns and swings
- Current anti-incumbency sentiment
- Alliance strengths in this region
- Demographic factors (urban/rural, literacy)
- Local issues and voter concerns
- Four-way contest dynamics

IMPORTANT: If the race is very close, uncertain, or you cannot confidently predict a winner, mark it as "Toss-up".
In Toss-up scenarios, predict the most likely winner but indicate low confidence and close margin.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "predicted_winner_alliance": "DMK+",
  "predicted_winner_party": "DMK",
  "predicted_winner_name": null,
  "confidence_level": "Safe",
  "win_probability": 0.72,
  "predicted_vote_share": 46.5,
  "predicted_margin_pct": 8.3,
  "top_alliances": [
    {"alliance": "DMK+", "lead_party": "DMK", "vote_share": 46.5},
    {"alliance": "AIADMK+", "lead_party": "AIADMK", "vote_share": 38.2},
    {"alliance": "NTK", "lead_party": "NTK", "vote_share": 12.0},
    {"alliance": "TVK", "lead_party": "TVK", "vote_share": 3.3}
  ],
  "swing_from_last_election": 2.3,
  "key_factors": "Detailed explanation considering alliance dynamics, historical patterns, anti-incumbency, local factors, and voter concerns"
}

Confidence Level Guidelines:
- "Safe": Clear winner with strong advantage (>65% probability, >10% margin)
- "Likely": Strong lead but some uncertainty (55-65% probability, 7-10% margin)
- "Lean": Narrow advantage (50-55% probability, 4-7% margin)
- "Toss-up": Very close race, uncertain outcome, or insufficient data to confidently predict (<50% probability or <4% margin)

Use "Toss-up" when:
- Top 2 alliances are within 3-4% of each other
- Historical data is conflicting or limited
- Four-way split makes outcome unpredictable
- Anti-incumbency sentiment is strong but opposition is fragmented
"""

    return prompt


def call_chatgpt_for_prediction(
    prompt: str,
    api_key: str,
    model: str = "gpt-5",
    max_retries: int = 3
) -> Optional[Dict]:
    """Call ChatGPT API and return parsed prediction"""

    client = OpenAI(api_key=api_key)

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = response.choices[0].message.content

            # Debug output
            print(f"\n=== GPT RESPONSE ===")
            print(response_text[:500])
            print("=" * 50)

            # Clean response (remove markdown if present)
            clean_text = response_text.strip()
            if clean_text.startswith("```"):
                lines = clean_text.split("\n")
                clean_text = "\n".join(lines[1:-1])
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:]

            # Parse JSON
            prediction_data = json.loads(clean_text)

            # Validate required fields
            required_fields = [
                'predicted_winner_alliance', 'predicted_winner_party',
                'confidence_level', 'win_probability', 'predicted_vote_share',
                'predicted_margin_pct', 'top_alliances', 'swing_from_last_election',
                'key_factors'
            ]

            if all(field in prediction_data for field in required_fields):
                return prediction_data
            else:
                print(f"Attempt {attempt + 1}/{max_retries}: Missing required fields")

        except json.JSONDecodeError as e:
            print(f"Attempt {attempt + 1}/{max_retries}: JSON parse error - {e}")
        except Exception as e:
            print(f"Attempt {attempt + 1}/{max_retries}: API error - {e}")

        if attempt < max_retries - 1:
            wait_time = (2 ** attempt) * 5
            print(f"Waiting {wait_time}s before retry...")
            time.sleep(wait_time)

    return None


def fetch_previous_prediction(
    constituency_id: int,
    db: Session,
    year: int = 2026
) -> Optional[Dict]:
    """Fetch the most recent prediction for a constituency (for v2+ generation)"""
    prediction = db.query(Prediction).filter(
        Prediction.constituency_id == constituency_id,
        Prediction.predicted_year == year
    ).order_by(Prediction.version.desc()).first()

    if not prediction:
        return None

    # Extract alliance from extra_data
    winner_alliance = prediction.extra_data.get('predicted_winner_alliance') if prediction.extra_data else prediction.predicted_winner_party

    return {
        'version': prediction.version,
        'winner_alliance': winner_alliance,
        'winner_party': prediction.predicted_winner_party,
        'vote_share': prediction.predicted_vote_share,
        'margin_pct': prediction.predicted_margin_pct,
        'confidence_level': prediction.confidence_level,
        'win_probability': prediction.win_probability,
        'key_factors': prediction.key_factors
    }


def generate_prediction_for_constituency(
    constituency_id: int,
    db: Session,
    alliance_config: Dict,
    trends_summary: str,
    api_key: str,
    model: str = "gpt-5"
) -> Optional[Dict]:
    """
    Main function to generate prediction for a constituency
    Returns prediction data ready for database insertion
    """

    # Fetch constituency and historical data
    constituency_data = fetch_constituency_historical_data(
        constituency_id=constituency_id,
        db=db,
        alliance_mapping=alliance_config['party_mapping']
    )

    if not constituency_data:
        print(f"Failed to fetch data for constituency {constituency_id}")
        return None

    # Fetch previous prediction (for v2+ context)
    previous_prediction = fetch_previous_prediction(constituency_id, db)

    # Build prompt
    prompt = build_prediction_prompt(
        constituency_data=constituency_data,
        alliance_config=alliance_config,
        trends_summary=trends_summary,
        previous_prediction=previous_prediction
    )

    # Call ChatGPT
    prediction_data = call_chatgpt_for_prediction(
        prompt=prompt,
        api_key=api_key,
        model=model
    )

    if not prediction_data:
        return None

    # Add constituency_id and metadata
    prediction_data['constituency_id'] = constituency_id
    prediction_data['predicted_year'] = 2026
    prediction_data['prediction_model'] = 'ChatGPT'
    prediction_data['extra_data'] = {
        'alliance_config_version': '2026_v2',
        'trends_date': '2026-01',
        'historical_data_years': [2021, 2016, 2011],
        'previous_prediction_version': previous_prediction.get('version') if previous_prediction else None
    }

    return prediction_data
