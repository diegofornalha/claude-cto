# Single-stage simplified build for Claude CTO
FROM python:3.11-slim-bullseye

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user early
RUN useradd --create-home --shell /bin/bash claude

# Set work directory
WORKDIR /app

# First install core dependencies directly via pip
RUN pip install --upgrade pip && \
    pip install \
    sqlmodel>=0.0.14 \
    claude-code-sdk>=0.0.19 \
    alembic>=1.13.0 \
    fastapi>=0.100.0 \
    uvicorn[standard]>=0.23.0 \
    typer[rich]>=0.12.0 \
    httpx>=0.25.0 \
    fastmcp>=2.0.0 \
    psutil>=5.9.0

# Copy application code
COPY --chown=claude:claude . .

# Create data directory with correct ownership
RUN mkdir -p /app/data && chown -R claude:claude /app/data

# Switch to non-root user
USER claude

# Health check - test if Python can import dependencies
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sqlmodel, fastapi, typer; print('OK')" || exit 1

# Default command - Python module execution fallback
CMD ["python", "-c", "print('Claude CTO container started. Use --help for usage.')"]