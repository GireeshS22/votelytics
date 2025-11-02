"""
Parse 2011 election data from PDF and convert to structured format
"""
import re
import pdfplumber
import pandas as pd

def parse_2011_pdf():
    """Parse the 2011 election PDF and extract data"""

    pdf_path = 'data/2011.pdf'
    print("=" * 80)
    print("PARSING 2011 ELECTION PDF")
    print("=" * 80)

    all_results = []
    current_constituency = None
    current_ac_number = None
    current_total_electors = None

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"\nTotal pages: {total_pages}")
        print("Starting from page 260...\n")

        # Start from page 260 (index 259)
        for page_num in range(259, total_pages):
            page = pdf.pages[page_num]
            text = page.extract_text()

            if not text:
                continue

            lines = text.split('\n')

            for line in lines:
                # Skip header lines
                if 'Election Commission of India' in line or 'DETAILED RESULTS' in line:
                    continue
                if 'CANDIDATE NAME SEX AGE CATEGORY PARTY' in line:
                    continue

                # Check for constituency header
                # Pattern: Constituency {NUMBER}. {NAME} TOTAL ELECTORS : {COUNT}
                constituency_match = re.match(
                    r'Constituency\s+(\d+)\.\s+(.+?)\s+TOTAL ELECTORS\s*:\s*(\d+)',
                    line
                )
                if constituency_match:
                    current_ac_number = int(constituency_match.group(1))
                    current_constituency = constituency_match.group(2).strip()
                    current_total_electors = int(constituency_match.group(3))
                    print(f"Processing: AC {current_ac_number} - {current_constituency}")
                    continue

                # Check for TURNOUT line (end of constituency)
                if 'TURNOUT TOTAL:' in line:
                    continue

                # Parse candidate row
                # Pattern: {RANK} {NAME} {SEX} {AGE} {CATEGORY} {PARTY} {GENERAL} {POSTAL} {TOTAL} {PERCENT}
                # The tricky part is the name can have multiple words
                # We need to work backwards from the numbers

                # Try to match candidate row
                # Numbers at the end: GENERAL POSTAL TOTAL PERCENT
                # Before that: PARTY (can be multi-word like "IND" or "AIADMK")
                # Before that: CATEGORY (SC, ST, GEN)
                # Before that: AGE (number)
                # Before that: SEX (M, F)
                # Before that: NAME (can be multiple words)
                # At start: RANK (number)

                # Let's use a regex that captures numbers at the end
                candidate_match = re.match(
                    r'^(\d+)\s+(.+?)\s+([MF])\s+(\d+)\s+(SC|ST|GEN)\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d.]+)\s*$',
                    line
                )

                if candidate_match and current_constituency:
                    rank = int(candidate_match.group(1))
                    name = candidate_match.group(2).strip()
                    sex = candidate_match.group(3)
                    age = int(candidate_match.group(4))
                    category = candidate_match.group(5)
                    party = candidate_match.group(6).strip()
                    general_votes = int(candidate_match.group(7))
                    postal_votes = int(candidate_match.group(8))
                    total_votes = int(candidate_match.group(9))
                    vote_share_pct = float(candidate_match.group(10))

                    result = {
                        'AC NO.': current_ac_number,
                        'AC NAME': current_constituency,
                        'TOTAL ELECTORS': current_total_electors,
                        'RANK': rank,
                        'CANDIDATE NAME': name,
                        'SEX': sex,
                        'AGE': age,
                        'CATEGORY': category,
                        'PARTY': party,
                        'GENERAL': general_votes,
                        'POSTAL': postal_votes,
                        'TOTAL': total_votes,
                        '% VOTES POLLED': vote_share_pct
                    }
                    all_results.append(result)

    print(f"\n{'=' * 80}")
    print(f"PARSING COMPLETE")
    print(f"{'=' * 80}")
    print(f"Total records parsed: {len(all_results)}")

    # Convert to DataFrame
    df = pd.DataFrame(all_results)

    if len(df) > 0:
        print(f"\nData summary:")
        print(f"  Constituencies: {df['AC NO.'].nunique()}")
        print(f"  Candidates: {len(df)}")
        print(f"  AC Numbers range: {df['AC NO.'].min()} to {df['AC NO.'].max()}")

        # Show sample
        print(f"\nSample data (first 5 rows):")
        print(df.head())

        # Save to CSV for verification
        output_file = 'data/2011_parsed_data.csv'
        df.to_csv(output_file, index=False)
        print(f"\n[SUCCESS] Data saved to: {output_file}")

        # Show some statistics
        print(f"\nConstituency breakdown:")
        constituency_counts = df.groupby('AC NAME').size().head(10)
        for const, count in constituency_counts.items():
            print(f"  {const}: {count} candidates")

        # Check for missing data
        print(f"\nData quality check:")
        print(f"  Null values:\n{df.isnull().sum()}")

    else:
        print("\n[WARNING] No data parsed!")

    return df

if __name__ == "__main__":
    parse_2011_pdf()
