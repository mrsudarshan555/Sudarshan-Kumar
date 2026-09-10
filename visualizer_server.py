import asyncio
import websockets
import json

class VisualizerServer:
    def __init__(self, host="localhost", port=8765):
        self.host = host
        self.port = port
        self.connected_clients = set()

    async def register(self, websocket):
        self.connected_clients.add(websocket)
        try:
            await websocket.wait_closed()
        finally:
            self.connected_clients.remove(websocket)

    async def set_state(self, state: str):
        """States: 'IDLE', 'LISTENING', 'THINKING', 'SPEAKING'"""
        if self.connected_clients:
            message = json.dumps({"type": "STATE_CHANGE", "state": state})
            await asyncio.gather(*[client.send(message) for client in self.connected_clients])
