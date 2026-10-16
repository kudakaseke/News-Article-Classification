export class NewsClassifier {
  constructor(metadata, buffer) {
    this.metadata = metadata;
    this.stops = new Set(metadata.stopWords);
    this.vocabulary = metadata.vocabulary;
    const values = new Float32Array(buffer);
    const size = metadata.features;
    if (values.length !== size * (metadata.classes.length + 1) + metadata.classes.length) {
      throw new Error('The classifier files do not match. Please reload the page.');
    }
    this.idf = values.subarray(0, size);
    this.coefficients = values.subarray(size, size * (metadata.classes.length + 1));
    this.intercepts = values.subarray(size * (metadata.classes.length + 1));
  }

  static async load() {
    const [metadataResponse, weightsResponse] = await Promise.all([
      fetch(new URL('./model.json', import.meta.url)),
      fetch(new URL('./weights.bin', import.meta.url)),
    ]);
    if (!metadataResponse.ok || !weightsResponse.ok) throw new Error('The classifier could not load. Check your connection and try again.');
    return new NewsClassifier(await metadataResponse.json(), await weightsResponse.arrayBuffer());
  }

  classify(headline = '', article = '') {
    if (typeof headline !== 'string' || typeof article !== 'string') throw new Error('Please enter a headline or article as text.');
    const allWords = (headline + ' ' + article).trim().split(/\s+/u).filter(Boolean);
    if (!allWords.length) throw new Error('Add a headline or article first. A few meaningful sentences work best.');
    const text = allWords.slice(0, this.metadata.maxWords).join(' ').toLowerCase();
    const tokens = (text.match(/[\p{L}\p{N}_]+/gu) || []).filter(token => [...token].length >= 2 && !this.stops.has(token));
    const counts = new Map();
    const add = term => {
      const index = this.vocabulary[term];
      if (Object.hasOwn(this.vocabulary, term)) counts.set(index, (counts.get(index) || 0) + 1);
    };
    for (let i = 0; i < tokens.length; i++) {
      add(tokens[i]);
      if (i + 1 < tokens.length) add(tokens[i] + ' ' + tokens[i + 1]);
    }
    if (!counts.size) throw new Error('No recognised words yet. Try a fuller English headline or article.');
    let norm = 0;
    const features = [];
    for (const [index, count] of counts) {
      const value = (1 + Math.log(count)) * this.idf[index];
      features.push([index, value]);
      norm += value * value;
    }
    norm = Math.sqrt(norm);
    const logits = this.metadata.classes.map((category, row) => {
      let total = this.intercepts[row];
      const offset = row * this.metadata.features;
      for (const [index, value] of features) total += this.coefficients[offset + index] * value / norm;
      return total;
    });
    const max = Math.max(...logits);
    const exponents = logits.map(logit => Math.exp(logit - max));
    const sum = exponents.reduce((a, b) => a + b, 0);
    const scores = this.metadata.classes.map((category, i) => ({category, score: exponents[i] / sum})).sort((a, b) => b.score - a.score);
    return {category: scores[0].category, scores, wordsUsed: Math.min(allWords.length, this.metadata.maxWords), totalWords: allWords.length};
  }
}
