import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Players from "./pages/Players";
import PoolDetail from "./pages/PoolDetail";
import TeamCreate from "./pages/TeamCreate";
import TeamBuilder from "./pages/TeamBuilder";
import TeamResult from "./pages/TeamResult";
import Records from "./pages/Records";
import RecordDetail from "./pages/RecordDetail";
import Ranking from "./pages/Ranking";
import PoolRanking from "./pages/PoolRanking";
import { AuthProvider } from "./contexts/AuthContext";
import LogoutMessage from "./pages/LogoutMessage";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-primary dark:bg-secondary text-text-primary dark:text-text-secondary transition-colors duration-300">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/players" element={<Players />} />
              <Route path="/pool/:poolId" element={<PoolDetail />} />
              <Route path="/team-create" element={<TeamCreate />} />
              <Route path="/team-builder/:poolId" element={<TeamBuilder />} />
              <Route path="/team-result" element={<TeamResult />} />
              <Route path="/records" element={<Records />} />
              <Route path="/records/:gameId" element={<RecordDetail />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/ranking/:poolId" element={<PoolRanking />} />
              <Route path="/logout" element={<LogoutMessage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
