#!/bin/bash

# This script takes care of the steps to update the system prompt stored in GCP: 

# 1. Run repopack from project root
repopack

# 2. Copy README.md to long context documents
mkdir -p backend/system_prompts/1_long_context_documents
cp README.md backend/system_prompts/1_long_context_documents/README.md

# 3. Run repo_summary.py from backend
cd backend
poetry run python system_prompts/repopack/repo_summary.py

# 4. Run prompt_upload.py
poetry run python system_prompts/prompt_upload.py

# Return to original directory
cd ..