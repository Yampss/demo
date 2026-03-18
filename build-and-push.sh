#!/bin/bash
docker build -t cazzzzz/banking-user-service:latest ./services/user-service
docker push cazzzzz/banking-user-service:latest
docker build -t cazzzzz/banking-account-service:latest ./services/account-service
docker push cazzzzz/banking-account-service:latest
docker build -t cazzzzz/banking-transaction-service:latest ./services/transaction-service
docker push cazzzzz/banking-transaction-service:latest
docker build -t cazzzzz/banking-frontend:latest ./frontend
docker push cazzzzz/banking-frontend:latest
echo "all pushed"

