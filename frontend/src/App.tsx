import Quiz from "./pages/Quiz";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";

import CommandCenter from "./pages/CommandCenter";
import CTFArena from "./pages/CTFArena";
import Challenge from "./pages/Challenge";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/ctf" element={<CTFArena />} />
          <Route path="/ctf/:id" element={<Challenge />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/quiz/:id" element={<Quiz />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;