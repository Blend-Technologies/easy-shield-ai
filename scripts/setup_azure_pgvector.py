"""
Azure PostgreSQL + pgvector Setup Script (Managed Identity / Entra ID)
-----------------------------------------------------------------------
Creates the vector extension and document_chunks table needed for
the EzShield AI proposal-agent RAG pipeline.

Authentication uses Azure Managed Identity (or your Azure CLI login
when running locally) — no password required.

Requirements:
    pip install psycopg2-binary python-dotenv azure-identity

Local usage (run once):
    1. Log in via Azure CLI:
           az login
    2. Fill in the AZURE_POSTGRES_* variables in your .env file.
    3. Run:
           python scripts/setup_azure_pgvector.py

On Azure (App Service / Azure Functions):
    - Assign a System-assigned or User-assigned Managed Identity to the resource.
    - Add that identity as a PostgreSQL Entra Admin (Azure Portal →
      PostgreSQL Flexible Server → Authentication).
    - DefaultAzureCredential will pick up the Managed Identity automatically.
"""

import os
import sys

# ── dependency checks ────────────────────────────────────────────────────────

def _require(package: str, install: str) -> None:
    try:
        __import__(package)
    except ImportError:
        print(f"ERROR: '{package}' is not installed.")
        print(f"Run:  pip install {install}")
        sys.exit(1)

_require("psycopg2", "psycopg2-binary")
_require("azure.identity", "azure-identity")
_require("dotenv", "python-dotenv")

import psycopg2
from azure.identity import DefaultAzureCredential
from dotenv import load_dotenv

load_dotenv()

# ── config ───────────────────────────────────────────────────────────────────

AZURE_TOKEN_RESOURCE = "https://ossrdbms-aad.database.windows.net/.default"

REQUIRED_VARS = [
    "AZURE_POSTGRES_HOST",
    "AZURE_POSTGRES_PORT",
    "AZURE_POSTGRES_DB",
    "AZURE_POSTGRES_USER",
]


def load_config() -> dict:
    missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]
    if missing:
        print("ERROR: The following .env variables are not set:")
        for v in missing:
            print(f"  {v}")
        sys.exit(1)

    return {
        "host":    os.environ["AZURE_POSTGRES_HOST"],
        "port":    int(os.environ.get("AZURE_POSTGRES_PORT", "5432")),
        "dbname":  os.environ["AZURE_POSTGRES_DB"],
        "user":    os.environ["AZURE_POSTGRES_USER"],
        "sslmode": os.environ.get("AZURE_POSTGRES_SSL", "require"),
    }


# ── token acquisition ────────────────────────────────────────────────────────

def get_access_token() -> str:
    """
    Acquires an Entra ID access token for PostgreSQL.

    Credential resolution order (DefaultAzureCredential):
      1. Environment variables (AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_CLIENT_SECRET)
      2. Workload Identity (Kubernetes)
      3. Managed Identity (Azure-hosted resources)
      4. Azure CLI  ← used when running locally after `az login`
      5. Azure PowerShell
      6. Azure Developer CLI
    """
    print("Acquiring Azure Entra ID token...", end=" ", flush=True)
    try:
        credential = DefaultAzureCredential()
        token = credential.get_token(AZURE_TOKEN_RESOURCE)
        print("done")
        return token.token
    except Exception as e:
        print(f"FAILED\n\n{e}\n")
        print("Make sure you are logged in:  az login")
        print("Or that a Managed Identity is assigned to this Azure resource.")
        sys.exit(1)


# ── DDL ──────────────────────────────────────────────────────────────────────

DDL_STATEMENTS = [
    (
        "Enabling pgvector extension",
        "CREATE EXTENSION IF NOT EXISTS vector;",
    ),
    (
        "Creating document_chunks table",
        """
        CREATE TABLE IF NOT EXISTS document_chunks (
            id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
            session_id    TEXT        NOT NULL,
            document_name TEXT        NOT NULL,
            content       TEXT        NOT NULL,
            chunk_index   INTEGER     NOT NULL,
            embedding     vector(1536),
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );
        """,
    ),
    (
        "Creating session_id index",
        "CREATE INDEX IF NOT EXISTS idx_doc_chunks_session ON document_chunks (session_id);",
    ),
    (
        "Creating IVFFlat vector index (cosine distance)",
        """
        CREATE INDEX IF NOT EXISTS idx_doc_chunks_embedding
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        """,
    ),
]


# ── main ─────────────────────────────────────────────────────────────────────

def run_setup() -> None:
    config = load_config()
    access_token = get_access_token()

    print(f"Connecting to {config['host']}:{config['port']}/{config['dbname']} as {config['user']}...", end=" ", flush=True)
    try:
        conn = psycopg2.connect(
            host=config["host"],
            port=config["port"],
            dbname=config["dbname"],
            user=config["user"],
            password=access_token,   # Entra ID token used as the password
            sslmode=config["sslmode"],
        )
        conn.autocommit = True
        print("done\n")
    except Exception as e:
        print(f"FAILED\n\n{e}")
        sys.exit(1)

    with conn.cursor() as cur:
        for description, sql in DDL_STATEMENTS:
            print(f"  • {description}...", end=" ", flush=True)
            try:
                cur.execute(sql)
                print("done")
            except Exception as e:
                print(f"FAILED\n    {e}")
                conn.close()
                sys.exit(1)

    conn.close()

    print("\n✓ Azure PostgreSQL pgvector setup complete.\n")
    print("Next steps:")
    print("  1. Set these as secrets in your edge function runtime:")
    print("       AZURE_POSTGRES_HOST, AZURE_POSTGRES_PORT, AZURE_POSTGRES_DB,")
    print("       AZURE_POSTGRES_USER, AZURE_POSTGRES_SSL")
    print("  2. Ensure the function's Managed Identity is added as a PostgreSQL Entra user.")
    print("  3. Deploy the proposal-agent function.")


if __name__ == "__main__":
    run_setup()
