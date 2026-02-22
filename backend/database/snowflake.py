import os
import snowflake.connector
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding, PrivateFormat, NoEncryption


def _load_private_key() -> bytes:
    # Prefer inline key content from env var (for cloud deployment)
    key_content = os.getenv("SF_PRIVATE_KEY_CONTENT")
    if key_content:
        pem = key_content.encode()
    else:
        key_path = os.getenv("SF_PRIVATE_KEY_PATH")
        if not key_path or not os.path.exists(key_path):
            raise FileNotFoundError(f"Snowflake private key not found: {key_path}")
        with open(key_path, "rb") as f:
            pem = f.read()

    private_key = load_pem_private_key(pem, password=None, backend=default_backend())
    return private_key.private_bytes(
        encoding=Encoding.DER,
        format=PrivateFormat.PKCS8,
        encryption_algorithm=NoEncryption(),
    )


def get_connection():
    return snowflake.connector.connect(
        account=os.getenv("SF_ACCOUNT"),
        user=os.getenv("SF_USER"),
        private_key=_load_private_key(),
        database=os.getenv("SF_DATABASE"),
        schema=os.getenv("SF_SCHEMA"),
        warehouse=os.getenv("SF_WAREHOUSE"),
    )


def execute_query(sql: str, params: tuple = ()) -> list:
    conn = None
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(sql, params)
        columns = [col[0] for col in cursor.description]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]
    except Exception as e:
        print(f"SNOWFLAKE ERROR: {e}")
        return []
    finally:
        if conn:
            conn.close()
