import {NewsClassifier} from './model.js';

const categories = {
  POLITICS: {name: 'Politics', icon: 'politics', color: '#6d7050', soft: '#f0f0e4', description: 'Government, elections and public affairs.', headline: 'Zimbabwe parties prepare for parliamentary elections', article: 'Political parties in Zimbabwe are preparing their election campaigns. Candidates are discussing parliamentary representation, voter registration and government policy. The opposition and ZANU PF are expected to outline their priorities to voters.'},
  ENTERTAINMENT: {name: 'Entertainment', icon: 'music', color: '#997060', soft: '#f7ede7', description: 'Music, film, the arts and culture.', headline: 'Zimbabwean musicians bring a new sound to the stage', article: 'Music fans in Harare are looking forward to a concert featuring Jah Prayzah and Winky D. The artists will perform their songs alongside other Zimbabwean musicians, with the show celebrating local music and entertainment.'},
  BUSINESS: {name: 'Business', icon: 'business', color: '#956f39', soft: '#f8f1df', description: 'Markets, companies and the economy.', headline: 'Zimbabwe businesses weigh exchange rate pressures', article: 'Zimbabwean companies are reviewing their financial results as inflation and exchange rate changes affect business costs. Retailers say rising expenses are putting pressure on company profits, while investors continue to monitor the economy and currency markets.'},
  TECH: {name: 'Tech', icon: 'tech', color: '#597d78', soft: '#eaf3f0', description: 'Digital life, connectivity and innovation.', headline: 'Zimbabwe expands mobile broadband access', article: 'Mobile network operators in Zimbabwe are expanding internet broadband coverage. New telecommunications infrastructure will improve digital services, connectivity and access to mobile technology. Network engineers are working on faster connections for customers.'},
  HEALTH: {name: 'Health', icon: 'health', color: '#8a6d7e', soft: '#f4ecf1', description: 'Healthcare, wellbeing and medical news.', headline: 'Zimbabwe clinics strengthen HIV treatment services', article: 'Doctors and nurses at Zimbabwean hospitals and clinics are working to improve HIV treatment and prevention. Healthcare teams are providing testing, medicines and counselling for patients, with a focus on access to essential health services.'},
  AGRICULTURE: {name: 'Agriculture', icon: 'leaf', color: '#6d8550', soft: '#eef3df', description: 'Farming, crops and life on the land.', headline: 'Farmers prepare for the maize planting season', article: 'Zimbabwean farmers are preparing their fields for maize planting. Agricultural extension officers are advising growers on seed selection, fertiliser and irrigation. Farmers hope better crop management will improve harvest yields and food production.'},
};
const order = ['POLITICS', 'ENTERTAINMENT', 'BUSINESS', 'TECH', 'HEALTH', 'AGRICULTURE'];
const $ = id => document.getElementById(id);
let classifier;
let currentResult;
let currentInput;
let history = [];
let toastTimer;

function icon(name) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  element.setAttribute('class', 'icon');
  element.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#i-' + name);
  element.append(use);
  return element;
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => {$('toast').hidden = true;}, 4000);
}

function updateCounts() {
  const words = $('article').value.trim().split(/\s+/u).filter(Boolean).length;
  $('word-count').textContent = words.toLocaleString() + (words === 1 ? ' word' : ' words');
  $('character-count').textContent = $('article').value.length.toLocaleString() + ' / 50,000 characters';
  $('form-error').hidden = true;
  if (currentResult && ($('headline').value !== currentInput.headline || $('article').value !== currentInput.article)) {
    $('result-state').textContent = 'TEXT EDITED · CLASSIFY AGAIN';
  } else if (currentResult) {
    $('result-state').textContent = 'CLASSIFICATION COMPLETE';
  }
}

function showError(message) {
  $('form-error').textContent = message;
  $('form-error').hidden = false;
}

