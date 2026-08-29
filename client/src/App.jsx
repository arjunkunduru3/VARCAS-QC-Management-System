import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import WorkerDashboard from "./pages/WorkerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import QualityChecklist from "./components/QualityChecklist";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route path="/worker" element={<WorkerDashboard />} />

      <Route path="/worker/checklist" element={<QualityChecklist />} />

      <Route path="/admin" element={<AdminDashboard />} />

      <Route path="/supervisor" element={<SupervisorDashboard />} />
    </Routes>
  );
}

export default App;
