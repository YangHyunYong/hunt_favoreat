import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import StoreDetailPage from "./pages/StoreDetailPage";
import StoreListPage from "./pages/StoreListPage";
import BookmarkPage from "./pages/BookmarkPage";
import TempPage from "./pages/TempPage";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <Routes>
      <Route path="/temp" element={<MainPage />} />
      <Route path="/intro" element={<LandingPage />} />
      <Route path="/stores" element={<StoreListPage />} />
      <Route path="/store/:id" element={<StoreDetailPage />} />
      <Route path="/bookmarks" element={<BookmarkPage />} />
      <Route path="/" element={<TempPage />} />
    </Routes>
  );
}

export default App;
