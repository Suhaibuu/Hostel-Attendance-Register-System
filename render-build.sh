#!/usr/bin/env bash
# Render Build Script
# This script builds the frontend and copies it to backend/dist
# so the backend can serve the SPA.

set -e

echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building frontend..."
npm run build

echo "📂 Copying frontend build to backend/dist..."
cd ..
rm -rf backend/dist
cp -r frontend/dist backend/dist

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "✅ Build complete!"
