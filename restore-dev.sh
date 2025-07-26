#!/bin/bash

echo "🔄 Restoring development files..."

# Restore development index.ts (assumes you have the original backed up as index.dev.ts)
if [ -f "server/index.dev.ts" ]; then
    cp server/index.dev.ts server/index.ts
else
    echo "⚠️  No server/index.dev.ts backup found"
fi

# Restore original package.json
if [ -f "package.json.backup" ]; then
    cp package.json.backup package.json
    rm package.json.backup
else
    echo "⚠️  No package.json backup found"
fi

echo "✅ Development files restored!"