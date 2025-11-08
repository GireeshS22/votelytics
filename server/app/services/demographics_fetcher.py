"""
Service for fetching constituency demographics using LLM
"""
from openai import OpenAI
import json
from typing import Dict, Optional
import time


def build_demographics_prompt(
    constituency_name: str,
    district: str,
    region: str,
    ac_number: int
) -> str:
    """Build prompt for LLM to fetch demographics data"""
    prompt = f"""You are a data assistant providing demographic information for Tamil Nadu constituencies.

Constituency: {constituency_name}
District: {district}
Region: {region}
Assembly Constituency Number: {ac_number}

Provide the following demographic data based on latest available census/statistical data:
1. Total population (approximate, from 2011 census or estimates)
2. Urban population percentage (0-100)
3. Literacy rate percentage (0-100)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{{"population": 250000, "urban_pct": 45.5, "literacy_rate": 78.2}}

If exact data is unavailable, provide best estimates based on district averages for Tamil Nadu."""

    return prompt


def parse_demographics_response(response_text: str) -> Optional[Dict[str, float]]:
    """
    Parse and validate LLM response
    Returns dict with keys: population, urban_pct, literacy_rate
    Returns None if invalid
    """
    try:
        # Remove markdown code blocks if present
        clean_text = response_text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("```")[1]
            if clean_text.startswith("json"):
                clean_text = clean_text[4:]

        # Parse JSON
        data = json.loads(clean_text)

        # Validate required fields
        if not all(key in data for key in ["population", "urban_pct", "literacy_rate"]):
            print(f"Missing required fields in response: {data}")
            return None

        # Validate ranges
        if not (0 < data["population"] < 1000000):
            print(f"Invalid population value: {data['population']}")
            return None

        if not (0 <= data["urban_pct"] <= 100):
            print(f"Invalid urban_pct value: {data['urban_pct']}")
            return None

        if not (0 <= data["literacy_rate"] <= 100):
            print(f"Invalid literacy_rate value: {data['literacy_rate']}")
            return None

        return {
            "population": int(data["population"]),
            "urban_pct": float(data["urban_pct"]),
            "literacy_rate": float(data["literacy_rate"])
        }

    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        print(f"Response text: {response_text}")
        return None
    except Exception as e:
        print(f"Error parsing response: {e}")
        return None


def fetch_demographics_from_llm(
    constituency_name: str,
    district: str,
    region: str,
    ac_number: int,
    api_key: str,
    model: str = "gpt-5-mini",
    max_retries: int = 3
) -> Optional[Dict[str, float]]:
    """
    Fetch demographics for a constituency using LLM

    Args:
        constituency_name: Name of constituency
        district: District name
        region: Region (North/South/Central/West)
        ac_number: Assembly constituency number
        api_key: OpenAI API key
        model: Model to use (default: gpt-5-mini)
        max_retries: Maximum retry attempts

    Returns:
        Dict with population, urban_pct, literacy_rate or None if failed
    """
    client = OpenAI(api_key=api_key)

    prompt = build_demographics_prompt(
        constituency_name=constituency_name,
        district=district,
        region=region,
        ac_number=ac_number
    )

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = response.choices[0].message.content

            # DEBUG: Print raw LLM output
            print(f"\n=== RAW LLM RESPONSE ===")
            print(f"Response text: '{response_text}'")
            print(f"Response type: {type(response_text)}")
            print(f"Response length: {len(response_text) if response_text else 0}")
            print(f"========================\n")

            demographics = parse_demographics_response(response_text)

            if demographics:
                return demographics
            else:
                print(f"Attempt {attempt + 1}/{max_retries}: Invalid response format")

        except Exception as e:
            print(f"Attempt {attempt + 1}/{max_retries}: API error - {e}")

            # Exponential backoff
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # 5s, 10s, 20s
                print(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)

    print(f"Failed to fetch demographics after {max_retries} attempts")
    return None
