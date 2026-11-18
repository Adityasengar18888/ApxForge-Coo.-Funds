.PHONY: help dev dev-backend dev-frontend test test-parity lint format train compose-up compose-down clean

PYTHON ?= python
PNPM ?= pnpm

help:
	@echo "ApxForge Quantitative Analytics & ML Platform"
	@echo "============================================="
	@echo "make dev           - Run backend and frontend concurrently"
	@echo "make dev-backend   - Run FastAPI backend (port 8000)"
	@echo "make dev-frontend  - Run Next.js frontend (port 3000)"
	@echo "make test          - Run all backend unit & parity test suites"
	@echo "make test-parity   - Run legacy Black-Scholes & Greeks parity assertions"
	@echo "make lint          - Run ruff on backend and eslint on frontend"
	@echo "make format        - Auto-format backend with ruff"
	@echo "make train         - Train and register ML options and classifier artifacts"
	@echo "make compose-up    - Launch full stack via docker-compose"
	@echo "make compose-down  - Tear down docker-compose containers"
	@echo "make clean         - Clean bytecode and build caches"

dev:
	@echo "Launching full stack development servers..."
	@echo "FastAPI backend: http://localhost:8000"
	@echo "Next.js frontend: http://localhost:3000"

dev-backend:
	uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd frontend && $(PNPM) dev

test:
	pytest backend/tests -v

test-parity:
	pytest backend/tests/test_parity.py -v

lint:
	ruff check backend
	cd frontend && $(PNPM) lint

format:
	ruff format backend

train:
	$(PYTHON) -m backend.app.ml.train

compose-up:
	docker compose up -d --build

compose-down:
	docker compose down

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
