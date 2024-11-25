from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import os
from google.cloud import storage
from tensorflow.keras.models import load_model

app = Flask(__name__)

def load_model_from_gsc(bucket_name, model_path, local_model_path):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(model_path)
    blob.download_to_filename(local_model_path)

# Initialize Google Cloud Storage Bucket and Model Path
# TODO Insert Bucket Name
bucket_name = ''

# TODO Insert Model Path
budget_plan_model = ''
monthly_report_model = ''
# TODO: Re-Insert On Google Cloud Editor Path
local_budget_plan_model = './temp/budget_plan.h5'
local_monthly_report_model = './temp/monthly_report.h5'

# Download Model from GCS to Local
load_model_from_gsc(bucket_name, budget_plan_model, local_budget_plan_model)
load_model_from_gsc(bucket_name, monthly_report_model, local_monthly_report_model)

budget_plan = load_model(local_budget_plan_model)
monthly_report = load_model(local_monthly_report_model)

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
    input_data = np.array[[
        data['age'], data['income'], 
        data['food_expenses'], data['transport_expenses'],
        data['housing_cost'], data['water_bill'],
        data['electricity_bill'], data['internet_cost'],
        data['debt'], data['savings']
    ]]
    
    predictions = monthly_report.predict(input_data, verbose=0)
    predictions_class = np.argmax(predictions, axis=1)
    class_label = ["sehat", "kurang sehat", "buruk"]
    result = str(class_label[predictions_class[0]])
    
    return jsonify({
        "finance_report": result
    })
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)