from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import os
from google.cloud import storage
from tensorflow.keras.models import load_model
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def load_model_from_gsc(bucket_name, model_path, local_model_path):
    service_account = {
        "type": "service_account",
        "project_id": os.getenv("GOOGLE_CLOUD_PROJECT_ID"),
        "private_key_id": os.getenv("GOOGLE_CLOUD_PRIVATE_KEY_ID"),
        "private_key": os.getenv("GOOGLE_CLOUD_PRIVATE_KEY").replace('\\n', '\n'),
        "client_email": os.getenv("GOOGLE_CLOUD_CLIENT_EMAIL"),
        "client_id": os.getenv("GOOGLE_CLOUD_CLIENT_ID"),
        "auth_uri": os.getenv("GOOGLE_CLOUD_AUTH_URI"),
        "token_uri": os.getenv("GOOGLE_CLOUD_TOKEN_URI"),
        "auth_provider_x509_cert_url": os.getenv("GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL"),
        "client_x509_cert_url": os.getenv("GOOGLE_CLOUD_CLIENT_X509_CERT_URL")
    }
    client = storage.Client.from_service_account_info(service_account)
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(model_path)
    blob.download_to_filename(local_model_path)

# Initialize Google Cloud Storage Bucket and Model Path
# TODO Insert Bucket Name
bucket_name = 'testing-api-442908'

# TODO Insert Model Path
budget_plan_model = 'budget_plan/financial_recommendation_model.h5'
monthly_report_model = 'monthly_report/categorizing_financial_health_model.h5'
# TODO: Re-Insert On Google Cloud Editor Path
local_budget_plan_model = 'temp/budget_plan.h5'
local_monthly_report_model = 'temp/monthly_report.h5'

# Download Model from GCS to Local
load_model_from_gsc(bucket_name, budget_plan_model, local_budget_plan_model)
load_model_from_gsc(bucket_name, monthly_report_model, local_monthly_report_model)

# Load Model Machine Learning Form Local Path
budget_plan = load_model(os.path.abspath(local_budget_plan_model))
monthly_report = load_model(os.path.abspath(local_monthly_report_model))

# Budget Planing request Handler
@app.route('/budget_plan', methods=['POST'])
def budget_planing_prediction():
    data = request.json['inputData']
    input_data = np.array([[
        data['age'], data['province'], data['income'],
        data['transportation'], data['housing_cost'], data['electricity_bill'],
        data['water_bill'], data['internet_bill'], data['debt']
    ]])
    prediction = budget_plan.predict(input_data)
    result = {
        "food_expense": prediction[0][0],
        "transportation": prediction[0][1],
        "electricity_bill": prediction[0][2],
        "water_bill": prediction[0][3],
        "housing_cost": prediction[0][4],
        "internet": prediction[0][5],
        "debt": prediction[0][6],
        "savings": prediction[0][7],
    }
    return jsonify({
        'recomendation': result
    })

# Handler Monthly Report Handler
@app.route('/monthly_report', methods=['POST'])
def monthly_report_prediction():
    data = request.json['inputData']
    input_data = np.array([[
        data['age'], data['income'], 
        data['food_expenses'], data['transport_expenses'],
        data['housing_cost'], data['water_bill'],
        data['electricity_bill'], data['internet_cost'],
        data['debt'], data['savings']
    ]])
    
    predictions = monthly_report.predict(input_data, verbose=0)
    predictions_class = np.argmax(predictions, axis=1)
    class_label = ["sehat", "kurang sehat", "buruk"]
    result = str(class_label[predictions_class[0]])
    
    return jsonify({
        "finance_report": result
    })
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)