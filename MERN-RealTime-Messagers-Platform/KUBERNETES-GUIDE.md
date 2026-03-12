# Kubernetes (K8s) Guide for Your MERN Chat Project
## From Beginner to Advanced

---

## PART 1: KUBERNETES BASICS (What is it?)

### 1.1 What is Kubernetes?
Kubernetes (K8s) is an **orchestrator** — a tool that manages containers at scale.

**Simple analogy:**
- Docker Compose = runs 2 containers on 1 machine (your laptop)
- Kubernetes = runs 100s/1000s of containers across many machines (cloud)

**What does Kubernetes do?**
- Starts/stops containers automatically when needed
- Distributes load across multiple servers
- Restarts failed containers instantly
- Scales up/down based on traffic
- Handles networking and storage across servers

---

### 1.2 Basic Components (What you need to know)

| Term | Meaning | Your Project Example |
|------|---------|----------------------|
| **Node** | A machine (physical/cloud VM) | Your laptop or cloud server |
| **Pod** | Smallest unit, wraps a container | One instance of chat-app or chat-postgres |
| **Deployment** | Tells K8s how many pods to run | "run 3 copies of chat-app" |
| **Service** | Exposes pods to network | How chat-app talks to postgres |
| **Volume** | Persistent storage in K8s | Your postgres_data runs here too |
| **Namespace** | Logical grouping | Separate dev/staging/prod | 

---

### 1.3 Your Current Setup (Docker Compose)
```
Your Laptop
├── chat-app container (1 copy)
└── chat-postgres container (1 copy)
```

### 1.4 Same Setup in Kubernetes
```
Kubernetes Cluster (may span multiple servers)
├── chat-app Deployment (3 replicas = 3 pods)
├── chat-postgres StatefulSet (1 replica with persistent storage)
├── Service: chat-app-service (load balance across 3 pods)
└── Service: postgres-service (direct connection to postgres)
```

---

## PART 2: WHY USE KUBERNETES? (When to use it)


### When to use Docker Compose (Your current setup):
- ✅ Local development
- ✅ Small hobby projects
- ✅ Learning Docker basics
- ✅ Running on 1 machine

### When to use Kubernetes:
- ✅ Production with high traffic
- ✅ Need auto-scaling (more pods when traffic spikes)
- ✅ Need self-healing (auto-restart failed pods)
- ✅ Multiple machines/datacenters
- ✅ Need advanced networking/security
- ✅ Team managing infrastructure

**For your chat project:**
- Using Docker Compose locally? Perfect.
- Deploying to production with 1000+ concurrent users? Use Kubernetes.

---

## PART 3: KUBERNETES INSTALLATION

### 3.1 Option A: Local Kubernetes (for learning)
Install Docker Desktop with K8s enabled:

1. Open Docker Desktop Settings
2. Go to Kubernetes tab
3. Check "Enable Kubernetes"
4. Click Apply & Restart

Verify:
```bash
kubectl version
```

### 3.2 Option B: Use managed Kubernetes (production)
Cloud providers manage K8s for you:
- **Google Cloud**: Google Kubernetes Engine (GKE)
- **AWS**: Elastic Kubernetes Service (EKS)
- **Azure**: Azure Kubernetes Service (AKS)

For this guide, we'll use **local Kubernetes** (Option A).

---

## PART 4: BASIC KUBERNETES FILES (YAML)

Your Docker Compose had:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

In Kubernetes, you write separate YAML files:

### 4.1 Pod (basic unit)
`postgres-pod.yaml`:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: chat-postgres
spec:
  containers:
  - name: postgres
    image: postgres:16-alpine
    env:
    - name: POSTGRES_USER
      value: postgres
    - name: POSTGRES_PASSWORD
      value: postgres123
    - name: POSTGRES_DB
      value: realtimechat
    ports:
    - containerPort: 5432
```

**Apply it:**
```bash
kubectl apply -f postgres-pod.yaml
```

**Check it:**
```bash
kubectl get pods
kubectl logs chat-postgres
```

### 4.2 Problem with Pods
Pods are temporary. If one crashes, it's gone forever.

**Solution: Use Deployment** (tells K8s to auto-restart).

---

## PART 5: DEPLOYMENT (Auto-manage Pods)

`postgres-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          value: postgres123
        - name: POSTGRES_DB
          value: realtimechat
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

**Key differences from Pod:**
- `replicas: 1` = K8s keeps 1 copy running always
- If pod crashes, K8s restarts it automatically
- `volumeMounts` + `persistentVolumeClaim` = persistent storage

---

## PART 6: PERSISTENT STORAGE (Like Docker volumes)

