import { readFile } from 'node:fs/promises';

const files = {
  client: await readFile('src/services/voice/openaiRealtimeVoice.ts', 'utf8'),
  hook: await readFile('src/hooks/useMayraAssistant.ts', 'utf8'),
  server: await readFile('server.ts', 'utf8'),
  wake: await readFile('src/hooks/useMayraWakeWord.ts', 'utf8'),
};

const checks = [
  ['client uses WebRTC', /RTCPeerConnection/.test(files.client)],
  ['client never embeds an API key', !/OPENAI_API_KEY/.test(files.client)],
  ['session broker is server-side', /\/api\/voice\/openai-live\/session/.test(files.server) && /process\.env\.OPENAI_API_KEY/.test(files.server)],
  ['Realtime model defaults to current gpt-realtime-2.1', /gpt-realtime-2\.1/.test(files.server)],
  ['supported primary voice is configured', /OPENAI_REALTIME_VOICE/.test(files.server) && /marin/.test(files.server)],
  ['input transcription is enabled', /input:\s*\{[\s\S]*transcription/.test(files.server)],
  ['semantic VAD interruption is enabled', /semantic_vad/.test(files.server) && /interrupt_response:\s*true/.test(files.server)],
  ['manual response.cancel exists', /response\.cancel/.test(files.client)],
  ['session/network reconnect exists', /reconnect\(\): Promise/.test(files.client)],
  ['reconnect exhaustion has a dedicated callback', /onReconnectFailed/.test(files.client)],
  ['stop-word transcript path exists', /onUserTranscript/.test(files.hook) && /रुको|stop now/.test(files.hook)],
  ['Gemini fallback is limited to initial/reconnect failure', /Initial connection failed -> Gemini fallback/.test(files.hook) && /Reconnect exhausted -> starting Gemini fallback/.test(files.hook)],
  ['native wake service is not stopped by WebView unmount', /Do not stop that service just because this React\/WebView component unmounts/.test(files.wake)],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name);
if (failed.length) {
  console.error(`Realtime voice verification failed: ${failed.length} check(s)`);
  process.exit(1);
}
console.log(`Realtime voice verification passed: ${checks.length}/${checks.length}`);
