import json
import requests
from pathlib import Path

USERNAME = "VitielloL"

# OPCIONAL
GITHUB_TOKEN = ""

OUTPUT = Path("../assets/data/repos.json")

headers = {
    "Accept": "application/vnd.github+json"
}

if GITHUB_TOKEN:
    headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

url = f"https://api.github.com/users/{USERNAME}/repos?per_page=100&sort=created"

response = requests.get(url, headers=headers)

if response.status_code != 200:
    print("Erro:", response.status_code)
    print(response.text)
    exit()

repos = response.json()

hidden_names = {
    "vitiellol",
    "vitielloporfolio"
}

final_repos = []

for repo in repos:
    normalized = repo["name"].lower().replace("-", "").replace("_", "")

    if normalized in hidden_names:
        continue

    final_repos.append({
        "name": repo["name"],
        "description": repo["description"],
        "language": repo["language"],
        "html_url": repo["html_url"],
        "homepage": repo["homepage"],
        "stargazers_count": repo["stargazers_count"],
        "updated_at": repo["updated_at"]
    })

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(final_repos, f, ensure_ascii=False, indent=2)

print(f"{len(final_repos)} repositórios salvos em:")
print(OUTPUT)