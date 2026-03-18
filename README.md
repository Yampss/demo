# 🏦 NexaBank — Microservices Banking Platform

A production-ready, Kubernetes-deployable banking application built with a three-tier microservices architecture.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        FRONTEND                          │
│              React + Nginx (Port 80)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                     API GATEWAY                          │
│              Node.js/Express  (Port 3000)                │
└──┬────────┬─────────┬──────────┬──────────┬─────────────┘
   │        │         │          │          │
   ▼        ▼         ▼          ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐
│ User │ │Acct  │ │Trans │ │ Loan │ │Notification  │
│ :3001│ │ :3002│ │ :3003│ │ :3004│ │    :3005     │
└──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──────┬───────┘
   │        │         │        │             │
   └────────┴─────────┴────────┴─────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                    PostgreSQL                            │
│  users_db | accounts_db | transactions_db | loans_db    │
│                    notifications_db                      │
└─────────────────────────────────────────────────────────┘
```

---

## Services

| Service              | Port | Responsibility                                 |
|----------------------|------|------------------------------------------------|
| **Frontend**         | 80   | React SPA — UI for all banking operations      |
| **API Gateway**      | 3000 | Single entry point, rate limiting, routing     |
| **User Service**     | 3001 | Registration, login, JWT auth, profiles        |
| **Account Service**  | 3002 | Bank account CRUD, balance management          |
| **Transaction Svc**  | 3003 | Deposits, withdrawals, transfers               |
| **Loan Service**     | 3004 | Loan applications, EMI calc, approvals, repay  |
| **Notification Svc** | 3005 | In-app notifications for all events            |
| **PostgreSQL**       | 5432 | Shared DB instance with 5 separate databases   |

---

## Project Structure

```
demo/
├── frontend/                    # React application
│   ├── src/
│   │   ├── api.js               # Axios API client
│   │   ├── App.js               # Router & auth guards
│   │   ├── context/             # Auth context
│   │   ├── pages/               # Login, Register, Dashboard, etc.
│   │   └── components/          # Sidebar
│   ├── nginx.conf
│   └── Dockerfile               # Multi-stage build
│
├── api-gateway/                 # Express proxy gateway
│   ├── src/index.js
│   └── Dockerfile
│
├── services/
│   ├── user-service/            # Auth & user management
│   ├── account-service/         # Bank account management
│   ├── transaction-service/     # Deposits/Withdrawals/Transfers
│   ├── loan-service/            # Loan lifecycle management
│   └── notification-service/   # Notification store
│
├── k8s/                         # Kubernetes manifests
│   ├── namespace.yaml
│   ├── secrets.yaml
│   ├── configmap.yaml
│   ├── postgres-init-configmap.yaml
│   ├── postgres.yaml
│   ├── user-service.yaml
│   ├── account-service.yaml
│   ├── transaction-service.yaml
│   ├── loan-service.yaml
│   ├── notification-service.yaml
│   ├── api-gateway.yaml
│   ├── frontend.yaml
│   └── ingress.yaml
│
├── build-and-push.sh            # Build + push all images to DockerHub
└── k8s-deploy.sh                # Apply all K8s manifests
```

---

## Deployment Guide

### Step 1 — Build and Push Docker Images

```bash
# Make scripts executable
chmod +x build-and-push.sh k8s-deploy.sh

# Build all images and push to DockerHub
./build-and-push.sh <your-dockerhub-username>
```

> The frontend image is built with `REACT_APP_API_URL=http://banking.local`.
> Change this if your domain is different.

### Step 2 — Update K8s Image References

The deploy script does this automatically. If you prefer manually:

```bash
sed -i "s/YOUR_DOCKERHUB_USERNAME/yourusername/g" k8s/*.yaml
```

### Step 3 — Deploy to Kubernetes

```bash
./k8s-deploy.sh <your-dockerhub-username>
```

Or manually:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-init-configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml

# Wait for postgres
kubectl wait --for=condition=ready pod -l app=postgres -n banking --timeout=120s

kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/account-service.yaml
kubectl apply -f k8s/transaction-service.yaml
kubectl apply -f k8s/loan-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

### Step 4 — Verify Deployment

```bash
kubectl get pods -n banking
kubectl get services -n banking
kubectl get ingress -n banking
```

### Step 5 — Access the Application

If using Ingress, add to `/etc/hosts`:

```
<your-cluster-ip>  banking.local
```

Then open: **http://banking.local**

If using LoadBalancer:

```bash
kubectl get svc frontend -n banking
```

---

## Secrets Configuration

Update `k8s/secrets.yaml` with your own values before deploying:

```yaml
stringData:
  db-password: "your_secure_password"
  jwt-secret: "your_jwt_secret_key"
  internal-api-key: "your_internal_key"
```

> After changing secrets, re-apply: `kubectl apply -f k8s/secrets.yaml`

---

## API Endpoints

All requests go through the API Gateway at port `3000`.

### Auth
| Method | Path                        | Auth     |
|--------|-----------------------------|----------|
| POST   | /api/users/register         | Public   |
| POST   | /api/users/login            | Public   |
| GET    | /api/users/profile          | Required |
| PUT    | /api/users/profile          | Required |

### Accounts
| Method | Path                        | Auth     |
|--------|-----------------------------|----------|
| POST   | /api/accounts               | Required |
| GET    | /api/accounts/my            | Required |
| GET    | /api/accounts/:id           | Required |

### Transactions
| Method | Path                        | Auth     |
|--------|-----------------------------|----------|
| POST   | /api/transactions/deposit   | Required |
| POST   | /api/transactions/withdraw  | Required |
| POST   | /api/transactions/transfer  | Required |
| GET    | /api/transactions/my        | Required |

### Loans
| Method | Path                        | Auth     |
|--------|-----------------------------|----------|
| GET    | /api/loans/types            | Public   |
| POST   | /api/loans/apply            | Required |
| GET    | /api/loans/my               | Required |
| PATCH  | /api/loans/:id/approve      | Admin    |
| POST   | /api/loans/:id/repay        | Required |

### Notifications
| Method | Path                              | Auth     |
|--------|-----------------------------------|----------|
| GET    | /api/notifications/my             | Required |
| PATCH  | /api/notifications/:id/read       | Required |
| PATCH  | /api/notifications/read-all       | Required |
| DELETE | /api/notifications/:id            | Required |

---

## Technology Stack

- **Frontend**: React 18, React Router, Recharts, Axios, Nginx
- **Backend**: Node.js 18, Express.js
- **Database**: PostgreSQL 15
- **Auth**: JWT (RS256-compatible)
- **Container**: Docker (multi-stage builds)
- **Orchestration**: Kubernetes (Deployments, Services, ConfigMaps, Secrets, Ingress, PVC)
