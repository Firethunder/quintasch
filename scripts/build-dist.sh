#!/usr/bin/env bash
# Build / Package Script for Production Deployment (quintasch.robedit.de)
set -e

DIST_DIR="dist"
ZIP_FILE="quintasch-release.zip"

rm -rf "$DIST_DIR" "$ZIP_FILE"
mkdir -p "$DIST_DIR"

echo "Copying web assets to $DIST_DIR..."
cp index.html controller.html manifest.json sw.js pb_schema.json "$DIST_DIR/"
cp -r css fonts icons js docs "$DIST_DIR/"

if command -v zip >/dev/null 2>&1; then
    (cd "$DIST_DIR" && zip -r "../$ZIP_FILE" .)
    echo "Created $ZIP_FILE"
fi

echo "Production bundle created successfully in $DIST_DIR/"
