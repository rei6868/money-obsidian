export default function Custom404() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>404 - Money API Headless</title>
        <style>{`
          body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .container { text-align: center; max-width: 600px; padding: 2rem; }
          h1 { font-size: 3rem; margin: 0 0 0.5rem; color: #ef4444; }
          h2 { font-size: 1.5rem; margin: 0 0 1rem; color: #fff; }
          p { line-height: 1.6; color: #a0a0a0; margin: 0.5rem 0; }
          .status { display: inline-block; padding: 0.5rem 1rem; background: #1a4d2e; color: #4ade80; border-radius: 4px; margin: 1.5rem 0; font-weight: 500; }
          a { color: #60a5fa; text-decoration: none; }
          a:hover { text-decoration: underline; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>404</h1>
          <h2>Route Not Found</h2>
          <div className="status">🟢 Service Online</div>
          <p>This is a headless API server with no UI frontend.</p>
          <p>Valid API endpoints are available at <code>/api/*</code></p>
          <p><a href="/">← Back to API Info</a></p>
        </div>
      </body>
    </html>
  );
}
