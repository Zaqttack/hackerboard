import { Route, Routes } from "react-router-dom";
import { Admin } from "./routes/Admin.tsx";
import { Board } from "./routes/Board.tsx";
import { Join } from "./routes/Join.tsx";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Board />} />
      <Route path="/join" element={<Join />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Board />} />
    </Routes>
  );
}
