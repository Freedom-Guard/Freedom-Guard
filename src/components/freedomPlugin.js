const http = require("http")
const url = require("url")

class FreedomPlugin {
    setupFP(link) {
        if (link === "") {
            if (typeof window !== "undefined" && typeof window.showMessageUI === "function") {
                window.LogLOG("Freedom Plugin server is starting on port 8087...")
            }

            const server = http.createServer((req, res) => {
                if (req.method === "GET") {
                    const query = url.parse(req.url, true).query
                    const queryStr = JSON.stringify(query)
                    this.logRequest(req, queryStr)
                    this.processData(req)
                    res.writeHead(200, { "Content-Type": "application/json" })
                    res.end(JSON.stringify({ status: "ok" }))
                } else {
                    res.writeHead(405, { "Content-Type": "application/json" })
                    res.end(JSON.stringify({ error: "Method not allowed" }))
                }
            })

            server.listen(8087, "127.0.0.1", () => {
                this._server = server
                if (typeof window !== "undefined" && typeof window.showMessageUI === "function") {
                    window.showMessageUI("Freedom Plugin server is running on port 8087.")
                }
            })
        } else if (link === "/kill") {
            this.killServer()
        }
    }

    killServer() {
        if (this._server) {
            this._server.close(() => {
                if (typeof window !== "undefined" && typeof window.showMessageUI === "function") {
                    window.showMessageUI("FreedomPlugin server has been stopped.")
                }
            })
            this._server = null
        }
    }

    logRequest(req, body) {
        const logData = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: body
        }
        if (typeof window !== "undefined" && typeof window.showMessageUI === "function") {
            window.LogLOG("Request received:\n" + JSON.stringify(logData, null, 2))
        }
    }

    processData(req) {
        try {
            if (typeof window !== "undefined" && typeof window.FP === "function") {
                window.FP(req.url)
            }
        } catch (e) { }
    }
}

module.exports = {
    FreedomPlugin
}
