import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Money API Headless</title>
      </Head>
      <style jsx global>{`
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .container { text-align: center; max-width: 600px; padding: 2rem; }
        h1 { font-size: 2rem; margin: 0 0 1rem; color: #fff; }
        p { line-height: 1.6; color: #a0a0a0; margin: 0.5rem 0; }
        .status { display: inline-block; padding: 0.5rem 1rem; background: #1a4d2e; color: #4ade80; border-radius: 4px; margin: 1.5rem 0; font-weight: 500; }
        .endpoints { text-align: left; background: #1a1a1a; padding: 1rem; border-radius: 8px; margin: 1.5rem 0; }
        .endpoints code { color: #60a5fa; }
      `}</style>
      <div className="container">
        <h1>Money API Headless</h1>
        <div className="status">🟢 API Online</div>
        <p>No UI frontend, API only.</p>
        <div className="endpoints">
          <p><strong>Available Endpoints:</strong></p>
          <p><code>/api/accounts</code></p>
          <p><code>/api/categories</code></p>
          <p><code>/api/people</code></p>
          <p><code>/api/shops</code></p>
          <p><code>/api/transactions</code></p>
        </div>
        <p>See API docs or contact admin.</p>
      </div>
    </>
  );
}
