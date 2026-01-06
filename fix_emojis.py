import re

file_path = '/Users/elonhsiao/.gemini/antigravity/scratch/Inasmuch/src/components/AdminPanel.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements (using the character U+FFFD which shows as )
replacements = {
    "'\ufffd': \['soap',": "'🧼': ['soap',",
    "'\ufffd': \['laundry',": "'🧺': ['laundry',",
    "'\ufffd': \['bar soap',": "'🧴': ['bar soap',",
    "'\ufffd': \['can',": "'🥫': ['can',",
    "'\ufffd\ud83e\uddc2'": "'🧂'",  # 🧂 fix
    "'\ufffd': \['razor',": "'🪒': ['razor',",
    "'\ufffd': \['nail', 'polish'": "'💅': ['nail', 'polish'",
    "'\ufffd\ufe0f': \['pen',": "'🖊️': ['pen',",
    "'\ufffd': \['clip',": "'📎': ['clip',",
    "'\ufffd': \['wrench',": "'🔧': ['wrench',",
}

for pattern, replacement in replacements.items():
    content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fix completed.")
