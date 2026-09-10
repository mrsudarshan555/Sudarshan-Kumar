import asyncio
from memory_vault import MemoryVault
from system_control import SystemControl
from voice_interaction import VoiceEngine
from visualizer_server import VisualizerServer

class MayraAgent:
    def __init__(self):
        self.memory = MemoryVault()
        self.sys_control = SystemControl()
        self.voice = VoiceEngine()
        self.viz = VisualizerServer()

    async def start(self):
        print("Initializing Mayra Full-Stack System...")
        # 1. Load initial memory context
        context = self.memory.load_context()
        print(f"Loaded Context Length: {len(context)} characters.")

        # 2. Main Agent Execution Loop
        while True:
            # Step A: Listen
            await self.viz.set_state("LISTENING")
            user_input = self.voice.listen()

            if not user_input:
                continue

            print(f"User: {user_input}")
            await self.viz.set_state("THINKING")

            # Step B: Process / Memory Search / Execution Logic
            # (Integrate Gemini / Claude Code Function Execution here)
            response = f"Processed: {user_input}" 

            # Append interaction to persistent vault
            self.memory.append_memory(f"User: {user_input} | Mayra: {response}")

            # Step C: Speak Output
            await self.viz.set_state("SPEAKING")
            self.voice.speak(response)

if __name__ == "__main__":
    agent = MayraAgent()
    asyncio.run(agent.start())
