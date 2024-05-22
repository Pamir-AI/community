import express from 'express';
import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Soul } from "@opensouls/engine";

const SOUL_ENGINE_ORGANIZATION = "tommy1901";
const SOUL_ENGINE_BLUEPRINT = "samantha-learns";

const app = express();
app.use(express.json());

const server = new HttpServer(app);
const wss = new WebSocketServer({ server });

let soul: any;

async function connectToSoulEngine() {
  soul = new Soul({
    organization: SOUL_ENGINE_ORGANIZATION,
    blueprint: SOUL_ENGINE_BLUEPRINT,
  });

  await soul.connect();

  soul.on("says", async (event: any) => {
    const content = await event.content();
    const message = JSON.stringify({ type: "says", content });
    // Broadcast message to all connected WebSocket clients
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(`Broadcasting message: ${message}`);
        client.send(message);
      }
    });
  });
  
soul.on("thinks", async (event: any) => {
    const content = await event.content();
    const message = JSON.stringify({ type: "thinks", content });
    // Broadcast message to all connected WebSocket clients
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(`Broadcasting thoughts: ${message}`);
        client.send(message);
      }
    });
  });
}

// WebSocket connection handler
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    // Dispatch received message to the Soul Engine
    console.log(`Received message: ${data.message}`);
    soul.dispatch({
      action: "said",
      content: data.message,
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Route to test server is up
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('WebSocket server is running');
});

// Start the HTTP and WebSocket server
const PORT = 5001;
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await connectToSoulEngine();
});
