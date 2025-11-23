import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";
import OnboardingSearch from "../components/OnboardingSearch";
import OnboardingSearchResult from "../components/OnboardingSearchResult";

interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Google Maps API 로드 (검색 기능을 위해 필요)
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 로드되어 있는지 확인
        if (typeof google === "object" && google.maps && google.maps.places) {
          // console.log("Google Maps API 이미 로드됨");
          resolve();
          return;
        }

        // 기존 스크립트가 있는지 확인
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          // 스크립트가 있으면 로드 완료를 기다림
          const checkInterval = setInterval(() => {
            if (
              typeof google === "object" &&
              google.maps &&
              google.maps.places
            ) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          // 최대 10초 대기
          setTimeout(() => {
            clearInterval(checkInterval);
            if (
              typeof google === "object" &&
              google.maps &&
              google.maps.places
            ) {
              resolve();
            } else {
              reject(new Error("Google Maps API 로드 시간 초과"));
            }
          }, 10000);
          return;
        }

        const script = document.createElement("script");
        const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en&region=US`;
        script.async = true;
        script.onerror = () => {
          // console.error("Google Maps 스크립트 로드 실패");
          reject(new Error("Google Maps 스크립트 로드 실패"));
        };
        script.onload = () => {
          // console.log("Google Maps API 로드 완료");
          resolve();
        };
        document.head.appendChild(script);
      });
    };

    loadGoogleMapsScript().catch((_error) => {
      // console.error("Google Maps API 로드 실패:", _error);
    });
  }, []);

  const handleFindNearby = () => {
    navigate("/main", { state: { activeTab: "near-me" } });
  };

  const handleWriteReviews = () => {
    setShowSearch(true);
  };

  const handleBack = () => {
    if (showSearchResult) {
      setShowSearchResult(false);
      setSearchResults([]);
      setSearchQuery("");
    } else {
      setShowSearch(false);
    }
  };

  const handleSearchComplete = (results: SearchResult[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setShowSearchResult(true);
  };

  const handlePlaceSelect = (_placeId: string) => {
    // TODO: Handle place selection
    // console.log("Place selected:", _placeId);
  };

  return (
    <div className="relative w-full bg-gray-100 min-h-screen">
      <Header
        leftElement={
          <div className="flex items-center gap-[2px]">
            <img
              src="/icons/icon-filled.svg"
              alt="Logo"
              className="h-[30.75px] w-auto"
            />
            <img
              src="/icons/favoreat.svg"
              alt="Favoreat"
              className="h-[14px] w-auto"
            />
          </div>
        }
        rightElement={
          <ConnectWalletButton onOpenUserMenu={() => setIsUserMenuOpen(true)} />
        }
      />

      <div
        className={`mt-12 w-full px-6 flex flex-col items-center bg-gray-100 py-10 ${
          showSearch || showSearchResult ? "gap-4" : "justify-between"
        }`}
      >
        {!showSearch && !showSearchResult ? (
          // First design - Welcome screen
          <>
            <div className="bg-white rounded-[16px] p-6 flex flex-col items-center justify-between h-[424px] w-full">
              <p className="text-[16px] font-semibold leading-[24px] text-gray-700 text-center tracking-[0.16px]">
                Hello! Welcome to Favoreat.
              </p>

              <div className="flex flex-col gap-2 items-center justify-center text-[14px] text-center w-full">
                <p className="leading-[20px] text-gray-600">
                  Are you looking for good restaurants nearby?
                </p>
                <p className="leading-[20px] text-gray-400">or</p>
                <div className="leading-[20px] text-gray-600 whitespace-nowrap">
                  <p className="mb-0">
                    do you want to write great restaurant reviews
                  </p>
                  <p>and climb the leaderboard?</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-start w-full">
                <button
                  onClick={handleFindNearby}
                  className="bg-gray-900 flex gap-1 items-center justify-center px-4 py-3 rounded-[16px] w-full"
                >
                  <p className="text-[16px] font-bold leading-[24px] text-gray-50 tracking-[0.16px]">
                    Find nearby
                  </p>
                </button>
                <button
                  onClick={handleWriteReviews}
                  className="bg-redorange-500 flex gap-1 items-center justify-center px-4 py-3 rounded-[16px] w-full"
                >
                  <p className="text-[16px] font-bold leading-[24px] text-gray-50 tracking-[0.16px]">
                    Write reviews
                  </p>
                </button>
              </div>
            </div>

            <div className="relative mt-10 w-[240px] h-[240px]">
              <img
                src="/icons/character.svg"
                alt="Character"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              />
            </div>
          </>
        ) : showSearchResult ? (
          // Third design - Search result screen
          <OnboardingSearchResult
            results={searchResults}
            searchQuery={searchQuery}
            onBack={handleBack}
            onSelect={handlePlaceSelect}
          />
        ) : (
          // Second design - Search screen
          <OnboardingSearch
            onBack={handleBack}
            onSearchComplete={handleSearchComplete}
          />
        )}
      </div>

      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default OnboardingPage;
