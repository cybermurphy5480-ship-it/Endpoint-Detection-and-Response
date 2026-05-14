import requests
import time
import os

# ============================================
# CONFIG
# ============================================

HOSTNAME = os.environ["COMPUTERNAME"]

SERVER = "http://IP:8000"   # Server IP

print(f"[+] Agent started for {HOSTNAME}")
print(f"[+] Connecting to {SERVER}")

# ============================================
# BLOCKED PROCESS LIST
# ============================================

blocked_processes = set()

# ============================================
# MAIN LOOP
# ============================================

while True:

    try:

        print("\n[*] Checking for actions...")

        response = requests.get(
            f"{SERVER}/actions/{HOSTNAME}",
            timeout=5
        )

        print(f"[+] Server response: {response.status_code}")

        actions = response.json()

        print(f"[+] Actions received: {actions}")

        # ====================================
        # PROCESS ACTIONS
        # ====================================

        for action in actions:

            action_type = action["action"]
            target = action["target"]

            print("\n====================================")
            print(f"[+] Action Type : {action_type}")
            print(f"[+] Target      : {target}")
            print("====================================")

            # ====================================
            # KILL PROCESS
            # ====================================

            if action_type == "kill_process":

                command = f'taskkill /F /IM "{target}"'

                print(f"[+] Running:")
                print(command)

                result = os.system(command)

                print(f"[+] Result: {result}")

                if result == 0:
                    print(f"[+] Successfully killed {target}")
                else:
                    print(f"[!] Failed to kill {target}")

            # ====================================
            # BLOCK EXECUTABLE
            # ====================================

            elif action_type == "block_executable":

                blocked_processes.add(target)

                print(f"[+] Added to blocked list:")
                print(target)

                print(f"[+] Current blocked processes:")
                print(blocked_processes)

            # ====================================
            # UNBLOCK EXECUTABLE
            # ====================================

            elif action_type == "unblock_executable":

                blocked_processes.discard(target)

                print(f"[+] Removed from blocked list:")
                print(target)

                print(f"[+] Current blocked processes:")
                print(blocked_processes)

            # ====================================
            # SHUTDOWN
            # ====================================

            elif action_type == "shutdown":

                command = "shutdown /s /t 0"

                print(f"[+] Running:")
                print(command)

                result = os.system(command)

                print(f"[+] Result: {result}")

            # ====================================
            # UNKNOWN ACTION
            # ====================================

            else:

                print(f"[!] Unknown action:")
                print(action_type)

        # ====================================
        # ACTIVE BLOCKING ENGINE
        # ====================================

        for proc in blocked_processes:

            kill_command = (
                f'taskkill /F /IM "{proc}"'
            )

            os.system(kill_command)

    except Exception as e:

        print(f"[ERROR] {e}")

    # ============================================
    # WAIT BEFORE NEXT POLL
    # ============================================

    time.sleep(2)
