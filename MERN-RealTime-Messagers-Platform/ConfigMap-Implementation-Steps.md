# Steps to Implement ConfigMap in Kubernetes

## 1. Create a ConfigMap
Define the `ConfigMap` in a YAML file (e.g., `frontend-deployment.yaml`):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: frontend-config
  namespace: default
  labels:
    app: frontend
    environment: production
data:
  REACT_APP_API_URL: "http://backend-service.default.svc.cluster.local:5000"
  REACT_APP_ENV: "production"
```

## 2. Apply the ConfigMap
Run the following command to apply the `ConfigMap`:
```bash
kubectl apply -f frontend-deployment.yaml
```

## 3. Reference the ConfigMap in a Deployment
Update the `Deployment` to use the `ConfigMap` by adding the `envFrom` section:
```yaml
containers:
- name: frontend
  image: docker12388/mern-realtime-messagers-platform-frontend:latest
  ports:
  - containerPort: 8080
  envFrom:
  - configMapRef:
      name: frontend-config
```

## 4. Verify the ConfigMap
Check if the `ConfigMap` is created successfully:
```bash
kubectl get configmap frontend-config -o yaml
```

## 5. Restart the Deployment (if needed)
Restart the pods to ensure they pick up the updated `ConfigMap`:
```bash
kubectl rollout restart deployment frontend-deployment
```

## 6. Test the Application
- Use `kubectl port-forward` to access the application locally:
  ```bash
  kubectl port-forward deployment/frontend-deployment 8080:8080
  ```
- Open your browser and navigate to `http://localhost:8080`.

## 7. Debugging (Optional)
- Check the logs of the pods:
  ```bash
  kubectl logs <frontend-pod-name>
  ```
- Describe the `ConfigMap` for more details:
  ```bash
  kubectl describe configmap frontend-config
  ```