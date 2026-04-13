#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

# Only process supported file types
if [[ ! "$file_path" =~ \.(ts|tsx|js|jsx|json|css)$ ]]; then
	exit 0
fi

# Skip generated files
if [[ "$file_path" =~ routeTree\.gen\.ts$ ]]; then
	exit 0
fi

oxlint --fix "$file_path" 2>/dev/null
oxfmt --write "$file_path" 2>/dev/null

exit 0
