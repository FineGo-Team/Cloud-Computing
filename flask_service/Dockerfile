# Use Python Images
FROM python:3.12-slim

# Create 
WORKDIR /usr/src/app

# Copy requirements.txt ke WORKDIR
COPY requirements.txt ./

# Install Libraries Dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy All Code to Workdir
COPY . .

# Expose Port Used by Application
EXPOSE 5000

# Command to Run Application
CMD ["python", "model-handler.py"]
