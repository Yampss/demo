#!/bin/bash

DOCKERHUB_USERNAME=$1
API_URL=$2

if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo "Usage: ./build-and-push.sh <your-dockerhub-username> [api-url]"
  echo "Example: ./build-and-push.sh myuser http://203.0.113.5:3000"
  echo ""
  echo "api-url defaults to http://localhost:3000 if not provided."
  exit 1
fi

if [ -z "$API_URL" ]; then
  API_URL="http://localhost:3000"
  echo "Warning: No api-url provided. Defaulting to $API_URL"
  echo "You should provide the external IP/domain of your api-gateway service."
fi

echo "Building images for DockerHub user: $DOCKERHUB_USERNAME"
echo "Frontend API URL: $API_URL"
echo ""

docker build -t $DOCKERHUB_USERNAME/banking-user-service:latest ./services/user-service
docker push $DOCKERHUB_USERNAME/banking-user-service:latest
echo "user-service pushed"

docker build -t $DOCKERHUB_USERNAME/banking-account-service:latest ./services/account-service
docker push $DOCKERHUB_USERNAME/banking-account-service:latest
echo "account-service pushed"

docker build -t $DOCKERHUB_USERNAME/banking-transaction-service:latest ./services/transaction-service
docker push $DOCKERHUB_USERNAME/banking-transaction-service:latest
echo "transaction-service pushed"

docker build -t $DOCKERHUB_USERNAME/banking-loan-service:latest ./services/loan-service
docker push $DOCKERHUB_USERNAME/banking-loan-service:latest
echo "loan-service pushed"

docker build -t $DOCKERHUB_USERNAME/banking-notification-service:latest ./services/notification-service
docker push $DOCKERHUB_USERNAME/banking-notification-service:latest
echo "notification-service pushed"

docker build -t $DOCKERHUB_USERNAME/banking-api-gateway:latest ./api-gateway
docker push $DOCKERHUB_USERNAME/banking-api-gateway:latest
echo "api-gateway pushed"

docker build \
  --build-arg REACT_APP_API_URL=$API_URL \
  -t $DOCKERHUB_USERNAME/banking-frontend:latest \
  ./frontend
docker push $DOCKERHUB_USERNAME/banking-frontend:latest
echo "frontend pushed"

echo ""
echo "All 7 images pushed to DockerHub successfully!"
echo ""
echo "Next step: ./k8s-deploy.sh $DOCKERHUB_USERNAME"
