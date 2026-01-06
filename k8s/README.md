# Kubernetes Manifests

Cloud-agnostic Kubernetes deployment for Pole Agenda.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Ingress                                  │
│                    (nginx/traefik/haproxy)                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service (ClusterIP)                          │
│                      pole-agenda-api:80                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   API Pod   │   │   API Pod   │   │   API Pod   │
│  (replica)  │   │  (replica)  │   │  (replica)  │
└─────────────┘   └─────────────┘   └─────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   External Postgres  │
              └─────────────────────┘
```

## Deployment Flow

```
1. InitContainer (flyway-migrate)
   └── Runs database migrations
   └── Exits successfully (0)
           │
           ▼
2. Main Container (api)
   └── Starts only after migrations complete
   └── Serves HTTP traffic on port 3000
```

## Files

| File | Purpose |
|------|---------|
| `namespace.yaml` | Creates `pole-agenda` namespace |
| `configmap.yaml` | Non-sensitive configuration |
| `secret.yaml` | Sensitive credentials (template) |
| `serviceaccount.yaml` | Workload identities |
| `deployment.yaml` | API with migration InitContainer |
| `worker-deployment.yaml` | Background job processor |
| `service.yaml` | Internal load balancer |
| `ingress.yaml` | External access |
| `hpa.yaml` | Autoscaling rules |
| `pdb.yaml` | Disruption budget for HA |
| `networkpolicy.yaml` | Network isolation |
| `migration-job.yaml` | Standalone migration job |
| `kustomization.yaml` | Kustomize configuration |

## Quick Start

```bash
# Deploy all resources
kubectl apply -k k8s/

# Check deployment status
kubectl get pods -n pole-agenda

# View migration logs
kubectl logs -n pole-agenda -l app.kubernetes.io/component=api -c flyway-migrate

# View API logs
kubectl logs -n pole-agenda -l app.kubernetes.io/component=api -c api
```

## Production Setup

### 1. Create real secrets

```bash
# Create secret from file or vault
kubectl create secret generic pole-agenda-secrets \
  --namespace pole-agenda \
  --from-literal=DATABASE_USER=app_user \
  --from-literal=DATABASE_PASSWORD='real-password' \
  --from-literal=JWT_SECRET='real-jwt-secret-32-chars-min' \
  --from-literal=S3_ACCESS_KEY_ID='access-key' \
  --from-literal=S3_SECRET_ACCESS_KEY='secret-key'
```

### 2. Update ConfigMap for environment

```bash
kubectl edit configmap pole-agenda-config -n pole-agenda
```

### 3. Deploy

```bash
kubectl apply -k k8s/
```

## Environment Overlays

Create overlays for different environments:

```
k8s/
├── base/
│   ├── kustomization.yaml
│   └── *.yaml
├── overlays/
│   ├── development/
│   │   └── kustomization.yaml
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
```

Example production overlay:

```yaml
# k8s/overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - ../../base
patches:
  - patch: |-
      - op: replace
        path: /spec/replicas
        value: 3
    target:
      kind: Deployment
      name: pole-agenda-api
images:
  - name: pole-agenda-api
    newTag: v1.2.3
```

## Scaling

```bash
# Manual scaling
kubectl scale deployment pole-agenda-api -n pole-agenda --replicas=5

# HPA will auto-scale based on CPU/memory
kubectl get hpa -n pole-agenda
```

## Troubleshooting

```bash
# Check pod status
kubectl get pods -n pole-agenda

# Describe failed pod
kubectl describe pod <pod-name> -n pole-agenda

# Check migration logs
kubectl logs job/pole-agenda-migrate -n pole-agenda

# Check API logs
kubectl logs -f deployment/pole-agenda-api -n pole-agenda -c api

# Check worker logs
kubectl logs -f deployment/pole-agenda-worker -n pole-agenda
```

## Security Notes

1. **Secrets**: Use external secret management (Vault, ESO) in production
2. **Network Policies**: Adjust namespaces for your database location
3. **RBAC**: ServiceAccounts have minimal permissions by default
4. **Pod Security**: Containers run as non-root with read-only filesystem
