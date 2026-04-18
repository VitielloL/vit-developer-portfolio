const statusElement = document.getElementById('status');
const filterBarElement = document.getElementById('filter-bar');
const repoListElement = document.getElementById('repo-list');
const profileAvatar = document.getElementById('profile-avatar');
const githubLink = document.getElementById('github-link');

const config = window.PORTFOLIO_CONFIG || {};
const DEFAULT_GITHUB_USER = 'VitielloL';
const getUsername = () => config.githubUser?.trim() || DEFAULT_GITHUB_USER;
const getToken = () => config.githubToken?.trim() || '';
const selectedFilters = new Set();

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

const fetchRepoReadme = async (username, repoName) => {
  const url = `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/readme`;
  const response = await fetch(url, { headers: { ...getGitHubHeaders(), Accept: 'application/vnd.github.v3.raw' } });
  if (!response.ok) return '';
  return response.text();
};

const getPreviewFilename = repoName => `${repoName.toLowerCase().replace(/[^a-z0-9-_]/g, '-')}.png`;

const detectFrameworkFromText = text => {
  const normalized = (text || '').toLowerCase();
  if (/laravel/.test(normalized)) return 'Laravel';
  if (/next(\.js)?|nextjs/.test(normalized)) return 'Next.js';
  if (/react|jsx|tsx/.test(normalized)) return 'React';
  if (/angular/.test(normalized)) return 'Angular';
  if (/\.net|dotnet|c#|csharp|asp\.net/.test(normalized)) return '.NET';
  if (/svelte/.test(normalized)) return 'Svelte';
  if (/vue/.test(normalized)) return 'Vue';
  return null;
};

const getFrameworkLabel = repo => {
  const value = `${repo.language || ''} ${repo.name || ''} ${repo.description || ''} ${repo.readme || ''}`;
  return detectFrameworkFromText(value);
};

const getRepoTags = repo => {
  const ignoredTags = new Set(['blade', 'shell', 'ejs', 'plpgsql']);
  const tags = new Set();
  const framework = getFrameworkLabel(repo);
  if (framework) tags.add(framework);

  const addTag = tag => {
    const normalized = (tag || '').trim();
    if (!normalized) return;
    if (ignoredTags.has(normalized.toLowerCase())) return;
    tags.add(normalized);
  };

  if (Array.isArray(repo.languages) && repo.languages.length) {
    repo.languages.forEach(addTag);
  } else if (repo.language?.trim()) {
    addTag(repo.language);
  }

  return [...tags];
};

const getAllTechTags = repos => {
  const tags = new Set();
  repos.forEach(repo => getRepoTags(repo).forEach(tag => tags.add(tag)));
  return [...tags].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
};

const renderFilterBar = tags => {
  if (!filterBarElement) return;

  filterBarElement.innerHTML = tags.map(tag => `
    <button type="button" class="meta-pill filter-pill${selectedFilters.has(tag) ? ' filter-pill--active' : ''}" data-filter="${tag}">${tag}</button>
  `).join('');

  filterBarElement.querySelectorAll('button[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      const tag = button.dataset.filter;
      if (selectedFilters.has(tag)) {
        selectedFilters.delete(tag);
      } else {
        selectedFilters.add(tag);
      }
      renderFilterBar(tags);
      updateRepoDisplay(window.loadedRepos || []);
    });
  });
};

const filterRepos = repos => {
  if (!selectedFilters.size) return repos;
  return repos.filter(repo => getRepoTags(repo).some(tag => selectedFilters.has(tag)));
};

const updateRepoDisplay = repos => {
  const filteredRepos = filterRepos(repos);
  repoListElement.innerHTML = filteredRepos.map(renderRepo).join('');

  if (!filteredRepos.length) {
    setStatus(selectedFilters.size ? 'Nenhum repositório corresponde aos filtros selecionados.' : 'Nenhum repositório encontrado para este usuário.');
    return;
  }

  setStatus(selectedFilters.size
    ? `Exibindo ${filteredRepos.length} de ${repos.length} repositório(s).`
    : `Exibindo ${repos.length} repositório(s).`
  );
};

const getPreviewIcon = repo => {
  const framework = getFrameworkLabel(repo);
  if (framework === 'Laravel') return '🎯';
  if (framework === 'Next.js') return '⏭️';
  if (framework === 'React') return '⚛️';
  if (framework === 'Angular') return '🌀';
  if (framework === '.NET') return '🟦';
  if (framework === 'Vue') return '🌀';
  if (framework === 'Svelte') return '🌀';

  const language = (repo.language || '').toLowerCase();
  const name = (repo.name || '').toLowerCase();
  const description = (repo.description || '').toLowerCase();

  if (/python/.test(language) || /python/.test(name)) return '🐍';
  if (/node|javascript|typescript/.test(language) || /node|js|typescript/.test(name)) return '📦';
  if (/html|css/.test(language) || /html|css/.test(name)) return '🌐';
  if (/api|backend|server/.test(description) || /api|server/.test(name)) return '🔌';
  if (/game|jogo|flappy|calc|calculator/.test(name)) return '🎮';
  if (/design|ui|ux/.test(description) || /design/.test(name)) return '🎨';
  return '📌';
};

const getPreviewLabel = repo => {
  return getFrameworkLabel(repo) || repo.language || (repo.homepage ? 'Web App' : 'Projeto');
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
  const repoTags = getRepoTags(repo);
  const languageLabels = repoTags.length
    ? repoTags.map(tag => `<span class="meta-pill">${tag}</span>`).join('')
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

  const queryParams = toQueryString({ per_page: 100, sort: 'created' });
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
      let readme = '';
      try {
        const languageResponse = await fetch(repo.languages_url, { headers: getGitHubHeaders() });
        const languages = await languageResponse.json();
        const sorted = Object.entries(languages)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 4)
          .map(([lang]) => lang);

        if (!getFrameworkLabel({ ...repo, languages: sorted })) {
          readme = await fetchRepoReadme(username, repo.name).catch(() => '');
        }

        return { ...repo, languages: sorted, readme };
      } catch (e) {
        console.error('Falha ao carregar linguagens para', repo.name, e);
        return { ...repo, languages: [], readme };
      }
    }));

    window.loadedRepos = reposWithLanguages;
    const allTags = getAllTechTags(reposWithLanguages);
    renderFilterBar(allTags);
    updateRepoDisplay(reposWithLanguages);
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Não foi possível carregar os repositórios. Verifique os dados e tente novamente.');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  setStatus('Carregando repositórios do GitHub...');
  loadRepos();
});
