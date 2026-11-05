#!/bin/bash

# Update Portfolio - Run all update scripts in order
# This script updates category JSON files and generates thumbnails

echo "========================================="
echo "  Photography Portfolio Update Script"
echo "========================================="
echo ""

# Step 1: Update category JSON files
echo "Step 1: Updating category JSON files..."
node update-images.js
if [ $? -ne 0 ]; then
    echo "❌ Error updating categories"
    exit 1
fi
echo ""

# Step 2: Generate thumbnails
echo "Step 2: Generating thumbnails..."
node generate-thumbnails.js
if [ $? -ne 0 ]; then
    echo "❌ Error generating thumbnails"
    exit 1
fi
echo ""

echo "========================================="
echo "  ✓ Portfolio update complete!"
echo "========================================="
