import socket
import json
import psycopg2

conn = psycopg2.connect(
    dbname="soclab",
    user="postgres",
    password="password123",
    host="localhost"
)

cur = conn.cursor()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(("0.0.0.0", 9999))
server.listen(5)

print("[+] Listening on port 9999")

client, addr = server.accept()

print(f"[+] Connection from {addr}")

while True:

    data = client.recv(65535)

    if not data:
        break

    lines = data.decode(errors="ignore").splitlines()

    for line in lines:

        try:
            log = json.loads(line)

            timestamp = str(log.get("@timestamp"))
            hostname = str(log.get("host", {}).get("hostname"))
            event_code = str(log.get("event", {}).get("code"))
            message = str(log.get("message"))

            print(hostname, event_code, message)

            cur.execute(
                """
                INSERT INTO logs(timestamp, hostname, event_code, message)
                VALUES (%s, %s, %s, %s)
                """,
                (timestamp, hostname, event_code, message)
            )

            conn.commit()

        except Exception as e:
            print(e)