function renderResult(result, input) {
  currentResult = result;
  currentInput = {...input};
  const category = categories[result.category];
  const panel = $('result-content');
  panel.style.setProperty('--category-color', category.color);
  panel.style.setProperty('--category-soft', category.soft);
  $('empty-result').hidden = true;
  panel.hidden = false;
  panel.classList.remove('is-updated');
  $('result-state').textContent = 'CLASSIFICATION COMPLETE';
  $('category-symbol').replaceChildren(icon(category.icon));
  $('predicted-category').textContent = category.name;
  $('category-description').textContent = category.description;
  const percent = result.scores[0].score * 100;
  $('top-score').replaceChildren(document.createTextNode(percent.toFixed(1)), Object.assign(document.createElement('span'), {textContent: '%'}));
  requestAnimationFrame(() => {$('ring-value').style.strokeDashoffset = 270.177 * (1 - result.scores[0].score);});
  $('score-bars').replaceChildren();
  for (const score of result.scores) {
    const row = document.createElement('div');
    row.className = 'score-row';
    const top = document.createElement('div');
    top.className = 'score-row-top';
    const label = document.createElement('span');
    label.textContent = categories[score.category].name;
    const value = document.createElement('span');
    value.textContent = (score.score * 100).toFixed(1) + '%';
    top.append(label, value);
    const track = document.createElement('div');
    track.className = 'bar-track';
    track.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    fill.style.width = (score.score * 100) + '%';
    track.append(fill);
    row.append(top, track);
    $('score-bars').append(row);
  }
  $('processed-words').textContent = result.totalWords > 1000 ? 'First 1,000 of ' + result.totalWords.toLocaleString() + ' words used' : result.wordsUsed.toLocaleString() + ' words considered';
}

function renderHistory() {
  $('recent-section').hidden = !history.length;
  $('recent-list').replaceChildren();
  for (const entry of history.slice(0, 3)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recent-item';
    const category = document.createElement('span');
    category.append(icon(categories[entry.result.category].icon), document.createTextNode(categories[entry.result.category].name));
    const headline = document.createElement('strong');
    headline.textContent = entry.input.headline || entry.input.article.slice(0, 80);
    const detail = document.createElement('small');
    detail.textContent = entry.result.wordsUsed.toLocaleString() + ' words · ' + entry.time.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    button.append(category, headline, detail);
    button.addEventListener('click', () => {
      $('headline').value = entry.input.headline;
      $('article').value = entry.input.article;
      renderResult(entry.result, entry.input);
      updateCounts();
      $('result-title').scrollIntoView({behavior: 'smooth', block: 'center'});
    });
    $('recent-list').append(button);
  }
}

async function classify(event) {
  event?.preventDefault();
  if (!classifier) return showError('The classifier is still preparing. Please try again in a moment.');
  $('form-error').hidden = true;
  $('classify-button').disabled = true;
  $('classify-button-label').textContent = 'Reading your story…';
  const input = {headline: $('headline').value, article: $('article').value};
  try {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const result = classifier.classify(input.headline, input.article);
    renderResult(result, input);
    history = [{input, result, time: new Date()}, ...history.filter(item => item.input.headline !== input.headline || item.input.article !== input.article)].slice(0, 5);
    renderHistory();
    if (window.matchMedia('(max-width: 1000px)').matches) $('result-title').scrollIntoView({behavior: 'smooth', block: 'start'});
  } catch (error) {
    showError(error.message);
    if (!$('headline').value.trim()) $('article').focus();
  } finally {
    $('classify-button').disabled = false;
    $('classify-button-label').textContent = 'Classify article';
  }
}

function useSample(key) {
  const sample = categories[key];
  $('headline').value = sample.headline;
  $('article').value = sample.article;
  updateCounts();
  if (location.hash !== '#workspace') location.hash = '#workspace';
  $('headline').focus({preventScroll: true});
  toast('Illustrative sample added. Select “Classify article” to try it.');
}

function renderCategories() {
  $('category-grid').replaceChildren();
  for (const key of order) {
    const category = categories[key];
    const card = document.createElement('article');
    card.className = 'card category-card';
    card.style.setProperty('--category-color', category.color);
    card.style.setProperty('--category-soft', category.soft);
    const symbol = document.createElement('div');
    symbol.className = 'category-symbol';
    symbol.append(icon(category.icon));
    const heading = document.createElement('h2');
    heading.textContent = category.name;
    const description = document.createElement('p');
    description.textContent = category.description;
    const footer = document.createElement('div');
    footer.className = 'category-card-footer';
    const count = document.createElement('span');
    count.textContent = classifier ? classifier.metadata.categoryCounts[key].toLocaleString() + ' articles' : 'Zimbabwe-related stories';
    const button = document.createElement('button');
    button.type = 'button';
    button.append(document.createTextNode('Try a sample'), icon('arrow'));
    button.addEventListener('click', () => useSample(key));
    footer.append(count, button);
    card.append(symbol, heading, description, footer);
    $('category-grid').append(card);
  }
}

