import subprocess
import os

class SystemControl:
    @staticmethod
    def execute_shell(command: str) -> str:
        """Executes terminal commands on the system safely."""
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
            return result.stdout if result.stdout else result.stderr
        except Exception as e:
            return f"Error executing command: {str(e)}"

    @staticmethod
    def read_file(filepath: str) -> str:
        """Reads file contents for analysis or editing."""
        if not os.path.exists(filepath):
            return "File does not exist."
        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    @staticmethod
    def write_file(filepath: str, content: str) -> str:
        """Writes or edits file contents."""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return f"File successfully written at {filepath}"
