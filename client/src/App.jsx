import ReportForm from "./components/ReportForm";
import ReportList from "./components/ReportList";

function App() {
  return (
    <div>
      <h1>Offline Field Issue Tracker</h1>

      <ReportForm />

      <ReportList />
    </div>
  );
}

export default App;