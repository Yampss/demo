#!/bin/bash

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-init-configmap.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl wait --for=condition=ready pod -l app=postgres -n banking --timeout=120s
echo "PostgreSQL is ready!"
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/account-service.yaml
kubectl apply -f k8s/transaction-service.yaml
kubectl apply -f k8s/frontend.yaml
