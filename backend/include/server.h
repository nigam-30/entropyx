#ifndef SERVER_H
#define SERVER_H

#include <winsock2.h>
#include <ws2tcpip.h>
#include <string>
#include <map>
#include <functional>
#include <thread>
#include <vector>
#include <iostream>
#include <sstream>

struct HttpRequest {
    std::string method;
    std::string path;
    std::string body;
    std::map<std::string, std::string> headers;
};

struct HttpResponse {
    int status = 200;
    std::string contentType = "application/json";
    std::string body = "{}";
};

using RouteHandler = std::function<HttpResponse(const HttpRequest&)>;

class SimpleHttpServer {
public:
    SimpleHttpServer(int port = 8080) : port(port), serverSocket(INVALID_SOCKET), running(false) {}
    ~SimpleHttpServer() { stop(); }

    void addRoute(const std::string& method, const std::string& path, RouteHandler handler) {
        routes[method + " " + path] = handler;
    }

    bool start() {
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            std::cerr << "[Error] WSAStartup failed.\n";
            return false;
        }

        serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (serverSocket == INVALID_SOCKET) {
            std::cerr << "[Error] Socket creation failed.\n";
            WSACleanup();
            return false;
        }

        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in serverAddr;
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            std::cerr << "[Error] Bind failed on port " << port << ".\n";
            closesocket(serverSocket);
            WSACleanup();
            return false;
        }

        if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
            std::cerr << "[Error] Listen failed.\n";
            closesocket(serverSocket);
            WSACleanup();
            return false;
        }

        running = true;
        std::cout << "[Server] C++ REST Microservice running at http://localhost:" << port << "\n";

        while (running) {
            sockaddr_in clientAddr;
            int clientAddrLen = sizeof(clientAddr);
            SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrLen);
            if (clientSocket == INVALID_SOCKET) {
                if (!running) break;
                continue;
            }

            // Dispatch to worker thread for high concurrency
            std::thread([this, clientSocket]() {
                this->handleClient(clientSocket);
            }).detach();
        }

        return true;
    }

    void stop() {
        if (running) {
            running = false;
            if (serverSocket != INVALID_SOCKET) {
                closesocket(serverSocket);
                serverSocket = INVALID_SOCKET;
            }
            WSACleanup();
        }
    }

private:
    int port;
    SOCKET serverSocket;
    bool running;
    std::map<std::string, RouteHandler> routes;

    void handleClient(SOCKET clientSocket) {
        char buffer[8192];
        int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
        if (bytesReceived <= 0) {
            closesocket(clientSocket);
            return;
        }
        buffer[bytesReceived] = '\0';

        std::string raw(buffer, bytesReceived);
        HttpRequest req = parseRequest(raw);

        // Pre-flight CORS request
        if (req.method == "OPTIONS") {
            sendResponse(clientSocket, 204, "text/plain", "");
            closesocket(clientSocket);
            return;
        }

        std::string routeKey = req.method + " " + req.path;
        HttpResponse res;

        if (routes.find(routeKey) != routes.end()) {
            try {
                res = routes[routeKey](req);
            } catch (const std::exception& e) {
                res.status = 500;
                res.body = std::string("{\"error\":\"") + e.what() + "\"}";
            }
        } else {
            res.status = 404;
            res.body = "{\"error\":\"Endpoint not found\"}";
        }

        sendResponse(clientSocket, res.status, res.contentType, res.body);
        closesocket(clientSocket);
    }

    HttpRequest parseRequest(const std::string& raw) {
        HttpRequest req;
        std::istringstream stream(raw);
        std::string line;

        if (std::getline(stream, line)) {
            while (!line.empty() && (line.back() == '\r' || line.back() == ' ')) line.pop_back();
            std::istringstream lineStream(line);
            lineStream >> req.method >> req.path;
        }

        // Headers
        while (std::getline(stream, line)) {
            while (!line.empty() && (line.back() == '\r' || line.back() == ' ')) line.pop_back();
            if (line.empty()) break; // Header-body separator

            size_t colon = line.find(':');
            if (colon != std::string::npos) {
                std::string key = line.substr(0, colon);
                std::string val = line.substr(colon + 1);
                while (!val.empty() && val.front() == ' ') val.erase(val.begin());
                req.headers[key] = val;
            }
        }

        // Body
        std::string bodyRest;
        char c;
        while (stream.get(c)) {
            bodyRest += c;
        }
        req.body = bodyRest;

        return req;
    }

    void sendResponse(SOCKET clientSocket, int status, const std::string& contentType, const std::string& body) {
        std::string statusText = "OK";
        if (status == 204) statusText = "No Content";
        else if (status == 400) statusText = "Bad Request";
        else if (status == 404) statusText = "Not Found";
        else if (status == 500) statusText = "Internal Server Error";

        std::ostringstream ss;
        ss << "HTTP/1.1 " << status << " " << statusText << "\r\n";
        ss << "Content-Type: " << contentType << "\r\n";
        ss << "Content-Length: " << body.size() << "\r\n";
        ss << "Access-Control-Allow-Origin: *\r\n";
        ss << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
        ss << "Access-Control-Allow-Headers: Content-Type, Authorization\r\n";
        ss << "Connection: close\r\n\r\n";
        ss << body;

        std::string responseStr = ss.str();
        send(clientSocket, responseStr.data(), static_cast<int>(responseStr.size()), 0);
    }
};

#endif // SERVER_H
