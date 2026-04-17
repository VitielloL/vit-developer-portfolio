# Portfólio de Repositórios GitHub

Página estática que busca repositórios do GitHub e monta um portfólio automático com links, descrições e informações.

## Como usar

1. Abra `index.html` em um navegador ou rode um servidor estático local.
2. O usuário padrão é `VitielloL`.
3. Você pode alterar o nome do usuário e clicar em `Carregar repositórios`.
4. Se receber erro de limite de requisições, adicione um token pessoal do GitHub no campo `Token GitHub (opcional)` e recarregue.

## Configuração via arquivo externo

Você também pode usar `config.js` como um arquivo de configuração local semelhante a um `.env`. Crie ou edite `config.js` com:

```js
window.PORTFOLIO_CONFIG = {
  githubUser: 'seu-usuario',
  githubToken: 'seu-token-pessoal',
  instagramUrl: 'https://instagram.com/seuusuario',
};
```

O app usará esses valores se os campos na interface estiverem vazios.

> Não esqueça de manter `config.js` fora do controle de versão. Já incluí `.gitignore` para ignorá-lo.

## Usar imagens locais

Se você quiser fornecer screenshots manuais, coloque-as em `assets/previews` usando o nome do repositório em slug, por exemplo:

```text
assets/previews/delay-reverb-time-calculator.png
assets/previews/plantel-ragnarock.png
```

O aplicativo tentará carregar essas imagens automaticamente. Se a imagem não existir, ele exibirá um placeholder com ícone e descrição.

Recomendo uma resolução de aproximadamente `1200x675` ou `1600x900` (proporção 16:9). Isso encaixa bem no layout e reduz distorção ao escalar.

## Tecnologias

- HTML
- CSS
- JavaScript
- GitHub REST API

## Nota

A aplicação usa a API pública do GitHub. Se precisar de mais requisições, use um token pessoal do GitHub no campo `Token GitHub (opcional)`.

> Importante: nunca compartilhe um token pessoal em conversa pública ou em repositório. Se você já expôs um token, revogue-o e gere um novo em `GitHub -> Settings -> Developer settings -> Personal access tokens`.
