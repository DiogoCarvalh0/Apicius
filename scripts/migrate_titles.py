import json
import os

recipes_file = 'database/recipes.json'

if not os.path.exists(recipes_file):
    print(f"Error: {recipes_file} not found")
    exit(1)

with open(recipes_file, 'r', encoding='utf-8') as f:
    recipes = json.load(f)

modified_count = 0
for recipe in recipes:
    if 'translations' in recipe:
        for lang in recipe['translations']:
            if 'title' in recipe['translations'][lang]:
                del recipe['translations'][lang]['title']
                modified_count += 1

if modified_count > 0:
    with open(recipes_file, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, indent=2, ensure_ascii=False)
    print(f"Migration complete. Removed titles from {modified_count} translations.")
else:
    print("No translated titles found to remove.")
