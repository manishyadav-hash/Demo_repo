### How to Upload an Image to Docker Hub

1. **Log in to Docker Hub**
   - Open your terminal and run the following command:
     ```bash
     docker login
     ```
   - Enter your Docker Hub username and password when prompted.

2. **Tag Your Docker Image**
   - List your Docker images to find the `IMAGE ID` of the image you want to upload:
     ```bash
     docker images
     ```
   - Tag the image with your Docker Hub username and repository name:
     ```bash
     docker tag <IMAGE_ID> <DOCKER_HUB_USERNAME>/<REPOSITORY_NAME>:<TAG>
     ```
     Example:
     ```bash
     docker tag mern-realtime-messagers-platform-frontend:latest docker12388/mern-realtime-messagers-platform-frontend:latest
     ```

3. **Push the Image to Docker Hub**
   - Push the tagged image to Docker Hub:
     ```bash
     docker push <DOCKER_HUB_USERNAME>/<REPOSITORY_NAME>:<TAG>
     ```
     Example:
     ```bash
     docker push docker12388/mern-realtime-messagers-platform-frontend:latest
     ```

4. **Verify the Upload**
   - Go to your Docker Hub account: https://hub.docker.com/
   - Log in with your username (e.g., `docker12388`).
   - Check if the image is listed under your repositories.
   