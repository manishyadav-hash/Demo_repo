
// Load environment variables from .env file into process.env
require("dotenv/config");

const path_1 = require("path");
const path_1_default = path_1.default || path_1;
const express_1 = require("express");
const express_1_default = express_1.default || express_1;
const cookie_parser_1 = require("cookie-parser");  //cookie-parser is used to parse cookies from incoming HTTP requests, making them available in req.cookies
const cookie_parser_1_default = cookie_parser_1.default || cookie_parser_1;
const cors_1 = require("cors");  //cors is used to enable Cross-Origin Resource Sharing, allowing the frontend (running on a different port/domain) to make requests to this backend
const cors_1_default = cors_1.default || cors_1;
const http_1 = require("http");
const http_1_default = http_1.default || http_1;
const passport_1 = require("passport"); //passport is used for authentication, specifically to handle JWT tokens for user authentication in this app
const passport_1_default = passport_1.default || passport_1;

// Import configuration and middleware
const env_config_1 = require("./config/env.config");
const asyncHandler_middleware_1 = require("./middlewares/asyncHandler.middleware");
const http_config_1 = require("./config/http.config");
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const database_config_1 = require("./config/database.config");
const database_config_1_default = database_config_1.default || database_config_1;
const socket_1 = require("./lib/socket");
const routes_1 = require("./routes");
const routes_1_default = routes_1.default || routes_1;

// This import runs the passport configuration code (JWT strategy setup)
require("./config/passport.config");

// Create Express application instance
const app = (0, express_1_default)();

// Create HTTP server using the Express app
// We need http.Server (not just Express) to attach Socket.io for real-time communication
const server = http_1_default.createServer(app);

// Initialize Socket.io for real-time messaging and call signaling
// This sets up WebSocket connections on the same server as HTTP
(0, socket_1.initializeSocket)(server);

// ========== MIDDLEWARE SETUP ==========
// Middleware functions run in sequence for every request
// The order matters! They process the request from top to bottom

// 1. Parse JSON request bodies (e.g., from POST/PUT requests)
// The limit prevents huge payloads from crashing the server
app.use(express_1_default.json({ limit: "10mb" }));

// 2. Parse cookies from request headers
// This extracts cookies into req.cookies object for easy access
app.use((0, cookie_parser_1_default)());

// 3. Parse URL-encoded form data (e.g., from HTML forms)
// extended: true allows nested objects in form data
app.use(express_1_default.urlencoded({ extended: true }));

// 4. CORS (Cross-Origin Resource Sharing) configuration
// This allows frontend (different port/domain) to make requests to this backend
app.use((0, cors_1_default)({
    // Dynamic origin validation function
    origin: function (origin, callback) {
        // Allow requests from localhost, local IP, and tunnel services (ngrok, cloudflare)
        const allowedPatterns = [
            /^http:\/\/localhost:\d+$/,           // http://localhost:5177
            /^http:\/\/127\.0\.0\.1:\d+$/,        // http://127.0.0.1:5177
            /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/, // http://10.0.5.3:5177 (mobile via WiFi)
            /^https:\/\/.*\.ngrok-free\.dev$/,    // https://xxx.ngrok-free.dev
            /^https:\/\/.*\.ngrok\.io$/,          // https://xxx.ngrok.io
            /^https:\/\/.*\.trycloudflare\.com$/, // https://xxx.trycloudflare.com
            /^http:\/\/10\.165\.98\.253:\d+$/ // http://10.165.98.253:5177
        ];
        
        // If no origin (same-origin) or matches allowed pattern, allow the request
        if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
            callback(null, true);  // null = no error, true = allowed
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    // credentials: true allows cookies to be sent from frontend to backend
    // Required for JWT tokens stored in HTTP-only cookies
    credentials: true,
}));

// 5. Initialize Passport for JWT authentication
// This must come after cookie-parser since it reads JWT from cookies
app.use(passport_1_default.initialize());

// ========== ROUTES ==========

// Health check endpoint - useful to verify server is running
app.get("/health", (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Server is healthy",
        status: "OK",
    });
}));

// Mount all API routes under /api prefix
// All routes from routes/index.js will be available at /api/*
app.use("/api", routes_1_default);

// ========== PRODUCTION STATIC FILE SERVING ==========
// In production, serve the React build files from this same server
if (env_config_1.Env.NODE_ENV === "production") {
    // Path to the built React app (after running 'npm run build')
    const clientPath = path_1_default.resolve(__dirname, "../../client/dist");
    
    // Serve static files (JS, CSS, images) from the build folder
    app.use(express_1_default.static(clientPath));
    
    // For any route that doesn't start with /api, serve the React app
    // This allows React Router to handle client-side routing
    app.get(/^(?!\/api).*/, (req, res) => {
        res.sendFile(path_1_default.join(clientPath, "index.html"));
    });
}

// ========== ERROR HANDLING ==========
// This middleware catches all errors thrown in async route handlers
// Must be last middleware to catch errors from above routes
app.use(errorHandler_middleware_1.errorHandler);


// ========== START SERVER ==========
server.listen(env_config_1.Env.PORT, async () => {
    // Connect to PostgreSQL database before accepting requests
    await (0, database_config_1_default)();

    
    console.log(`Server running on port ${env_config_1.Env.PORT} in ${env_config_1.Env.NODE_ENV} mode`);
    // Show the local network IP so you can access from mobile devices
    console.log(`Access from mobile: http://10.165.98.253:${env_config_1.Env.PORT}`);
});


