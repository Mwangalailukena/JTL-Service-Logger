#!/bin/bash

# Firebase Firestore Backup Script
# Usage: ./scripts/backup.sh <PROJECT_ID>

PROJECT_ID=$1
BUCKET_NAME="gs://${PROJECT_ID}-backups"

if [ -z "$PROJECT_ID" ]; then
  echo "Usage: $0 <PROJECT_ID>"
  exit 1
fi

echo "Starting Firestore Export to $BUCKET_NAME..."

gcloud firestore export $BUCKET_NAME --project=$PROJECT_ID --async

echo "Backup initiated. Check Google Cloud Console for status."
