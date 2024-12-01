from flask import Flask, request, jsonify
from sklearn.preprocessing import LabelEncoder
import numpy as np
import os
from google.cloud import storage
from tensorflow.keras.models import load_model
from dotenv import load_dotenv
import logging

load_dotenv()

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

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
bucket_name = 'testing-api-442908'
budget_plan_model_path = 'budget_plan/saving_rate_recommendation_model.h5'
monthly_report_model_path = 'monthly_report/categorizing_financial_health_model.h5'
local_budget_plan_model = 'temp/budget_plan.h5'
local_monthly_report_model = 'temp/monthly_report.h5'

# Download Model from GCS to Local
load_model_from_gsc(bucket_name, budget_plan_model_path, local_budget_plan_model)
load_model_from_gsc(bucket_name, monthly_report_model_path, local_monthly_report_model)

# Load Model Machine Learning From Local Path
budget_plan_model = load_model(os.path.abspath(local_budget_plan_model))
monthly_report_model = load_model(os.path.abspath(local_monthly_report_model))

# Initialize Label Encoder for Province
label_encoder_province = LabelEncoder()
# Updated list of provinces for encoding, including all provinces in Indonesia
provinces = [
    'ACEH', 'SUMATERA UTARA', 'SUMATERA BARAT', 'RIAU', 'JAMBI', 'SUMATERA SELATAN', 'BENGKULU',
    'LAMPUNG', 'KEPULAUAN BANGKA BELITUNG', 'KEPULAUAN RIAU', 'DKI JAKARTA', 'JAWA BARAT',
    'JAWA TENGAH', 'DI YOGYAKARTA', 'JAWA TIMUR', 'BANTEN', 'BALI', 'NUSA TENGGARA BARAT',
    'NUSA TENGGARA TIMUR', 'KALIMANTAN BARAT', 'KALIMANTAN TENGAH', 'KALIMANTAN SELATAN',
    'KALIMANTAN TIMUR', 'KALIMANTAN UTARA', 'SULAWESI UTARA', 'SULAWESI TENGAH', 'SULAWESI SELATAN',
    'SULAWESI TENGGARA', 'GORONTALO', 'SULAWESI BARAT', 'MALUKU', 'MALUKU UTARA', 'PAPUA BARAT',
    'PAPUA', 'PAPUA TENGAH', 'PAPUA PEGUNUNGAN', 'PAPUA SELATAN'
]
label_encoder_province.fit(provinces)

@app.route('/budget_plan', methods=['POST'])
def budget_plan_prediction():
    try:
        data = request.json['inputData']
        logging.info(f"Received input data: {data}")

        required_fields = ['province', 'age', 'income', 'food_expenses', 'transportation_expenses', 'housing_cost', 'electricity_bill', 'water_bill', 'internet_bill', 'debt', 'savings']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Encode the province using LabelEncoder
        province_encoded = label_encoder_province.transform([data['province']])[0]

        # Prepare the input data
        input_data = np.array([[
            province_encoded, data['age'], data['income'], data['food_expenses'],
            data['transportation_expenses'], data['housing_cost'], data['electricity_bill'],
            data['water_bill'], data['internet_bill'], data['debt'], data['savings']
        ]])

        # Make the prediction using the model
        prediction = budget_plan_model.predict(input_data)
        predicted_r_saving_rate = prediction[0][0]
        savings_rate = predicted_r_saving_rate / data['income'] * 100

        return jsonify({
            'savings_rate': f"{savings_rate:.2f}"
        })
    except Exception as e:
        logging.error(f"Error in budget_plan_prediction: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to predict budget plan', 'message': str(e)}), 500

@app.route('/monthly_report', methods=['POST'])
def monthly_report_prediction():
    try:
        data = request.json['inputData']

        required_fields = ['province', 'age', 'income', 'food_expenses', 'transportation_expenses', 'housing_cost', 'electricity_bill', 'water_bill', 'internet_bill', 'debt', 'savings']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")

        # Encode the province using LabelEncoder
        province_encoded = label_encoder_province.transform([data['province']])[0]

        # Prepare the input data
        input_data = np.array([[
            province_encoded, data['age'], data['income'], data['food_expenses'],
            data['transportation_expenses'], data['housing_cost'], data['electricity_bill'],
            data['water_bill'], data['internet_bill'], data['debt'], data['savings']
        ]])

        # Make the prediction using the model
        predictions = monthly_report_model.predict(input_data)
        predictions_class = np.argmax(predictions, axis=1)
        class_label = ["sehat", "kurang sehat", "buruk"]
        result = str(class_label[predictions_class[0]])

        return jsonify({
            "finance_report": result
        })
    except Exception as e:
        logging.error(f"Error in monthly_report_prediction: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to predict monthly report', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