In Docker Compose, you had:
```yaml
volumes:
  postgres_data:
```

In Kubernetes, create two files:

### 6.1 PersistentVolume (PV) - the disk
`postgres-pv.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
spec:
  accessModes:
    - ReadWriteOnce
  capacity:
    storage: 10Gi
  hostPath:
    path: /data/postgres
```

### 6.2 PersistentVolumeClaim (PVC) - claim to use it
`postgres-pvc.yaml`:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

**Apply:**
```bash
kubectl apply -f postgres-pv.yaml
kubectl apply -f postgres-pvc.yaml
kubectl apply -f postgres-deployment.yaml
```

**Check:**
```bash
kubectl get pv
kubectl get pvc
```

---

## PART 7: SERVICE (Networking)

Pods get temporary IPs. If pod restarts, IP changes.

**Solution: Service** — stable IP/DNS for pods.

`postgres-service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

Now chat-app can reach postgres using: `postgres-service:5432`

---

## PART 8: CHAT-APP DEPLOYMENT

`chatapp-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-app
  template:
    metadata:
      labels:
        app: chat-app
    spec:
      containers:
      - name: chat-app
        image: your-registry/chat-app:latest
        env:
        - name: PG_HOST
          value: postgres-service
        - name: PG_PORT
          value: "5432"
        - name: PG_USER
          value: postgres
        - name: PG_PASSWORD
          value: postgres123
        - name: PG_DATABASE
          value: realtimechat
        - name: PORT
          value: "3001"
        ports:
        - containerPort: 3001
```

Key differences:
- `replicas: 3` = 3 copies of chat-app running (load balanced)
- `PG_HOST: postgres-service` = talks to postgres via service DNS name
- All 3 copies serve traffic

`chatapp-service.yaml`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: chat-app-service
spec:
  selector:
    app: chat-app
  ports:
  - port: 3002
    targetPort: 3001
  type: LoadBalancer
```

`type: LoadBalancer` = external access to your app.

---

## PART 9: COMPLETE DEPLOYMENT (Put it all together)

Create folder structure:
```
k8s/
├── postgres-pv.yaml
├── postgres-pvc.yaml
├── postgres-deployment.yaml
├── postgres-service.yaml
├── chatapp-deployment.yaml
├── chatapp-service.yaml
└── namespace.yaml
```

### namespace.yaml (optional, but good practice)
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: chat-app-dev
```

### Apply all files (in order):
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-pv.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/chatapp-deployment.yaml
kubectl apply -f k8s/chatapp-service.yaml
```

Or apply all at once:
```bash
kubectl apply -f k8s/ -n chat-app-dev
```

### Check everything:
```bash
kubectl get all -n chat-app-dev
kubectl get pods -n chat-app-dev
kubectl get services -n chat-app-dev
kubectl get pvc -n chat-app-dev
```

### View logs:
```bash
kubectl logs -f deployment/chat-app-deployment -n chat-app-dev
kubectl logs -f deployment/postgres-deployment -n chat-app-dev
```

---

## PART 10: SCALING & AUTO-HEALING

### Manual Scaling:
```bash
kubectl scale deployment chat-app-deployment --replicas=5 -n chat-app-dev
```

Now 5 copies of chat-app running (load balanced).

### Auto-scaling (based on CPU):
`chatapp-hpa.yaml`:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chat-app-hpa
  namespace: chat-app-dev
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chat-app-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Apply:
```bash
kubectl apply -f chatapp-hpa.yaml
```

**This means:**
- Minimum 2 copies running
- Maximum 10 copies
- When CPU > 70%, add more pods
- When CPU < 70%, remove pods

---

## PART 11: COMMON COMMANDS

### Debugging:
```bash
# See all resources
kubectl get all -n chat-app-dev

# Describe a pod (detailed info)
kubectl describe pod <pod-name> -n chat-app-dev

# Get logs
kubectl logs <pod-name> -n chat-app-dev

# Execute command inside pod
kubectl exec -it <pod-name> -- /bin/bash -n chat-app-dev

# Watch pods in real-time
kubectl get pods -w -n chat-app-dev
```

### Cleanup:
```bash
# Delete specific resource
kubectl delete deployment chat-app-deployment -n chat-app-dev

# Delete entire namespace (deletes everything inside)
kubectl delete namespace chat-app-dev

# Delete from file
kubectl delete -f k8s/
```

---

## PART 12: DOCKERFILE BUILD (Prerequisite)

Before uploading to K8s, your app must be in a Docker image.

Your project already has `Dockerfile`. Check it:

```bash
cat Dockerfile
```

Build image:
```bash
docker build -t chat-app:v1 .
```

