"""
Examine the 2011 PDF structure to understand data format
"""
import pdfplumber

def examine_pdf():
    """Examine the 2011 election PDF structure"""

    pdf_path = 'data/2011.pdf'

    print("=" * 80)
    print("EXAMINING 2011 ELECTION PDF")
    print("=" * 80)

    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"\nTotal pages: {total_pages}")

        # Examine page 260 (index 259) where detailed results start
        print(f"\n{'=' * 80}")
        print(f"PAGE 260 - First page of detailed results")
        print(f"{'=' * 80}")

        page = pdf.pages[259]  # Page 260 (0-indexed)

        # Extract text
        text = page.extract_text()
        print("\nText content (first 1000 chars):")
        print(text[:1000] if text else "No text found")

        # Extract tables
        tables = page.extract_tables()
        print(f"\n\nNumber of tables found: {len(tables)}")

        if tables:
            for i, table in enumerate(tables):
                print(f"\n\nTable {i+1}:")
                print(f"Rows: {len(table)}")
                print(f"Columns: {len(table[0]) if table else 0}")

                # Show first few rows
                print("\nFirst 5 rows:")
                for j, row in enumerate(table[:5]):
                    print(f"  Row {j+1}: {row}")

        # Also check pages 260-262 to see the pattern
        print(f"\n\n{'=' * 80}")
        print(f"CHECKING PAGES 260-262 FOR PATTERNS")
        print(f"{'=' * 80}")

        for page_num in range(259, 262):  # Pages 260-262
            if page_num >= total_pages:
                break

            print(f"\n--- Page {page_num + 1} ---")
            page = pdf.pages[page_num]
            tables = page.extract_tables()

            if tables and len(tables) > 0:
                table = tables[0]
                print(f"Table found with {len(table)} rows, {len(table[0]) if table else 0} columns")

                # Show headers if present
                if len(table) > 0:
                    print(f"Headers: {table[0]}")

                # Show a sample data row
                if len(table) > 1:
                    print(f"Sample row: {table[1]}")

if __name__ == "__main__":
    examine_pdf()
