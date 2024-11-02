# Water-Hop-2: Kubernetes Deployment Guide

## Introduction
This repository contains the code and deployment configuration for **Water-Hop-2**, a game with separate frontend and backend services, designed to run on a Google Kubernetes Engine (GKE) cluster. The project features auto-scaling, load balancing, and fault tolerance in a distributed environment.

## Requirements
- Google Cloud Platform (GCP) account with GKE enabled
- `gcloud` CLI
- Kubernetes CLI (`kubectl`)

## Step 1: Clone the Repository
Start by cloning the repository into your Cloud Shell on Google Cloud:
```bash
git clone https://github.com/irisrocio1979/water-hop-2.git
cd water-hop-2
````
## Step 2: Set Up GKE Cluster
1. **Authenticate** with Google Cloud:
   ```bash
   gcloud auth list
   gcloud config list project
   ```
2. **Enable the GKE API**:
   ```bash
   gcloud services enable container.googleapis.com
   ```
3. **Create a GKE Cluster**:
   ```bash
   gcloud container clusters create fancy-cluster --zone us-central1-f --num-nodes=3
   ```
4. **Connect to the Cluster**:
   ```bash
   gcloud container clusters get-credentials fancy-cluster --zone us-central1-f
   ```

## Step 3: Build Docker Images

### Backend Dockerfile
In the `backend` directory, create a Dockerfile with:
```dockerfile
# Node.js base image
FROM node:14

WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy the application
COPY . .

EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

Build the backend Docker image and push it to Google Container Registry (GCR):
```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/backend:v1 .
```

### Frontend Dockerfile
In the `frontend` directory, create a Dockerfile con:
```dockerfile
# Nginx base image
FROM nginx:alpine

# Copy frontend files
COPY . /usr/share/nginx/html

EXPOSE 80
```

Build the frontend Docker image and push it to GCR:
```bash
cd ../frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/frontend:v1 .
```

## Step 4: Deploy on Kubernetes

### Backend Deployment
In `backend-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: gcr.io/YOUR_PROJECT_ID/backend:v1
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
```

### Frontend Deployment
In `frontend-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/YOUR_PROJECT_ID/frontend:v1
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
```

Apply the deployments:
```bash
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
```

## Step 5: Verify Deployment
To verify that everything is running:
```bash
kubectl get deployments
kubectl get pods
kubectl get services
```

Access the frontend service with the external IP assigned by the LoadBalancer:
```bash
kubectl get services
```

## Step 6: Set Up Auto-scaling
Enable auto-scaling based on CPU usage:
```bash
kubectl autoscale deployment backend-deployment --cpu-percent=50 --min=2 --max=5
kubectl autoscale deployment frontend-deployment --cpu-percent=50 --min=2 --max=5
```

## Step 7: Simulate Load and Monitor
You can use `ab` (Apache Benchmark) to simulate load:
```bash
ab -n 1000 -c 10 http://EXTERNAL_IP/
```

## Step 8: Test Fault Tolerance
To test fault tolerance, delete one of the backend pods:
```bash
kubectl delete pod <backend-pod-name>
kubectl get pods
```

Kubernetes will automatically start a new pod to maintain the specified number of replicas.

## Conclusion
This setup demonstrates how to deploy and scale a distributed application using Kubernetes on GKE. The auto-scaling and load balancing features ensure high availability and scalability under variable load.

Replace `YOUR_PROJECT_ID` with your actual GCP project ID. This README provides clear instructions for each deployment step and can be further customized as you add more features or refine configurations.
