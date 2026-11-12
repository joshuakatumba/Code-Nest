# Stage 1: Build the React (Vite) frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN rm -f .env .env.local .env.production
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Run the FastAPI backend + serve the built frontend
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-builder /frontend/dist /app/static_dist

EXPOSE 8000

CMD ["sh", "-c", "python seed.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
