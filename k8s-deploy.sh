#!/bin/bash

DOCKERHUB_USERNAME=$1

if [ -z "$DOCKERHUB_USERNAME" ]; then
  echo "Usage: ./k8s-deploy.sh <your-dockerhub-username>"
  exit 1
fi

echo "Patching image names in k8s manifests with: $DOCKERHUB_USERNAME"

for file in k8s/user-service.yaml k8s/account-service.yaml k8s/transaction-service.yaml \
            k8s/loan-service.yaml k8s/notification-service.yaml k8s/api-gateway.yaml k8s/frontend.yaml; do
  sed -i "s/YOUR_DOCKERHUB_USERNAME/$DOCKERHUB_USERNAME/g" $file
done

echo ""
echo "Step 1: Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo ""
echo "Step 2: Applying ConfigMaps and Secrets..."
kubectl apply -f k8s/postgres-init-configmap.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

echo ""
echo "Step 3: Deploying PostgreSQL..."
kubectl apply -f k8s/postgres.yaml

echo "Waiting for PostgreSQL to be ready (up to 2 minutes)..."
kubectl wait --for=condition=ready pod -l app=postgres -n banking --timeout=120s
echo "PostgreSQL is ready!"

echo ""
echo "Step 4: Deploying microservices..."
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/account-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/transaction-service.yaml
kubectl apply -f k8s/loan-service.yaml

echo ""
echo "Step 5: Deploying API Gateway..."
kubectl apply -f k8s/api-gateway.yaml

echo ""
echo "Step 6: Deploying Frontend..."
kubectl apply -f k8s/frontend.yaml

echo ""
echo "Step 7: Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

echo ""
echo "============================================================"
echo "Deployment complete!"
echo "============================================================"
echo ""
echo "Check pod status:"
echo "  kubectl get pods -n banking"
echo ""
echo "Check services:"
echo "  kubectl get services -n banking"
echo ""
echo "Get frontend external IP (LoadBalancer):"
echo "  kubectl get svc frontend -n banking"
echo ""
echo "View logs for a service:"
echo "  kubectl logs -l app=user-service -n banking"
echo "  kubectl logs -l app=api-gateway -n banking"
