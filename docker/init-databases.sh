#!/bin/bash
set -e

# Create all 4 databases in the single Postgres instance.
# POSTGRES_DB (default) is created automatically by the image.
# This script runs on first startup only.

for db in company_db job_db user_db subscription_db; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done
