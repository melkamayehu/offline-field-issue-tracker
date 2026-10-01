import { useEffect } from "react";
import ReportForm from "./components/ReportForm";
import ReportList from "./components/ReportList";
import { syncPendingReports } from "./sync/syncManager";

function App() {
  useEffect(() => {
    syncPendingReports();

    function handleOnline() {
      console.log("Internet connection restored. Starting sync...");
      syncPendingReports();
    }

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <div>
      <h1>Offline Field Issue Tracker</h1>

      <ReportForm />

      <ReportList />
    </div>
  );
}

export default App;