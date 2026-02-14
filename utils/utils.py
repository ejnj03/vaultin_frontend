
import pandas as pd

def clean_data(): 
    filepath = './utils/data/accounts.csv'
    with open(filepath, 'r') as f:
        content = f.read()  # Read as single string, not list

    print("Before:")
    print(content.split('\n')[894])
    print(content.split('\n')[35034])

    updated_filepath = './utils/data/accounts_cleaned.csv'

    content = content.replace(',null\n', ',\n')
    content = content.replace('\\"', '')

    print("\nAfter:")
    print(content.split('\n')[894])
    print(content.split('\n')[35034])

    with open(updated_filepath, 'w') as f:  # Fixed typo
        f.write(content)

    df = pd.read_csv(updated_filepath)

    unique_filepath = './utils/data/accounts_unique.csv'

    # Remove rows with null addresses
    df = df[df['nameTag'].notna()]

    # Optional: Remove blocked addresses
    df = df[df['label'] != 'blocked']

    # Remove duplicates based on first column (address)
    df = df.drop_duplicates(keep='first')

    df.to_csv(unique_filepath, index=True, index_label='id')

    original_length = len(pd.read_csv(updated_filepath))
    print(f"Removed {original_length - len(df)} from {original_length}")


def analyze_data():
    df = pd.read_csv('./utils/data/accounts_unique.csv')
    #df = df[df['chainId'] == 1]
    print(len(df))
    print(df['label'].nunique())
    # Count occurrences of each label
    print(df['label'].value_counts())

    #write all labels to all_labels.txt
    labels = df['label'].unique().tolist()
    with open('./utils/data/all_labels.txt', 'w') as f:
        for label in sorted(labels):
            f.write(f"{label}\n")
        f.close()

def explore_categories(csv_file):
    df = pd.read_csv(csv_file)
    categories = df['category'].unique().tolist()
    print(len(categories))
    print(categories)

    for category in categories:
        print(category)
        category_df = df[df['category']==category]
        subcategories = category_df['subcategory'].unique().tolist()

        print("subcategories: ", subcategories)

        for subcategory in subcategories:
            subcategory_df = category_df[category_df['subcategory'] == subcategory]
            print(f"number of items in {subcategory}: {len(subcategory_df)}")

explore_categories('./utils/data/categorized_labels_v2.csv')