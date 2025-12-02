import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function DebugPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">🔍 Auth Debug Page</h1>

      <div className="space-y-6">
        {/* Session Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">Session Status</h2>
          {session ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">✅ Logged In</p>
              <div className="mt-4 rounded bg-gray-50 p-4">
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-red-600 font-semibold">❌ Not Logged In</p>
          )}
        </div>

        {/* Environment Check */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">Environment Variables</h2>
          <table className="w-full text-left text-sm">
            <tbody className="space-y-2">
              <tr className="border-b">
                <td className="py-2 font-medium">NEXTAUTH_URL</td>
                <td className="py-2">{process.env.NEXTAUTH_URL || "❌ NOT SET"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">NEXTAUTH_SECRET</td>
                <td className="py-2">{process.env.NEXTAUTH_SECRET ? "✅ SET" : "❌ NOT SET"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">GOOGLE_CLIENT_ID</td>
                <td className="py-2">
                  {process.env.GOOGLE_CLIENT_ID 
                    ? `✅ ${process.env.GOOGLE_CLIENT_ID.slice(0, 20)}...` 
                    : "❌ NOT SET"}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">GOOGLE_CLIENT_SECRET</td>
                <td className="py-2">{process.env.GOOGLE_CLIENT_SECRET ? "✅ SET" : "❌ NOT SET"}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">DATABASE_URL</td>
                <td className="py-2">{process.env.DATABASE_URL ? "✅ SET" : "❌ NOT SET"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Callback URL */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">Expected Callback URL</h2>
          <p className="mb-2 text-sm text-gray-600">
            Add this URL to your Google Cloud Console OAuth 2.0 Client:
          </p>
          <div className="rounded bg-gray-100 p-3">
            <code className="text-sm">
              {process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google
            </code>
          </div>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-blue-600 underline text-sm"
          >
            Open Google Cloud Console →
          </a>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">Quick Actions</h2>
          <div className="flex gap-3">
            <a
              href="/api/auth/signin"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Sign In
            </a>
            <a
              href="/api/auth/signout"
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              Sign Out
            </a>
            <a
              href="/api/auth/providers"
              target="_blank"
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              View Providers
            </a>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-3 text-xl font-semibold">🛠️ Troubleshooting</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              Verify all environment variables above show ✅
            </li>
            <li>
              Add the callback URL above to your{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                className="text-blue-600 underline"
              >
                Google Cloud Console
              </a>
            </li>
            <li>
              Wait 5-10 minutes for Google changes to propagate
            </li>
            <li>
              Clear browser cookies for localhost:3000
            </li>
            <li>
              Try signing in again (use incognito mode if issues persist)
            </li>
            <li>
              Check terminal logs where <code>npm run dev</code> is running for errors
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
