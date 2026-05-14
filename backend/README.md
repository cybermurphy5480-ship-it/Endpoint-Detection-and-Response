# Backend & Database Setup Guide

This guide explains how to configure:

* PostgreSQL database
* FastAPI backend
* Log receiver
* Database integration with `main.py`

The backend is responsible for:

* storing logs
* serving APIs
* providing endpoint telemetry
* handling response actions

---

# Components Used

| Component   | Purpose                     |
| ----------- | --------------------------- |
| PostgreSQL  | Centralized log storage     |
| FastAPI     | Backend API server          |
| psycopg2    | PostgreSQL Python connector |
| Uvicorn     | FastAPI ASGI server         |
| receiver.py | Inserts logs into database  |

---

# 1. Install PostgreSQL

## Ubuntu / Debian

Install PostgreSQL:

```bash id="q5n7tw"
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

Start PostgreSQL:

```bash id="v1k4qc"
sudo systemctl start postgresql
```

Enable on boot:

```bash id="m4r9vp"
sudo systemctl enable postgresql
```

---

# 2. Access PostgreSQL

Switch to postgres user:

```bash id="p7n2wc"
sudo -u postgres psql
```

---

# 3. Create Database

Create database:

```sql id="u3k8qx"
CREATE DATABASE soclab;
```

Connect to database:

```sql id="d9m5qc"
\c soclab
```

---

# 4. Create Logs Table

Create table:

```sql id="w2r8vp"
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP,
    hostname TEXT,
    event_code TEXT,
    message TEXT,
    username TEXT,
    raw JSONB
);
```

---

# 5. Create Actions Table

This table stores pending endpoint actions.

```sql id="k6n1tw"
CREATE TABLE actions (
    id SERIAL PRIMARY KEY,
    hostname TEXT,
    action TEXT,
    target TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 6. Configure PostgreSQL Password

Inside PostgreSQL shell:

```sql id="f3v7qx"
ALTER USER postgres WITH PASSWORD 'yourpassword';
```

Replace:

```text id="p4m9vr"
yourpassword
```

with your own password.

Exit PostgreSQL:

```sql id="r1q6tp"
\q
```

---

# 7. Install Python Dependencies

Install required packages:

```bash id="t7m3vx"
pip install fastapi uvicorn psycopg2-binary requests
```

---

# 8. receiver.py

The project uses:

```text id="m2q9wc"
receiver.py
```

to receive logs and insert them into PostgreSQL.

This replaced the Logstash JDBC plugin because:

* JDBC plugin installation issues occurred
* memory problems happened
* Python receiver became more stable

---

# Example receiver.py Database Connection

```python id="v8k2wc"
conn = psycopg2.connect(
    dbname="soclab",
    user="postgres",
    password="yourpassword",
    host="localhost"
)
```

---

# 9. main.py Database Connection

The FastAPI backend also connects to PostgreSQL using psycopg2.

Example:

```python id="y5m1vp"
conn = psycopg2.connect(
    dbname="soclab",
    user="postgres",
    password="yourpassword",
    host="localhost"
)
```

---

# 16. Security Note

For production environments:

* avoid hardcoded passwords
* use environment variables
* enable TLS
* restrict database access
* implement authentication

This project is intended for:

* educational labs
* cybersecurity learning
* SOC simulation
* EDR experimentation
