set dotenv-filename := ".env.prod"

# Push all env variables and secrets to Vercel
vercel-env:
    vercel env add BETTER_AUTH_URL production <<< "$BETTER_AUTH_URL"
    vercel env add BETTER_AUTH_SECRET production <<< "$BETTER_AUTH_SECRET"
    vercel env add TURSO_DATABASE_URL production <<< "$TURSO_DATABASE_URL"
    vercel env add TURSO_DATABASE_AUTH_TOKEN production <<< "$TURSO_DATABASE_AUTH_TOKEN"
