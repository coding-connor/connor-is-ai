FROM python:3.11-slim

WORKDIR /app

# Install requirements
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application code
COPY gen_ui_backend/ gen_ui_backend/
COPY jwt_public.pem . 

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000

# Expose port
EXPOSE 8000

# Run using uvicorn
CMD ["uvicorn", "gen_ui_backend.server:app", "--host", "0.0.0.0", "--port", "8000"]