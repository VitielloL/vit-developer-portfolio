# Portfólio de Repositórios GitHub

Página estática que exibe automaticamente os repositórios do GitHub em formato de portfólio.

Os dados dos repositórios são gerados previamente por um script Python e salvos localmente em JSON, evitando expor tokens do GitHub no front-end.

---

# Tecnologias

- HTML
- CSS
- JavaScript
- Python
- GitHub REST API

---

# Estrutura do projeto

```text
assets/
  data/
    repos.json
  previews/

scripts/
  git-vit.py

index.html
script.js
styles.css
```

---

# Como usar

## 1. Instale as dependências Python

```bash
pip install requests
```

---

## 2. Gere o arquivo dos repositórios

Entre na pasta `scripts` e execute:

```bash
python git-vit.py
```

O script irá gerar automaticamente:

```text
assets/data/repos.json
```

---

## 3. Abra o projeto

Você pode:

- abrir o `index.html` diretamente no navegador
- ou usar um servidor local

Exemplo com VSCode Live Server.

---

# Como atualizar os projetos

Sempre que criar ou atualizar repositórios no GitHub:

```bash
python git-vit.py
```

Isso atualizará automaticamente o `repos.json`.

---

# Screenshots personalizados

Você pode adicionar previews manuais dos projetos em:

```text
assets/previews/
```

O nome da imagem deve seguir o nome do repositório.

Exemplo:

```text
assets/previews/meu-projeto.png
assets/previews/api-dotnet.png
```

Formatos recomendados:

- 1200x675
- 1600x900
- proporção 16:9

---

# Segurança

O projeto não utiliza tokens GitHub no front-end.

Os dados são gerados localmente via Python e exportados para JSON antes do deploy.

Isso evita:

- exposição de tokens
- problemas de rate limit da API
- vazamento de credenciais no navegador

---

# Deploy

O projeto pode ser hospedado facilmente em:

- Vercel
- Netlify
- GitHub Pages

Como é um projeto totalmente estático, não necessita backend.

---

# Autor

Desenvolvido por Vitiello.