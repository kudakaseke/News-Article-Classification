import json
import os
from pathlib import Path
import numpy as np
import pandas as pd
import nbformat
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from sklearn.metrics import accuracy_score

os.chdir(Path(__file__).resolve().parent.parent)
Path('.runtime').mkdir(exist_ok=True)
n = nbformat.read('Zim_News_Classification.ipynb', as_version=4)
scope = {}
exec(next(c.source for c in n.cells if c.cell_type == 'code' and 'from sklearn.pipeline import make_pipeline' in c.source), scope)
scope['df'] = pd.read_csv('news_dataset.csv').dropna().drop_duplicates('article').reset_index(drop=True)
exec(next(c.source for c in n.cells if c.cell_type == 'code' and 'model = make_pipeline(' in c.source), scope)
model = scope['model']
vectorizer, classifier = model[0], model[1]
out = Path('frontend/dist')
out.mkdir(parents=True, exist_ok=True)
accuracy = accuracy_score(scope['y_test'], model.predict(scope['X_test']))
metadata = {
    'version': 1, 'name': 'Zimbabwe News Classifier', 'classes': model.classes_.tolist(),
    'features': len(vectorizer.vocabulary_), 'vocabulary': {word: int(index) for word, index in vectorizer.vocabulary_.items()},
    'stopWords': sorted(ENGLISH_STOP_WORDS), 'maxWords': 1000, 'articles': len(scope['df']),
    'accuracy': accuracy, 'trainingArticles': len(scope['X_train']), 'testArticles': len(scope['X_test']),
    'categoryCounts': {label: int(count) for label, count in scope['df']['category'].value_counts().items()},
    'trainedOn': '2026-10-16', 'labelSource': 'Unreviewed publisher categories',
}
(out / 'model.json').write_text(json.dumps(metadata, separators=(',', ':')), encoding='utf-8')
weights = np.concatenate([vectorizer.idf_, classifier.coef_.ravel(), classifier.intercept_]).astype('<f4')
weights.tofile(out / 'weights.bin')
examples = [
    'Zimbabwe elections: ZANU PF and opposition parties campaign for parliamentary seats',
    'Jah Prayzah and Winky D perform music at a concert in Harare',
    'Zimbabwe businesses report inflation and exchange rate pressure on company profits',
    'Zimbabwe mobile networks expand internet broadband and digital telecommunications services',
    'Zimbabwe hospitals improve HIV treatment and healthcare services for patients',
    'Zimbabwe farmers increase maize crop production through irrigation and fertiliser',
    'Econet AI\nEconet Wireless Zimbabwe launched an artificial intelligence platform.',
    'HIV cases increase\nZimbabwe clinics offer HIV testing, prevention and treatment.',
    'Maize yields rise 25% — Harare farmers\u2019 irrigation costs: US$2,500.',
    'Internet\taccess\n\nNETONE: new network, digital and mobile broadband.',
] + scope['X_test'].iloc[:20].tolist()
fixtures = [{'text': text, 'scores': model.predict_proba([scope['short_text'](text)])[0].tolist()} for text in examples]
Path('.runtime/web_model_parity.json').write_text(json.dumps({'classes': model.classes_.tolist(), 'fixtures': fixtures}), encoding='utf-8')
print(f'Exported {metadata["features"]:,} features, {len(metadata["classes"])} classes; accuracy {accuracy:.2%}.', flush=True)
print(f'Browser assets: {(out/"model.json").stat().st_size + (out/"weights.bin").stat().st_size:,} bytes.', flush=True)
