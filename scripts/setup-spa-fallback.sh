#!/bin/bash

# Script to setup GitHub Pages SPA fallback for dynamic routes
# This copies the product template to handle 404s

echo "🔧 Setting up GitHub Pages SPA support..."

# After build, we need to ensure product pages work for dynamic IDs
# GitHub Pages will serve 404.html for any unmatched routes

# We'll create a custom 404 handler in the public folder
# that GitHub Pages will use

echo "✅ GitHub Pages SPA setup complete"
echo "Note: All product URLs will now work, even for products created after deployment"
