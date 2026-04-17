const statusElement = document.getElementById('status');
const repoListElement = document.getElementById('repo-list');
const profileAvatar = document.getElementById('profile-avatar');
const githubLink = document.getElementById('github-link');

const config = window.PORTFOLIO_CONFIG || {};
const DEFAULT_GITHUB_USER = 'VitielloL';
const getUsername = () => config.githubUser?.trim() || DEFAULT_GITHUB_USER;
const getToken = () => config.githubToken?.trim() || '';

const PREVIEW_DIR = 'assets/previews';
const toQueryString = params => Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

const getGitHubHeaders = () => {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  const token = getToken();
  if (token) {
    const scheme = token.startsWith('github_pat_') ? 'Bearer' : 'token';
    headers.Authorization = `${scheme} ${token}`;
  }
  return headers;
};

const normalizeUrl = url => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};

const getPreviewFilename = repoName => `${repoName.toLowerCase().replace(/[^a-z0-9-_]/g, '-')}.png`;

const getPreviewIcon = repo => {
  const language = (repo.language || '').toLowerCase();
  const name = (repo.name || '').toLowerCase();
  const description = (repo.description || '').toLowerCase();

  if (/react|jsx|tsx/.test(language) || /react/.test(name) || /react/.test(description)) return '⚛️';
  if (/vue|svelte|angular/.test(language) || /vue|svelte|angular/.test(name)) return '🌀';
  if (/python/.test(language) || /python/.test(name)) return '🐍';
  if (/node|javascript|typescript/.test(language) || /node|js|typescript/.test(name)) return '📦';
  if (/html|css/.test(language) || /html|css/.test(name)) return '🌐';
  if (/api|backend|server/.test(description) || /api|server/.test(name)) return '🔌';
  if (/game|jogo|flappy|calc|calculator/.test(name)) return '🎮';
  if (/design|ui|ux/.test(description) || /design/.test(name)) return '🎨';
  return '📌';
};

const getPreviewLabel = repo => {
  if (repo.language) return repo.language;
  if (repo.homepage) return 'Web App';
  return 'Projeto';
};

const renderPreview = (repo, homepageUrl) => {
  const icon = getPreviewIcon(repo);
  const label = getPreviewLabel(repo);
  const previewFilename = getPreviewFilename(repo.name);
  const previewUrl = `${PREVIEW_DIR}/${previewFilename}`;
  const fallback = `
    <div class="preview-fallback">
      <div class="preview-icon">${icon}</div>
      <div class="preview-label">${label}</div>
    </div>
  `;
  const image = `
    <img class="preview-img" src="${previewUrl}" alt="Preview de ${repo.name}" loading="lazy"
      onload="this.closest('.repo-preview').querySelector('.preview-fallback').style.display='none';"
      onerror="this.style.display='none'; this.closest('.repo-preview').querySelector('.preview-fallback').style.display='flex';" />
  `;

  const previewContent = `
    ${image}
    ${fallback}
  `;

  return `
    <div class="repo-preview">
      ${homepageUrl ? `<a href="${homepageUrl}" target="_blank" rel="noreferrer">${previewContent}</a>` : previewContent}
    </div>
  `;
};

const renderRepo = repo => {
  const homepageUrl = normalizeUrl(repo.homepage);
  const homepage = homepageUrl ? `<a href="${homepageUrl}" target="_blank" rel="noreferrer">Link</a>` : '';
  const preview = renderPreview(repo, homepageUrl);
  const description = repo.description ? `<p class="repo-description">${repo.description}</p>` : '';
  const languageLabels = (repo.languages && repo.languages.length)
    ? repo.languages.map(lang => `<span class="meta-pill">${lang}</span>`).join('')
    : `<span class="meta-pill">${repo.language || 'Sem linguagem definida'}</span>`;

  return `
    <article class="repo-card">
      <div class="repo-header">
        <h2 class="repo-title"><a href="${repo.html_url}" target="_blank" rel="noreferrer">${repo.name}</a></h2>
        <div class="repo-links">
          <a href="${repo.html_url}" target="_blank" rel="noreferrer">GitHub</a>
          ${homepage}
        </div>
      </div>
      ${preview}
      ${description}
      <div class="repo-meta">
        <div class="repo-languages">${languageLabels}</div>
        <span class="meta-pill">★ ${repo.stargazers_count}</span>
        <span class="meta-pill">Atualizado em ${new Date(repo.updated_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </article>
  `;
};

const setStatus = text => {
  statusElement.textContent = text;
};

const fetchAuthenticatedUser = async () => {
  const url = 'https://api.github.com/user';
  const response = await fetch(url, { headers: getGitHubHeaders() });
  if (!response.ok) {
    throw new Error('Falha ao obter informações do usuário autenticado. Verifique seu token.');
  }
  return response.json();
};

const setProfileDisplay = username => {
  if (username) {
    profileAvatar.src = `https://github.com/${encodeURIComponent(username)}.png?size=200`;
    profileAvatar.hidden = false;
    githubLink.href = `https://github.com/${encodeURIComponent(username)}`;
    githubLink.hidden = false;
  } else {
    profileAvatar.hidden = true;
    githubLink.hidden = true;
  }
};

const loadRepos = async () => {
  const username = getUsername();
  const token = getToken();

  setStatus('Buscando repositórios...');
  repoListElement.innerHTML = '';

  setProfileDisplay(username);

  const queryParams = toQueryString({ per_page: 100, sort: 'updated' });
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?${queryParams}`;

  try {
    const response = await fetch(url, { headers: getGitHubHeaders() });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      if (response.status === 403 && body && body.message && body.message.toLowerCase().includes('rate limit')) {
        throw new Error('GitHub rate limit excedido. Use um token pessoal ou tente novamente mais tarde.');
      }
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }

    let repos = await response.json();
    if (!Array.isArray(repos) || repos.length === 0) {
      setStatus('Nenhum repositório encontrado para este usuário.');
      return;
    }

    const normalizeRepoName = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hiddenNames = new Set(['vitiellol', 'vitielloporfolio']);

    repos = repos.filter(repo => {
      const name = normalizeRepoName(repo.name || '');
      return !hiddenNames.has(name);
    });

    if (repos.length === 0) {
      setStatus('Nenhum repositório encontrado para este usuário.');
      return;
    }

    const reposWithLanguages = await Promise.all(repos.map(async repo => {
      try {
        const languageResponse = await fetch(repo.languages_url, { headers: getGitHubHeaders() });
        const languages = await languageResponse.json();
        const sorted = Object.entries(languages)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([lang]) => lang);
        return { ...repo, languages: sorted };
      } catch (e) {
        console.error('Falha ao carregar linguagens para', repo.name, e);
        return { ...repo, languages: [] };
      }
    }));

    repoListElement.innerHTML = reposWithLanguages.map(renderRepo).join('');
    setStatus(`Exibindo ${reposWithLanguages.length} repositório(s).`);
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Não foi possível carregar os repositórios. Verifique os dados e tente novamente.');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  setStatus('Carregando repositórios do GitHub...');
  loadRepos();
});
