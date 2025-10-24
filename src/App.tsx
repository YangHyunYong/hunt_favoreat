import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import MainScreen from "./MainScreen";
import StoreDetailScreen from "./StoreDetailScreen";
import StoreListScreen from "./StoreListScreen";
import BookmarkScreen from "./BookmarkScreen";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<MainScreen />} />
      <Route path="/stores" element={<StoreListScreen />} />
      <Route path="/store/:id" element={<StoreDetailScreen />} />
      <Route path="/bookmarks" element={<BookmarkScreen />} />
    </Routes>
  );
}

export default App;
