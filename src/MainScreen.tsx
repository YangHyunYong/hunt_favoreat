import React, { useEffect, useRef, useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";

declare global {
  interface Window {
    google: any;
  }
}

interface MapViewProps {
  onLocationResolved: (city: string, town: string) => void;
  onPlaceSelected?: (details: PlaceDetailsResult) => void;
}

interface PlaceDetailsResult {
  displayName: string;
  photos: string[];
  rating?: number;
  userRatingCount?: number;
}

// --- 이미지 프리로드 유틸 ---
async function preloadImages(urls: string[]): Promise<void> {
  if (!urls || urls.length === 0) return;
  await Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // 실패해도 진행
          img.src = url;
        })
    )
  );
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-") // 영문, 숫자, 한글 제외한 문자 → "-"
    .replace(/^-+|-+$/g, ""); // 앞뒤 하이픈 제거
}

// Fetch Google Place details by placeId and return typed data (sheet 용 최소 필드만 반환).
export async function fetchPlaceDetails(
  placeId: string
): Promise<PlaceDetailsResult> {
  if (!window.google || !window.google.maps) {
    throw new Error("Google Maps JS SDK is not loaded yet.");
  }

  const { Place } = (await window.google.maps.importLibrary("places")) as any;

  const place = new Place({ id: placeId });
  await place.fetchFields({
    fields: ["displayName", "photos", "rating", "userRatingCount"],
  });

  const photos: string[] =
    place.photos?.map((photo: any) => photo.getURI({ maxHeight: 400 })) || [];

  return {
    displayName: place.displayName || "",
    photos,
    rating: place.rating || undefined,
    userRatingCount: place.userRatingCount || undefined,
  };
}

function MapView({ onLocationResolved, onPlaceSelected }: MapViewProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  // 지도/마커를 보존하는 ref (재초기화 방지)
  const gMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 최신 콜백 보존
  const onLocationResolvedRef = useRef(onLocationResolved);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  useEffect(() => {
    onLocationResolvedRef.current = onLocationResolved;
  }, [onLocationResolved]);
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  // 빠른 연속 클릭 대비 최신 요청만 반영하기 위한 토큰
  const latestReqId = useRef(0);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (typeof window.google === "object" && window.google.maps) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
        script.async = true;
        script.onerror = () =>
          reject(new Error("Google Maps 스크립트 로드 실패"));
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    async function initMapOnce() {
      await loadGoogleMapsScript();

      // 기본 위치 (서울 시청)
      let position = { lat: 37.5665, lng: 126.978 };

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject)
          );
          position = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
          console.warn("위치 정보를 가져오지 못했습니다:", e);
        }
      }

      const { Map } = (await window.google.maps.importLibrary("maps")) as any;
      const { AdvancedMarkerElement, PinElement } =
        (await window.google.maps.importLibrary("marker")) as any;

      // mapId는 API KEY 그대로 사용 (요청사항 유지)
      const gMap = new Map(mapDivRef.current as HTMLElement, {
        center: position,
        zoom: 18,
        mapId: import.meta.env.VITE_GOOGLE_MAP_API_KEY,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        cameraControl: false,
        gestureHandling: "greedy",
      });
      gMapRef.current = gMap;

      const pin = new PinElement({
        background: "#F97316",
        borderColor: "#FFFFFF",
        glyphColor: "#FFFFFF",
      });

      // 최초 1회 현재 위치에 마커 생성
      markerRef.current = new AdvancedMarkerElement({
        map: gMap,
        position,
        title: "현재 위치",
        content: pin.element,
      });

      // 지도 클릭: 마커만 이동(지도 중심은 그대로 유지), 상세 조회 + 이미지 프리로드 후 부모 콜백
      gMap.addListener("click", async (e: any) => {
        if (!e.placeId) return;
        e.stop();

        const reqId = ++latestReqId.current;
        try {
          const details = await fetchPlaceDetails(e.placeId);

          // 먼저 프리로드
          if (details.photos?.length) {
            await preloadImages(details.photos);
          }

          // 최신 클릭이 아니면 무시 (레이스 컨디션 방지)
          if (reqId !== latestReqId.current) return;

          // 마커 위치 이동 (지도 중심은 유지)
          markerRef.current?.setPosition?.(e.latLng);

          // 부모로 전달 (이미지 캐시에 올라간 상태)
          onPlaceSelectedRef.current?.(details);
        } catch (err) {
          console.error(err);
        }
      });

      // 주소 -> 도시/동네 정보 콜백
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const components = results[0].address_components;
          let city = "",
            town = "";
          components.forEach((c: any) => {
            if (
              c.types.includes("locality") ||
              c.types.includes("administrative_area_level_2")
            ) {
              city = c.long_name;
            }
            if (
              c.types.includes("sublocality") ||
              c.types.includes("neighborhood") ||
              c.types.includes("sublocality_level_1")
            ) {
              town = c.long_name;
            }
          });
          if (!town) town = city;
          onLocationResolvedRef.current(city, town);
        }
      });
    }

    // 최초 1회만
    initMapOnce();
  }, []);

  return (
    <div ref={mapDivRef} className="w-full h-[100svh] md:h-screen relative" />
  );
}

