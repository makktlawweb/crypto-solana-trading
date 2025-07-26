#!/bin/bash

echo "🚀 Preparing deployment files..."

# Copy production server over development
cp server/index.simple.ts server/index.ts

# Copy production Dockerfile
cp Dockerfile.with-db Dockerfile

# Create production package.json with correct start script
cp package.json package.json.backup
sed 's/"start": ".*"/"start": "node dist\/index.js"/' package.json > package.json.tmp && mv package.json.tmp package.json

echo "✅ Deployment files ready!"
echo "📁 Files prepared:"
echo "   - server/index.ts (production version)"
echo "   - Dockerfile (with database support)"
echo "   - package.json (production start script)"
echo ""
echo "🔄 Next steps:"
echo "   1. Commit these changes to git"
echo "   2. Push to GitHub"
echo "   3. Railway will auto-deploy"
echo ""
echo "🔧 To restore development files, run: ./restore-dev.sh"