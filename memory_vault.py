import os
from datetime import datetime

class MemoryVault:
    def __init__(self, vault_path="./memories"):
        self.vault_path = vault_path
        os.makedirs(self.vault_path, exist_ok=True)
        self.daily_file = os.path.join(self.vault_path, "context_memory.md")

    def load_context(self) -> str:
        """Reads all markdown files to build system context."""
        context = ""
        for file in os.listdir(self.vault_path):
            if file.endswith(".md"):
                with open(os.path.join(self.vault_path, file), "r", encoding="utf-8") as f:
                    context += f"\n--- {file} ---\n" + f.read()
        return context

    def append_memory(self, note: str):
        """Appends new interaction data to memory file."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(self.daily_file, "a", encoding="utf-8") as f:
            f.write(f"\n- [{timestamp}] {note}")
