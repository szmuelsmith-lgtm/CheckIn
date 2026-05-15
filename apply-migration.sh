#!/usr/bin/env bash
# Copies the migration SQL to your clipboard and opens the Supabase SQL editor.
# Run: bash apply-migration.sh

SQL_FILE="$(dirname "$0")/supabase/migrations/009_apply_missing_004_columns.sql"

# Copy to clipboard
if command -v pbcopy &>/dev/null; then
  pbcopy < "$SQL_FILE"
  echo "✅ Migration SQL copied to clipboard."
elif command -v xclip &>/dev/null; then
  xclip -selection clipboard < "$SQL_FILE"
  echo "✅ Migration SQL copied to clipboard."
else
  echo "⚠️  Could not copy to clipboard — open the file manually:"
  echo "   $SQL_FILE"
fi

# Open Supabase SQL editor
EDITOR_URL="https://supabase.com/dashboard/project/doeycpheigjihvfvupid/sql/new"
echo "Opening Supabase SQL editor..."
open "$EDITOR_URL" 2>/dev/null || xdg-open "$EDITOR_URL" 2>/dev/null || echo "Open this URL: $EDITOR_URL"

echo ""
echo "Paste (Cmd+V) into the editor and click Run."
