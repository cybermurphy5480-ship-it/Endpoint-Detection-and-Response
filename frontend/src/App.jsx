import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(fetchLogs, 3000);

    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/logs");
      setLogs(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredLogs = logs.filter((log) =>
    JSON.stringify(log).toLowerCase().includes(search.toLowerCase())
  );

  const totalLogs = logs.length;

  const suspiciousLogs = logs.filter((log) =>
    log.message?.toLowerCase().includes("powershell") ||
    log.message?.toLowerCase().includes("cmd") ||
    log.message?.toLowerCase().includes("encoded") ||
    log.message?.toLowerCase().includes("-enc")
  ).length;

  const uniqueEndpoints = [...new Set(logs.map((l) => l.hostname))].length;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">

      <div className="bg-gray-900 text-white px-8 py-5 shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            Centralized Incident Response Dashboard
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            Real-Time Endpoint Monitoring & Log Collection
          </p>
        </div>

        <div className="bg-green-500 px-4 py-2 rounded-xl font-semibold shadow">
          LIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <h2 className="text-gray-500 text-sm">TOTAL LOGS</h2>
          <p className="text-4xl font-bold mt-2">{totalLogs}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
          <h2 className="text-gray-500 text-sm">SUSPICIOUS EVENTS</h2>
          <p className="text-4xl font-bold mt-2">{suspiciousLogs}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <h2 className="text-gray-500 text-sm">ACTIVE ENDPOINTS</h2>
          <p className="text-4xl font-bold mt-2">{uniqueEndpoints}</p>
        </div>
      </div>

      <div className="px-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Live Event Logs</h2>

            <input
              type="text"
              placeholder="Search logs..."
              className="border rounded-lg px-4 py-2 w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-auto max-h-[600px] rounded-lg border">
            <table className="min-w-full text-sm text-left">

              <thead className="bg-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Hostname</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.map((log) => {

                  const suspicious =
                    log.message?.toLowerCase().includes("powershell") ||
                    log.message?.toLowerCase().includes("-enc") ||
                    log.message?.toLowerCase().includes("cmd");

                  return (
                    <tr
                      key={log.id}
                      className={`border-b hover:bg-gray-100 ${
                        suspicious ? "bg-red-50" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3">{log.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {log.hostname}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {log.event_code}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[600px] break-words">
                        {log.message}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow">
                          BLOCK
                        </button>

                        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow">
                          ALLOW
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

