# Kubernetes Health Probes Walkthrough

Your Kubernetes manifests now include a deliberate mix of all three probe lifecycles (`startupProbe`, `livenessProbe`, `readinessProbe`) and all three probe actions (`httpGet`, `tcpSocket`, `exec`). This is a perfect setup to demonstrate the concepts to your audience!

Here's a detailed breakdown of how they are distributed:

## 1. user-service
- **startupProbe**: `httpGet` on `/health`
- **readinessProbe**: `httpGet` on `/health`
- **livenessProbe**: `tcpSocket`
*Why? Provides a solid example of waiting for an HTTP endpoint to become healthy before declaring the pod ready, and using a lightweight TCP check for ongoing liveness.*

## 2. account-service
- **startupProbe**: `tcpSocket`
- **readinessProbe**: `tcpSocket`
- **livenessProbe**: `httpGet` on `/health`
*Why? Demonstrates a fast startup/readiness check that purely verifies the process grabbed the network port, while keeping the ongoing liveness check explicitly tied to app logic (`/health`).*

## 3. transaction-service
- **startupProbe**: `httpGet` on `/health`
- **readinessProbe**: `httpGet` on `/health`
- **livenessProbe**: `tcpSocket`

## 4. frontend
- **startupProbe**: `httpGet` on `/`
- **readinessProbe**: `httpGet` on `/`
- **livenessProbe**: `tcpSocket`
*Why? Demonstrates typical web-server configuration using the index page for startup validation.*

## 5. postgres
- **startupProbe**: `exec` (`pg_isready -U postgres`)
- **readinessProbe**: `exec` (`pg_isready -U postgres`)
- **livenessProbe**: `exec` (`pg_isready -U postgres`)
*Why? This is the quintessential example of an `exec` action. Since the database container doesn't serve standard HTTP pages, we execute a database-native CLI tool inside the container.*

