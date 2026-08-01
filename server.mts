import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { setupSocket } from "./src/server/socket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const allowedOrigin = process.env.NEXT_PUBLIC_URL || "*";

  const io = new SocketIOServer(server, {
    cors: {
      origin: dev ? "*" : allowedOrigin,
      methods: ["GET", "POST"],
    },
  });

  setupSocket(io);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use`);
      process.exit(1);
    }
    throw err;
  });

  function gracefulShutdown(signal: string) {
    console.log(`\n> Received ${signal}, shutting down...`);
    io.close(() => {
      server.close(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
});