function navigate() {
  const requested = location.hash.replace('#', '') || 'workspace';
  const view = ['workspace', 'categories', 'about'].includes(requested) ? requested : 'workspace';
  for (const item of ['workspace', 'categories', 'about']) $('view-' + item).hidden = item !== view;
  for (const link of document.querySelectorAll('[data-view]')) {
    const active = link.dataset.view === view;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  $('breadcrumb-current').textContent = {workspace: 'Classifier', categories: 'Categories', about: 'About the model'}[view];
  $('sidebar').classList.remove('open');
  $('menu-button').setAttribute('aria-expanded', 'false');
  window.scrollTo({top: 0});
}

async function loadModel() {
  $('model-status').classList.remove('failed');
  $('model-status').hidden = true;
  $('model-status').replaceChildren();
  $('classify-button').disabled = true;
  $('classify-button-label').textContent = 'Preparing classifier…';
  try {
    classifier = await NewsClassifier.load();
    $('classify-button').disabled = false;
    $('classify-button-label').textContent = 'Classify article';
    document.querySelectorAll('[data-article-count]').forEach(el => {el.textContent = classifier.metadata.articles.toLocaleString();});
    $('accuracy-stat').textContent = (classifier.metadata.accuracy * 100).toFixed(2) + '%';
    renderCategories();
  } catch (error) {
    $('model-status').hidden = false;
    $('model-status').classList.add('failed');
    $('model-status').innerHTML = '<span class="status-dot"></span><span>Model unavailable</span><button type="button" id="retry-model">Retry</button>';
    $('retry-model').addEventListener('click', loadModel);
    $('classify-button-label').textContent = 'Classifier unavailable';
    showError(error.message);
  }
}

$('classify-form').addEventListener('submit', classify);
for (const field of ['headline', 'article']) $(field).addEventListener('input', updateCounts);
$('headline').addEventListener('keydown', event => {if (event.key === 'Enter') classify(event);});
$('article').addEventListener('keydown', event => {if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') classify(event);});
$('clear-button').addEventListener('click', () => {
  $('headline').value = '';
  $('article').value = '';
  currentResult = null;
  currentInput = null;
  $('result-content').hidden = true;
  $('empty-result').hidden = false;
  $('result-state').textContent = 'AWAITING A STORY';
  updateCounts();
  $('headline').focus();
});
$('paste-button').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.readText) throw new Error('Clipboard unavailable');
    const text = await navigator.clipboard.readText();
    if (text.length > 50000) throw new Error('Too long');
    $('article').value = text;
    updateCounts();
    $('article').focus();
    toast('Text pasted into your article.');
  } catch (error) {
    if (error.message === 'Too long') return showError('Please keep your article under 50,000 characters.');
    $('article').focus();
    toast('Click the article field and use Ctrl+V or your device’s Paste command.');
  }
});
$('upload-button').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (!/\.(txt|md)$/i.test(file.name)) throw new Error('Choose a .txt or .md text file.');
    if (file.size > 1000000) throw new Error('Choose a text file smaller than 1 MB.');
    const text = await file.text();
    if (text.length > 50000) throw new Error('Please keep your article under 50,000 characters.');
    $('article').value = text;
    updateCounts();
    toast('Article loaded from ' + file.name);
  } catch (error) {showError(error.message);}
  event.target.value = '';
});
$('download-button').addEventListener('click', () => {
  if (!currentResult) return;
  const body = ['ZIM NEWS STUDIO', currentInput.headline || 'Article classification', '', 'Category: ' + categories[currentResult.category].name, ...currentResult.scores.map(s => categories[s.category].name + ': ' + (s.score * 100).toFixed(2) + '%'), '', 'Model scores are not verified confidence.', '', 'Article:', currentInput.article].join('\n');
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([body], {type: 'text/plain;charset=utf-8'}));
  link.href = url;
  link.download = 'zim-news-' + currentResult.category.toLowerCase() + '.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('Classification saved as a text file.');
});
$('menu-button').addEventListener('click', () => {
  const open = $('sidebar').classList.toggle('open');
  $('menu-button').setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  if (!$('sidebar').contains(event.target) && !$('menu-button').contains(event.target)) {
    $('sidebar').classList.remove('open');
    $('menu-button').setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    $('sidebar').classList.remove('open');
    $('menu-button').setAttribute('aria-expanded', 'false');
  }
});
for (const key of order) {
  const category = categories[key];
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sample-button';
  button.append(icon(category.icon), document.createTextNode(category.name));
  const plus = document.createElement('span');
  plus.className = 'plus';
  plus.textContent = '+';
  plus.setAttribute('aria-hidden', 'true');
  button.append(plus);
  button.addEventListener('click', () => useSample(key));
  $('sample-buttons').append(button);
}
window.addEventListener('hashchange', navigate);
// Use actual line breaks in the placeholder, rather than visible escape sequences.
$('article').placeholder = $('article').placeholder.replaceAll('\\n', '\n');
navigate();
renderCategories();
loadModel();
