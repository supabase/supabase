#!/bin/bash
# Setup git hooks to prevent uploading secrets and env vars

HOOK_DIR=".git/hooks"
PRE_COMMIT_FILE="$HOOK_DIR/pre-commit"

echo "Setting up pre-commit hook..."

mkdir -p "$HOOK_DIR"

cat << 'EOF' > "$PRE_COMMIT_FILE"
#!/bin/bash
# Pre-commit hook to prevent committing .env files and hardcoded secrets

RED='\032[0;31m'
NC='\032[0m'

staged_env_files=$(git diff --cached --name-only | grep -E '\.env(\..*)?$')

if [ -n "$staged_env_files" ]; then
    invalid_env_files=""
    for file in $staged_env_files; do
        if [[ "$file" != *".example"* ]] && [[ "$file" != *".template"* ]] && [[ "$file" != *".sample"* ]]; then
            invalid_env_files="$invalid_env_files $file"
        fi
    done
    
    if [ -n "$invalid_env_files" ]; then
        echo -e "${RED}Error: You are trying to commit environment variables files:${NC}"
        echo "$invalid_env_files"
        echo "Please remove them from the commit or add them to .gitignore."
        exit 1
    fi
fi

sensitive_patterns="AWS_SECRET_ACCESS_KEY|AWS_ACCESS_KEY_ID|PASSWORD=|SECRET=|TOKEN="
staged_files=$(git diff --cached --name-only --diff-filter=ACM)

for file in $staged_files; do
    if [[ "$file" == *"lock"* ]]; then
        continue
    fi
    
    match=$(git diff --cached "$file" | grep -E "^\\+" | grep -iE "$sensitive_patterns")
    if [ -n "$match" ]; then
        echo -e "${RED}Error: Potential secret found in $file:${NC}"
        echo "$match"
        echo "Please remove secrets before committing. If this is a false positive, you can skip this hook using --no-verify."
        exit 1
    fi
done

exit 0
EOF

chmod +x "$PRE_COMMIT_FILE"

echo "Pre-commit hook installed successfully. Secrets and environment variables will be blocked from being committed."
