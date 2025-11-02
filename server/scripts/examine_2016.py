"""
Examine 2016 election data structure
"""
import pandas as pd

# Read 2016 Excel file
df_2016 = pd.read_excel('data/2016 Detailed Results.xlsx')

print('=' * 80)
print('2016 FILE STRUCTURE')
print('=' * 80)
print(f'Total Rows: {len(df_2016)}')
print(f'Total Columns: {len(df_2016.columns)}')

print('\nColumn Names:')
for i, col in enumerate(df_2016.columns, 1):
    print(f'{i:2d}. {col}')

print('\nFirst 5 rows:')
print(df_2016.head(5).to_string())

print('\nData types:')
print(df_2016.dtypes)

print('\nNull values:')
print(df_2016.isnull().sum())

print('\n' + '=' * 80)
print('COMPARISON WITH 2021')
print('=' * 80)

# Read 2021 for comparison
df_2021 = pd.read_excel('data/10- Detailed Results_2021.xlsx')

print(f'\n2021 Columns: {len(df_2021.columns)}')
print(f'2016 Columns: {len(df_2016.columns)}')

print('\nColumn differences:')
cols_2021 = set(df_2021.columns)
cols_2016 = set(df_2016.columns)

only_2021 = cols_2021 - cols_2016
only_2016 = cols_2016 - cols_2021

if only_2021:
    print(f'\nOnly in 2021: {only_2021}')
if only_2016:
    print(f'\nOnly in 2016: {only_2016}')

common = cols_2021 & cols_2016
print(f'\nCommon columns: {len(common)}')
for col in sorted(common):
    print(f'  - {col}')
