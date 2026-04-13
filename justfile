set dotenv-filename := ".env.prod"

# Push all env variables and secrets to Cloudflare
cf-env: cf-vars cf-secrets

# Push plaintext variables to Cloudflare
cf-vars:
    wrangler secret put BETTER_AUTH_URL --text "$BETTER_AUTH_URL"
    wrangler secret put TURSO_DATABASE_URL --text "$TURSO_DATABASE_URL"

# Push encrypted secrets to Cloudflare
cf-secrets:
    echo "$BETTER_AUTH_SECRET" | wrangler secret put BETTER_AUTH_SECRET
    echo "$TURSO_DATABASE_AUTH_TOKEN" | wrangler secret put TURSO_DATABASE_AUTH_TOKEN
