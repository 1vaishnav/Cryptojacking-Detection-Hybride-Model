# server/web_model_api.py
from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model = joblib.load("cryptojacking_detector_7feat.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    df = pd.DataFrame([data])
    pred = model.predict(df)[0]
    return jsonify({"prediction": "crypto" if pred == 1 else "benign"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
