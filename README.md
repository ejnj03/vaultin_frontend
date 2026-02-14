# Vault Token Manager Project

## Data
Prompt used for categorizing all_labels.txt (to categorized_labels.txt):

### Prompt Template

I have 500 crypto protocol/entity labels to categorize. Please output a CSV with columns: label, category, subcategory

Use ONLY these categories:
- DeFi (subcategories: DEX, Lending, Derivatives, Liquid Staking, Yield)
- NFT (subcategories: Marketplace, Collection, Gaming)
- Infrastructure (subcategories: Oracle, Bridge, L2)
- Entity (subcategories: CEX, Charity, DAO, Whale)
- Other

Here are the labels:
[paste your labels]

Format: label,category,subcategory
Example: uniswap,DeFi,DEX