Tag for registry (if using Docker Hub):
```bash
docker tag chat-app:v1 yourusername/chat-app:v1
docker push yourusername/chat-app:v1
```

Then in K8s YAML:
```yaml
image: yourusername/chat-app:v1
```

---

## PART 13: CONFIGMAPS & SECRETS (Best Practice)

Instead of hardcoding env vars in YAML:

### ConfigMap (non-sensitive config):
`config.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: chat-config
  namespace: chat-app-dev
data:
  PG_HOST: postgres-service
  PG_PORT: "5432"
  PG_DATABASE: realtimechat
  NODE_ENV: production
```

### Secret (sensitive data):
`secret.yaml`:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: chat-secret
  namespace: chat-app-dev
type: Opaque
stringData:
  PG_USER: postgres
  PG_PASSWORD: postgres123
  JWT_SECRET: change_this_to_a_strong_secret
```

### Use in Deployment:
```yaml
spec:
  containers:
  - name: chat-app
    envFrom:
    - configMapRef:
        name: chat-config
    - secretRef:
        name: chat-secret
```

Apply:
```bash
kubectl apply -f config.yaml
kubectl apply -f secret.yaml
```

---

## PART 14: STEP-BY-STEP IMPLEMENTATION (Your Project)

### Step 1: Prepare Docker image
```bash
docker build -t chat-app:v1 .
```

### Step 2: Create k8s folder
```bash
mkdir k8s
```

### Step 3: Create namespace
```bash
cat > k8s/namespace.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: chat-app-dev
EOF
```

### Step 4: Create storage files
(See Part 6 above)

### Step 5: Create postgres deployment + service
(See Part 5 & 7 above)

### Step 6: Create chat-app deployment + service
(See Part 8 above)

### Step 7: Create config & secrets
(See Part 13 above)

### Step 8: Apply all
```bash
kubectl apply -f k8s/
```

### Step 9: Verify
```bash
kubectl get all -n chat-app-dev
kubectl get pods -n chat-app-dev
```

### Step 10: Access your app
```bash
kubectl port-forward svc/chat-app-service 3002:3002 -n chat-app-dev
```

Then open browser: `http://localhost:3002`

---

## PART 15: PRODUCTION DEPLOYMENT (Advanced)

For real production:

### Use a managed service:
- **GKE** (Google Kubernetes Engine)
- **EKS** (AWS Elastic Kubernetes Service)
- **AKS** (Azure Kubernetes Service)

### Use Helm (package manager for K8s):
```bash
helm install chat-release ./chart -n chat-app-prod
```

### Use Ingress (instead of LoadBalancer):
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-app-ingress
  namespace: chat-app-dev
spec:
  rules:
  - host: chat.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: chat-app-service
            port:
              number: 3002
```

### Use TLS/SSL:
```yaml
tls:
- hosts:
  - chat.yourdomain.com
  secretName: chat-tls-secret
```

---

## PART 16: COMPARISON

| Feature | Docker Compose | Kubernetes |
|---------|---|---|
| **Setup** | Simple (1 command) | Complex (many YAML files) |
| **Scaling** | Manual, not practical | Automatic/easy |
| **Self-healing** | No | Yes (auto-restart) |
| **Multi-machine** | No | Yes |
| **Production-ready** | No | Yes |
| **Learning curve** | Easy | Steep |
| **Best for** | Dev/testing | Production |

---

## PART 17: SUMMARY

1. **Docker Compose** = simple local development tool
2. **Kubernetes** = production orchestrator for scaling & reliability
3. **Your chat project**:
   - Use Docker Compose for local dev
   - Use K8s for production deployment
4. **Basic K8s concepts**:
   - Pods (containers)
   - Deployments (manage pods)
   - Services (networking)
   - PersistentVolumes (storage)
5. **Best practice**:
   - ConfigMaps for config
   - Secrets for passwords/tokens
   - Multiple replicas for availability
   - HPA for auto-scaling

---

## NEXT STEPS

1. **Understand**: Re-read Part 1-7 until concepts click
2. **Practice**: Set up local K8s, deploy postgres first
3. **Test**: Deploy chat-app, scale to 3 replicas
4. **Learn**: Watch a K8s tutorial video
5. **Deploy**: Try cloud K8s (GKE free tier, EKS free tier)

---

## USEFUL LINKS
- K8s Official Docs: https://kubernetes.io/docs/
- K8s Tutorial: https://kubernetes.io/docs/tutorials/
- Interactive Play: https://www.katacoda.com/courses/kubernetes

---

## QUESTIONS?

If stuck, ask:
- What is a Pod?
- What is a Deployment?
- Why do I need a Service?
- How is K8s different from Docker Compose?

(This guide explains all of these!)
