# Zim News Studio

Open `START_FRONTEND.cmd` in the parent project folder. It starts a local server and opens http://127.0.0.1:8765. Keep its terminal window open while using the app; press Ctrl+C to stop it. No package installation or Jupyter session is needed to use the saved front end.

The cream and forest-green interface includes separate headline and article fields, text-file uploads, six illustrative samples, category scores, downloadable results, category coverage and model information. Recent results live only in the tab's memory and disappear on reload. Article text is processed in the browser and is not sent to a prediction service.

`dist/` is the complete website. `model.json` contains the vocabulary and model metadata; `weights.bin` contains the exported numerical weights. The JavaScript classifier applies the same tokenisation, English stop words, TF-IDF word/word-pair features, normalisation and Logistic Regression calculation as the notebook. Thirty parity checks agreed with Python to within 0.000002 in every score. Desktop and mobile browser tests covered all six categories, validation, uploads, downloads, navigation and recent results.

The export uses the notebook's existing 80/20 training split and the same dataset snapshot. It is not automatically updated when you edit the CSV or retrain the notebook. To rebuild from the current notebook and dataset, run this command **from the parent project folder**:

```powershell
..\.venv\Scripts\python.exe frontend\export_model.py
```

Then reload the browser. Exporting trains the model again and takes roughly one to two minutes. The exporter does not change the dataset or notebook. If you created a local `.venv`, use `.\.venv\Scripts\python.exe` instead.

The model recognises six English news categories; it always chooses among those labels. Publisher labels remain unreviewed, and model scores are not verified confidence. The front end uses the first 1,000 words, like the notebook. The full source dataset and article bodies are not included in the website files.

A private Sites project has been registered, but publishing was blocked by automatic approval review because it would upload the model weights and derived vocabulary to an external repository. No completed upload or live deployment has been reported. Publication requires explicit user approval for that export; the local app is ready to use.
