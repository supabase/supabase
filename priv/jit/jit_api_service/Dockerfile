FROM python:3.12-slim

WORKDIR /app

COPY server.py .

# Install dependencies (none needed for BaseHTTPServer)
# EXPOSE 8080  # optional

CMD ["python", "server.py"]
