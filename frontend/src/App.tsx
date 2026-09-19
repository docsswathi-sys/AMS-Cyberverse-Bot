import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";

import CommandCenter from "./pages/CommandCenter";
import CTFArena from "./pages/CTFArena";
import Challenge from "./pages/Challenge";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Quizzes from "./pages/Quizzes";
import Quiz from "./pages/Quiz";

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Command Center */}
          <Route
            path="/"
            element={<CommandCenter />}
          />

          {/* CTF */}
          <Route
            path="/ctf"
            element={<CTFArena />}
          />

          <Route
            path="/ctf/:id"
            element={<Challenge />}
          />

          {/* Events */}
          <Route
            path="/events"
            element={<Events />}
          />

          <Route
            path="/events/:id"
            element={<EventDetails />}
          />

          {/* Quiz Arena */}
          <Route
            path="/quizzes"
            element={<Quizzes />}
          />

          {/* Individual Quiz */}
          <Route
            path="/quiz/:id"
            element={<Quiz />}
          />

          {/* Leaderboard */}
          <Route
            path="/leaderboard"
            element={<Leaderboard />}
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}

export default App;