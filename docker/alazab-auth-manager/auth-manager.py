#!/usr/bin/env python3
import os
import json
import socketserver
import http.server
import subprocess
import shutil
import time
import datetime
from urllib.parse import urlparse
import importlib.util

# Import EnvDocument dynamically since they're in the same dir
spec = importlib.util.spec_from_file_location("env_document", os.path.join(os.path.dirname(__file__), "env-document.py"))
env_document = importlib.util.module_from_spec(spec)
spec.loader.exec_module(env_document)
EnvDocument = env_document.EnvDocument

COMPOSE_DIR = "/opt/supabase/docker"
ENV_FILE = os.path.join(COMPOSE_DIR, "auth.env")
BACKUP_DIR = "/var/lib/alazab-auth-manager/backups"
AUDIT_LOG = "/var/lib/alazab-auth-manager/audit/auth-config.jsonl"
SOCKET_PATH = "/run/alazab-auth-manager.sock"

os.makedirs(BACKUP_DIR, exist_ok=True)
os.makedirs(os.path.dirname(AUDIT_LOG), exist_ok=True)

class AuthManagerHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _read_env(self):
        if not os.path.exists(ENV_FILE):
            return {}
        with open(ENV_FILE, 'r') as f:
            doc = EnvDocument(f.read())
        
        # We just return the parsed variables as a dictionary
        env_dict = {}
        for key in doc.keys_map:
            val = doc.get(key)
            if val is not None:
                env_dict[key] = val
        return env_dict

    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.endswith('/config'):
            env_dict = self._read_env()
            self._send_json({"env": env_dict})
            return
            
        elif parsed_path.path.endswith('/apply-status'):
            # Check auth container health
            try:
                res = subprocess.run(["docker", "inspect", "--format='{{.State.Health.Status}}'", "supabase-auth"], capture_output=True, text=True)
                health = res.stdout.strip().strip("'")
                
                status_obj = {
                    "status": "healthy" if health == "healthy" else "unhealthy",
                    "health": health,
                    "authContainer": "supabase-auth"
                }
                self._send_json(status_obj)
            except Exception as e:
                self._send_json({"status": "unknown", "error": str(e)})
            return

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path.endswith('/rollback'):
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(body)
                revision = payload.get('revision')
                if not revision:
                    self._send_json({"error": "Revision required"}, 400)
                    return
                
                backup_path = os.path.join(BACKUP_DIR, f"auth.env.{revision}")
                if not os.path.exists(backup_path):
                    self._send_json({"error": "Revision not found"}, 404)
                    return
                
                shutil.copy(backup_path, ENV_FILE)
                success = self._apply_compose()
                
                # Audit log
                audit = {
                    "timestamp": datetime.datetime.now().isoformat(),
                    "action": "auth_config_rollback",
                    "revision": revision,
                    "result": "success" if success else "failed"
                }
                with open(AUDIT_LOG, 'a') as f:
                    f.write(json.dumps(audit) + "\n")

                if success:
                    self._send_json({"status": "rollback_success"})
                else:
                    self._send_json({"status": "rollback_failed"}, 500)
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        self.send_response(404)
        self.end_headers()

    def do_PATCH(self):
        parsed_path = urlparse(self.path)
        if not parsed_path.path.endswith('/config'):
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        try:
            updates = json.loads(body)
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, 400)
            return
            
        env_updates = updates.get("env", {})
        
        # Load current env
        if not os.path.exists(ENV_FILE):
            open(ENV_FILE, 'a').close()
            
        with open(ENV_FILE, 'r') as f:
            content = f.read()
            
        doc = EnvDocument(content)
        
        # Create Backup
        rev_id = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        backup_path = os.path.join(BACKUP_DIR, f"auth.env.{rev_id}")
        shutil.copy(ENV_FILE, backup_path)
        
        # Apply updates to doc
        changed = list(env_updates.keys())
        for k, v in env_updates.items():
            if v == "" and k in doc.keys_map:
                doc.delete(k)
            else:
                doc.set(k, v)
                
        # Atomic Write
        tmp_file = f"{ENV_FILE}.tmp"
        with open(tmp_file, 'w') as f:
            f.write(doc.to_string())
            f.flush()
            os.fsync(f.fileno())
            
        os.chmod(tmp_file, 0o600)
        os.replace(tmp_file, ENV_FILE)
        
        # Apply config
        success = self._apply_compose()
        
        # Audit log
        audit = {
            "timestamp": datetime.datetime.now().isoformat(),
            "action": "auth_config_updated",
            "changedFields": changed,
            "revision": rev_id,
            "result": "success" if success else "failed"
        }
        with open(AUDIT_LOG, 'a') as f:
            f.write(json.dumps(audit) + "\n")
            
        if not success:
            # Rollback
            shutil.copy(backup_path, ENV_FILE)
            self._apply_compose()
            self._send_json({"error": "Failed to apply compose, rolled back"}, 500)
            return

        self._send_json({"status": "success", "revision": rev_id})

    def _apply_compose(self) -> bool:
        try:
            # config check
            subprocess.run(["docker", "compose", "--env-file", ".env", "--env-file", "auth.env", "config", "--quiet"], 
                           cwd=COMPOSE_DIR, check=True, capture_output=True)
            # restart auth
            subprocess.run(["docker", "compose", "--env-file", ".env", "--env-file", "auth.env", "up", "-d", "--no-deps", "--force-recreate", "auth"], 
                           cwd=COMPOSE_DIR, check=True, capture_output=True)
            return True
        except subprocess.CalledProcessError as e:
            print(f"Compose failed: {e.stderr.decode('utf-8', errors='ignore')}")
            return False

class UnixSocketHttpServer(socketserver.UnixStreamServer):
    def get_request(self):
        request, client_address = super().get_request()
        return (request, ["local", 0])

if __name__ == '__main__':
    if os.path.exists(SOCKET_PATH):
        os.remove(SOCKET_PATH)
        
    server = UnixSocketHttpServer(SOCKET_PATH, AuthManagerHandler)
    os.chmod(SOCKET_PATH, 0o666) # In production, set to 660 and use specific group
    
    print(f"Alazab Auth Manager listening on {SOCKET_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        os.remove(SOCKET_PATH)