const MainScreen: React.FC = () => {
  const [cityName, setCityName] = useState("");
  const [townName, setTownName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailsResult | null>(
    null
  );

  // 🔹 Map/Grid 활성 상태 관리
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");

  const navigate = useNavigate();

  // Bottom sheet 제어
  const sheetHostRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<any>(null);
  const [showContent, setShowContent] = useState(false);

  // 시트 높이 관찰(자동 라우팅만 유지)
  useEffect(() => {
    if (!sheetHostRef.current) return;

    const container =
      (sheetHostRef.current.querySelector(".rsbs-container") as HTMLElement) ||
      (sheetHostRef.current.querySelector(
        '[class*="rsbs-container"]'
      ) as HTMLElement) ||
      (sheetHostRef.current.querySelector(".rsbs-sheet") as HTMLElement);

    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      const h = entries[0].contentRect.height;
      const ratio = h / window.innerHeight;

      // showContent는 selectedPlace에서 제어하므로 여기서 토글하지 않음
      if (ratio >= 0.98) {
        navigate("/store/123");
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [navigate]);

  // 장소 선택 시: 콘텐츠 표시 + 중간 스냅(0.42 높이)
  useEffect(() => {
    if (!selectedPlace) return;

    setShowContent(true);

    const snapMiddle = () => {
      const targetPx = Math.round(window.innerHeight * 0.42);
      if (sheetRef.current?.snapTo) {
        try {
          sheetRef.current.snapTo(targetPx); // px 우선
        } catch {
          try {
            sheetRef.current.snapTo(1); // index 폴백
          } catch {}
        }
      }
    };

    requestAnimationFrame(() => setTimeout(snapMiddle, 0));
  }, [selectedPlace]);

  // 별점 UI (가득/빈 별 표현)
  const Stars = ({ rating = 0 }: { rating?: number }) => {
    const full = Math.round(Math.min(5, Math.max(0, rating)));
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={i < full ? "text-orange-500 w-4" : "text-gray-300 w-4"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const heroTitle =
    selectedPlace?.displayName || "Burger Boy and Burger girl are dancing now";
  const img1 = selectedPlace?.photos?.[0] || "/sample/burger.jpg";
  const img2 = selectedPlace?.photos?.[1] || "/sample/bibimbap.jpg";
  const rating = selectedPlace?.rating ?? 4;
  const ratingCount = selectedPlace?.userRatingCount ?? 12;

  return (
    <div>
      <Header
        rightElement={
          <button className="p-2 h-15 bg-white">
            <img src="/icons/dots-vertical.svg" className="w-8 h-8" />
          </button>
        }
      />
      <div className="h-screen overflow-visible bg-white flex flex-col font-sans relative">
        {/* 지도 영역 */}
        <MapView
          onLocationResolved={(city, town) => {
            setCityName(city);
            setTownName(town);
          }}
          onPlaceSelected={(details) => {
            setSelectedPlace(details); // 프리로드 완료 후 전달됨
          }}
        />

        {/* 상단 */}
        <div className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto">
            <div className="text-title-600 text-gray-800 bg-white inline-block px-2 py-1 rounded-lg">
              {cityName || "City Name"}
            </div>
            <div className="text-display-700 text-gray-800 mt-4 px-2">
              {townName || "Town Name"}
            </div>
          </div>

          {/* 🔹 우측 액션 버튼들: 각진 12px + 활성/비활성 배경 */}
          <div className="flex justify-center items-center pointer-events-auto mt-24 gap-2">
            {/* Search: 중립 버튼 */}
            <button
              className="flex justify-center items-center w-10 h-10 p-2 bg-white rounded-[16px] shadow-[0_0_4px_0_rgba(0,0,0,0.24)]"
              aria-label="Search"
            >
              <img
                src="/icons/search-lg.svg"
                alt="Search"
                className="w-4 h-4 opacity-80"
              />
            </button>

            {/* Map: 활성/비활성 */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-[16px]">
              {/* Map */}
              <button
                data-active={viewMode === "map"}
                onClick={() => setViewMode("map")}
                className="
                flex justify-center items-center w-10 h-10
      p-2 rounded-[16px] data-[active=true]:shadow-[0_0_4px_0_rgba(0,0,0,0.24)]
      data-[active=true]:bg-white data-[active=false]:bg-gray-100 
      transition-colors
    "
                aria-pressed={viewMode === "map"}
                aria-label="Map"
              >
                <img
                  src="/icons/map-01.svg"
                  alt="Map"
                  className="w-4 h-4 opacity-60 data-[active=true]:opacity-100 transition-opacity"
                />
              </button>

              {/* Grid */}
              <button
                data-active={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className="
                flex justify-center items-center w-10 h-10
      p-2 rounded-[16px] data-[active=true]:shadow-[0_0_4px_0_rgba(0,0,0,0.24)]
      data-[active=true]:bg-white data-[active=false]:bg-gray-100
      transition-colors
    "
                aria-pressed={viewMode === "grid"}
                aria-label="Grid"
              >
                <img
                  src="/icons/grid-01.svg"
                  alt="Grid"
                  className="w-4 h-4 opacity-60 data-[active=true]:opacity-100 transition-opacity"
                />
              </button>
            </div>
          </div>
        </div>

        {/* FAB */}
        {!showContent && (
          <button
            className="absolute bottom-24 right-4 z-10 p-4 bg-orange-400 hover:bg-orange-500 rounded-[24px] flex items-center justify-center "
            aria-label="Add"
          >
            <img
              src="/icons/plus.svg"
              alt="Add"
              className="w-6 h-6 text-white"
            />
          </button>
        )}

        {/* Bottom Sheet (0.075 / 0.42 / 1.0 단계) */}
        <div ref={sheetHostRef}>
          <BottomSheet
            ref={sheetRef}
            open={true}
            blocking={false}
            snapPoints={({ maxHeight }) => [0.08 * maxHeight, 0.42 * maxHeight]}
            defaultSnap={({ snapPoints }) => snapPoints[0]}
            onDismiss={() => {}}
          >
            {!showContent ? (
              // 0.42 미만: 프리뷰
              <div className="p-3">
                <p className="text-center text-sm text-gray-500">
                  지도를 탭해 주변 가게를 선택하세요
                </p>
              </div>
            ) : (
              // 0.42 이상: 이미지 카드/별점/버튼
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-place-title leading-snug flex-1 min-w-0 line-clamp-2">
                    {heroTitle}
                  </div>
                  <div className="flex gap-2 flex-none shrink-0">
                    <button className="p-3 bg-gray-100 rounded-[16px]">
                      <img src="/icons/share-07.svg" className="w-3 h-3" />
                    </button>
                    <button className="p-3 bg-gray-100 rounded-[16px]">
                      <img src="/icons/bookmark.svg" className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 이미지 2개 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <img
                    src={img1}
                    decoding="async"
                    loading="eager"
                    className="w-full h-36 object-cover rounded-2xl"
                  />
                  <img
                    src={img2}
                    decoding="async"
                    loading="eager"
                    className="w-full h-36 object-cover rounded-2xl"
                  />
                </div>

                {/* 별점 + 리뷰수 + 버튼 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stars rating={rating} />
                    <span className="text-rating-count">({ratingCount})</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!selectedPlace) return;
                      const slug = toSlug(selectedPlace.displayName || "store");
                      navigate(`/store/${slug}`, { state: selectedPlace });
                    }}
                    className="px-4 py-2.5 bg-black text-white rounded-xl font-semibold flex items-center gap-2"
                  >
                    <span className="text-button-content">View Details</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </BottomSheet>
        </div>
      </div>
    </div>
  );
};

export default MainScreen;
