"""
Examine the 2021 election results Excel file
"""
import pandas as pd

# Read the Excel file
df = pd.read_excel('data/10- Detailed Results_2021.xlsx')

print('=' * 80)
print('FILE STRUCTURE')
print('=' * 80)
print(f'Total Rows: {len(df)}')
print(f'Total Columns: {len(df.columns)}')

print('\n' + '=' * 80)
print('COLUMN NAMES')
print('=' * 80)
for i, col in enumerate(df.columns, 1):
    print(f'{i:2d}. {col}')

print('\n' + '=' * 80)
print('DATA TYPES')
print('=' * 80)
print(df.dtypes)

print('\n' + '=' * 80)
print('FIRST 5 ROWS')
print('=' * 80)
print(df.head(5).to_string())

print('\n' + '=' * 80)
print('LAST 5 ROWS')
print('=' * 80)
print(df.tail(5).to_string())

print('\n' + '=' * 80)
print('NULL VALUES COUNT')
print('=' * 80)
print(df.isnull().sum())

print('\n' + '=' * 80)
print('SAMPLE DATA (Random 5 rows)')
print('=' * 80)
print(df.sample(5).to_string())

print('\n' + '=' * 80)
print('UNIQUE VALUES IN KEY COLUMNS')
print('=' * 80)
# Try to identify key columns
for col in df.columns:
    if df[col].nunique() < 50:  # Show only columns with less than 50 unique values
        print(f'\n{col}: {df[col].nunique()} unique values')
        print(df[col].value_counts().head(10))
