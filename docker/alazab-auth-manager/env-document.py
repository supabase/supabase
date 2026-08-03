import re

class EnvDocument:
    """
    Parses a .env file, preserving comments and formatting.
    Allows updating values atomically.
    """
    def __init__(self, content: str):
        self.lines = content.splitlines()
        self.keys_map = {}  # key -> line_index
        self._parse()

    def _parse(self):
        for i, line in enumerate(self.lines):
            stripped = line.strip()
            # Ignore empty lines and comments
            if not stripped or stripped.startswith('#'):
                continue
            
            # Match KEY=VALUE or KEY="VALUE" etc.
            match = re.match(r'^([A-Za-z0-9_]+)=(.*)$', stripped)
            if match:
                key = match.group(1)
                self.keys_map[key] = i

    def get(self, key: str) -> str:
        if key not in self.keys_map:
            return None
        line = self.lines[self.keys_map[key]].strip()
        match = re.match(r'^([A-Za-z0-9_]+)=(.*)$', line)
        if match:
            val = match.group(2)
            # Remove quotes if present
            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            return val
        return None

    def set(self, key: str, value: str):
        # Escape quotes in value if needed, or simply wrap in quotes if spaces are present
        if ' ' in value or '"' in value or "'" in value:
            # simple escaping for quotes
            escaped_val = value.replace('"', '\\"')
            formatted_val = f'"{escaped_val}"'
        else:
            formatted_val = value

        if key in self.keys_map:
            idx = self.keys_map[key]
            # Replace the value but keep potential inline comments? 
            # For safety, we just replace the whole line since inline comments in env are tricky.
            self.lines[idx] = f"{key}={formatted_val}"
        else:
            # Append to the end
            self.lines.append(f"{key}={formatted_val}")
            self.keys_map[key] = len(self.lines) - 1

    def delete(self, key: str):
        if key in self.keys_map:
            idx = self.keys_map[key]
            self.lines.pop(idx)
            # Rebuild keys_map since indices have shifted
            self.keys_map = {}
            self._parse()

    def to_string(self) -> str:
        return '\n'.join(self.lines) + '\n'
