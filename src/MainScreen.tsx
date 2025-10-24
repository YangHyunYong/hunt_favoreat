import React, { useEffect, useRef, useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header";
import ConnectWalletButton from "./components/ConnectWalletButton";
import UserMenu from "./components/UserMenu";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  ensurePlaceExists,
} from "./supabaseClient";

// Google Places API placeId를 UUID로 변환하는 함수
async function placeIdToUUID(placeId: string): Promise<string> {
  try {
    // placeId를 해시하여 UUID 형식으로 변환
    const crypto = window.crypto || (window as any).msCrypto;
    const encoder = new TextEncoder();
    const data = encoder.encode(placeId);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // UUID 형식으로 변환 (8-4-4-4-12)
    return [
      hashHex.substring(0, 8),
      hashHex.substring(8, 12),
      hashHex.substring(12, 16),
      hashHex.substring(16, 20),
      hashHex.substring(20, 32),
    ].join("-");
  } catch (error) {
    // 폴백: 간단한 해시 생성
    let hash = 0;
    for (let i = 0; i < placeId.length; i++) {
      const char = placeId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 12)}`;
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
  placeId?: string;
  address?: string; // 주소 정보
  latitude?: number; // 위도
  longitude?: number; // 경도
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
  if (!google || !google.maps) {
    throw new Error("Google Maps JS SDK is not loaded yet.");
  }

  const { Place } = (await google.maps.importLibrary("places")) as any;

  const place = new Place({ id: placeId });
  await place.fetchFields({
    fields: [
      "displayName",
      "photos",
      "rating",
      "userRatingCount",
      "location",
      "formattedAddress",
    ],
  });

  const photos: string[] =
    place.photos?.map((photo: any) => photo.getURI({ maxHeight: 400 })) || [];

  return {
    displayName: place.displayName || "",
    photos,
    rating: place.rating || undefined,
    userRatingCount: place.userRatingCount || undefined,
    placeId: placeId,
    address: place.formattedAddress || undefined,
    latitude: place.location?.lat() || undefined,
    longitude: place.location?.lng() || undefined,
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
        if (typeof google === "object" && google.maps) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
        // ✅ places 추가 (검색/자동완성/Place Details 위해 필수)
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&language=en&region=US`;
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

      const { Map } = (await google.maps.importLibrary("maps")) as any;
      const { AdvancedMarkerElement, PinElement } =
        (await google.maps.importLibrary("marker")) as any;

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

      // 🔸 검색 선택(메인에서 발생) → 지도 이동을 위한 커스텀 이벤트 리스너
      const handlePanToPlaceId = async (evt: Event) => {
        const ev = evt as CustomEvent<{ placeId: string }>;
        const placeId = ev.detail?.placeId;
        if (!placeId) return;

        try {
          const { Place } = (await google.maps.importLibrary("places")) as any;
          const p = new Place({ id: placeId });
          await p.fetchFields({
            fields: [
              "location",
              "photos",
              "displayName",
              "rating",
              "userRatingCount",
            ],
          });

          const loc = p.location;
          if (loc) {
            const latLng = { lat: loc.lat(), lng: loc.lng() };

            // ✅ 지도/핀 이동 (기존 코드 유지)
            gMapRef.current?.panTo?.(latLng);
            gMapRef.current?.setZoom?.(18);
            markerRef.current?.setPosition?.(latLng);

            // ✅ 역지오코딩으로 City/Town 갱신 추가
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
              { location: latLng },
              (results: any, status: any) => {
                if (status === "OK" && results?.[0]) {
                  const comps = results[0].address_components;
                  let city = "",
                    town = "";
                  comps.forEach((c: any) => {
                    if (c.types.includes("country")) {
                      city = c.long_name;
                    }
                    if (
                      c.types.includes("locality") ||
                      c.types.includes("sublocality")
                    ) {
                      town = c.long_name;
                    }
                  });
                  onLocationResolvedRef.current(city, town); // ← 좌측 라벨 갱신
                }
              }
            );
          }

          const photoURLs: string[] =
            p.photos?.map((ph: any) => ph.getURI({ maxHeight: 400 })) || [];
          if (photoURLs.length) await preloadImages(photoURLs);

          onPlaceSelectedRef.current?.({
            displayName: p.displayName ?? "",
            photos: photoURLs,
            rating: p.rating ?? undefined,
            userRatingCount: p.userRatingCount ?? undefined,
          });
        } catch (e) {
          console.error(e);
        }
      };

      window.addEventListener(
        "fe:panToPlaceId",
        handlePanToPlaceId as EventListener
      );

      // 주소 -> 도시/동네 정보 콜백
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results: any, status: any) => {
        if (status === "OK" && results[0]) {
          const components = results[0].address_components;
          let city = "",
            town = "";
          components.forEach((c: any) => {
            if (c.types.includes("country")) {
              city = c.long_name;
            }
            if (
              c.types.includes("locality") ||
              c.types.includes("sublocality")
            ) {
              town = c.long_name;
            }
          });
          onLocationResolvedRef.current(city, town);
        }
      });

      // 클린업
      return () => {
        window.removeEventListener(
          "fe:panToPlaceId",
          handlePanToPlaceId as EventListener
        );
      };
    }

    // 최초 1회만
    const cleanup = initMapOnce();
    return () => {
      // initMapOnce 내에서 반환한 클린업이 Promise일 수 있으니 방어
      Promise.resolve(cleanup).catch(() => {});
    };
  }, []);

  return (
    <div ref={mapDivRef} className="w-full h-[100svh] md:h-screen relative" />
  );
}

const MainScreen: React.FC = () => {
  const [cityName, setCityName] = useState("");
  const { address } = useAppKitAccount();

  const [townName, setTownName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailsResult | null>(
    null
  );
  const [isBookmarked, setIsBookmarked] = useState(false);

  // 🔹 Map/Grid 활성 상태 관리
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");

  const navigate = useNavigate();

  // Bottom sheet 제어
  const sheetHostRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<any>(null);
  const [showContent, setShowContent] = useState(false);

  // ✅ 검색 상태 (추가)
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPred, setLoadingPred] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionTokenRef = useRef<any | null>(null);

  // UserMenu 상태
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 현재 위치 상태
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 현재 위치 가져오기
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("위치 정보를 가져올 수 없습니다:", error);
          // 기본값: 서울시청
          resolve({ lat: 37.5665, lng: 126.978 });
        }
      );
    });
  };

  // 현재 위치 가져오기
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        console.log("현재 위치 가져오기 성공:", location);
      } catch (error) {
        console.error("위치 정보 가져오기 실패:", error);
        // 기본값으로 서울시청 설정
        setCurrentLocation({ lat: 37.5665, lng: 126.978 });
        console.log("기본 위치 설정: 서울시청");
      }
    };

    fetchCurrentLocation();
  }, []);

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

  // 북마크 상태 초기화
  useEffect(() => {
    if (!address) {
      setIsBookmarked(false);
      return;
    }

    // 로그인 시 북마크 상태 초기화
    setIsBookmarked(false);
  }, [address]);

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

  // 선택된 장소의 북마크 상태 확인
  useEffect(() => {
    if (!selectedPlace || !address) {
      setIsBookmarked(false);
      return;
    }

    if (!selectedPlace.placeId) {
      setIsBookmarked(false);
      return;
    }

    // 서버에서 해당 장소의 북마크 상태를 조회
    const checkBookmarkStatus = async () => {
      try {
        const placeId = selectedPlace.placeId!;
        const uuidPlaceId = await placeIdToUUID(placeId);

        // 서버에서 북마크 목록 조회
        const bookmarks = await getMyBookmarks(address);
        const isBookmarkedInServer = bookmarks.some(
          (bookmark) => bookmark.place_id === uuidPlaceId
        );

        setIsBookmarked(isBookmarkedInServer);
      } catch (error) {
        console.error("북마크 상태 조회 실패:", error);
        setIsBookmarked(false);
      }
    };

    checkBookmarkStatus();
  }, [selectedPlace, address]);

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

  // 사진 블록: 둘 다 없거나 에러일 때 하나의 placeholder만 표시
  const PhotosBlock: React.FC<{ img1?: string; img2?: string }> = ({
    img1,
    img2,
  }) => {
    // 에러/결측 여부를 내부에서 추적하여 둘 다 실패하면 하나의 placeholder만 노출
    const [err1, setErr1] = useState<boolean>(!img1);
    const [err2, setErr2] = useState<boolean>(!img2);

    const allMissingOrError = (!img1 || err1) && (!img2 || err2);

    if (allMissingOrError) {
      return (
        <div className="mb-4">
          <div className="flex h-[136px] justify-center items-center rounded-[16px] bg-gray-200 text-gray-500 text-location-content">
            no Image
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 첫 번째 칸 */}
        {!img1 || err1 ? (
          <div className="flex h-[136px] justify-center items-center rounded-[16px] bg-gray-200 text-gray-500 text-location-content">
            no Image
          </div>
        ) : (
          <img
            src={img1}
            alt="Place photo 1"
            decoding="async"
            loading="eager"
            className="w-full h-[136px] object-cover rounded-2xl"
            onError={() => setErr1(true)}
          />
        )}

        {/* 두 번째 칸 */}
        {!img2 || err2 ? (
          <div className="flex h-[136px] justify-center items-center rounded-2xl bg-gray-200 text-gray-500">
            no Image
          </div>
        ) : (
          <img
            src={img2}
            alt="Place photo 2"
            decoding="async"
            loading="eager"
            className="w-full h-[136px] object-cover rounded-2xl"
            onError={() => setErr2(true)}
          />
        )}
      </div>
    );
  };

  const heroTitle =
    selectedPlace?.displayName || "Burger Boy and Burger girl are dancing now";
  const img1 = selectedPlace?.photos?.[0] || "/sample/burger.jpg";
  const img2 = selectedPlace?.photos?.[1] || "/sample/bibimbap.jpg";
  const rating = selectedPlace?.rating ?? 4;
  const ratingCount = selectedPlace?.userRatingCount ?? 12;

  // 공유 기능
  const handleShare = async () => {
    if (!selectedPlace) return;

    try {
      // Google Maps 링크 생성 (placeId 사용)
      const googleMapsUrl = `https://www.google.com/maps/place/?q=place_id:${selectedPlace.placeId}`;

      if (navigator.share) {
        // 모바일에서 네이티브 공유 사용
        await navigator.share({
          title: selectedPlace.displayName,
          text: `${selectedPlace.displayName} - FavorEat에서 발견한 장소`,
          url: googleMapsUrl,
        });
      } else {
        // 데스크톱에서 클립보드에 복사
        await navigator.clipboard.writeText(googleMapsUrl);
        alert("Google Maps 링크가 클립보드에 복사되었습니다!");
      }
    } catch (error) {
      console.error("공유 실패:", error);
      // 폴백: 클립보드에 복사
      try {
        const googleMapsUrl = selectedPlace.placeId
          ? `https://www.google.com/maps/place/?q=place_id:${selectedPlace.placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.displayName)}`;
        await navigator.clipboard.writeText(googleMapsUrl);
        alert("Google Maps 링크가 클립보드에 복사되었습니다!");
      } catch (clipboardError) {
        console.error("클립보드 복사 실패:", clipboardError);
        alert("공유 기능을 사용할 수 없습니다.");
      }
    }
  };

  // 북마크 토글 기능
  const handleBookmarkToggle = async () => {
    if (!selectedPlace || !address) {
      alert("지갑을 연결해주세요.");
      return;
    }

    if (!selectedPlace.placeId) {
      alert("장소 정보를 가져올 수 없습니다.");
      return;
    }

    const placeId = selectedPlace.placeId;
    const originalBookmarkState = isBookmarked;

    // 즉시 UI 상태 변경 (Optimistic Update)
    setIsBookmarked(!isBookmarked);

    try {
      if (originalBookmarkState) {
        // 북마크 해제
        const uuidPlaceId = await placeIdToUUID(placeId);
        await removeBookmark(uuidPlaceId, address);
        alert("북마크가 해제되었습니다.");
      } else {
        // 장소가 places 테이블에 존재하는지 확인하고 없으면 생성
        const uuidPlaceId = await ensurePlaceExists(
          placeId,
          selectedPlace.displayName,
          selectedPlace.address,
          selectedPlace.latitude,
          selectedPlace.longitude
        );

        // 북마크 추가
        await addBookmark(uuidPlaceId, address);
        alert("북마크에 추가되었습니다.");
      }
    } catch (error) {
      console.error("북마크 처리 실패:", error);

      // 에러 발생 시 원래 상태로 되돌리기
      setIsBookmarked(originalBookmarkState);

      alert("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    let timer: any;
    async function run() {
      if (!searchOpen) return;
      if (!query.trim()) {
        setPredictions([]);
        return;
      }
      setLoadingPred(true);
      try {
        await google.maps.importLibrary("places");
        const svc = new (google.maps.places as any).AutocompleteService();
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new (
            google.maps.places as any
          ).AutocompleteSessionToken();
        }
        svc.getPlacePredictions(
          {
            input: query,
            sessionToken: sessionTokenRef.current,
          },
          (res: any[], status: string) => {
            if (status === "OK" && Array.isArray(res)) setPredictions(res);
            else setPredictions([]);
            setLoadingPred(false);
          }
        );
      } catch (e) {
        console.error(e);
        setLoadingPred(false);
      }
    }
    timer = setTimeout(run, 250);
    return () => clearTimeout(timer);
  }, [query, searchOpen]);

  // 검색 열릴 때 포커스/세션 토큰
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
      if (window.google?.maps?.places) {
        sessionTokenRef.current =
          new window.google.maps.places.AutocompleteSessionToken();
      } else {
        sessionTokenRef.current = null;
      }
    } else {
      setQuery("");
      setPredictions([]);
      sessionTokenRef.current = null;
    }
  }, [searchOpen]);

  return (
    <div>
      <Header
        leftElement={<div></div>}
        rightElement={
          <ConnectWalletButton onOpenUserMenu={() => setIsUserMenuOpen(true)} />
        }
        centerElement={
          <div className="flex items-center gap-0.5 text-redorange-500 text-rating-count">
            <img src="/icons/logo.svg" alt="FavorEat" className="w-6 h-6" />
            FavorEat
          </div>
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
        <div className="absolute top-0 left-0 w-full z-10 p-4 pointer-events-none">
          {/* 1줄: City / Town 라벨 (항상 표시) */}
          <div className="pointer-events-auto">
            <div className="text-title-600 text-gray-800 inline-block px-2 py-1 rounded-lg">
              {cityName || "City Name"}
            </div>
            <div className="text-display-700 text-gray-800 mt-4 px-2">
              {townName || "Town Name"}
            </div>
          </div>

          {/* 2줄: 좌측 검색 입력 + 우측 버튼 묶음 (버튼과 같은 높이) */}
          <div className="mt-2 flex items-center justify-between gap-2 pointer-events-none">
            {/* 좌측: 검색 입력 (searchOpen 일 때만 표시) */}
            <div className="pointer-events-auto flex-1 min-w-0">
              {searchOpen && (
                <div className="h-10 flex items-center gap-2 bg-white rounded-[16px] shadow-[0_0_6px_0_rgba(0,0,0,0.16)] px-3">
                  <img
                    src="/icons/search-lg.svg"
                    className="w-4 h-4 opacity-80"
                  />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="가게 이름 또는 주소 검색"
                    className="flex-1 h-full outline-none bg-transparent text-[14px] leading-[20px] placeholder:text-gray-400"
                  />
                  {!!query && (
                    <button
                      onClick={() => setQuery("")}
                      className="p-1 rounded-[8px] hover:bg-gray-100"
                      aria-label="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 우측: 액션 버튼 묶음 (항상 표시) */}
            <div className="pointer-events-auto flex justify-center items-center gap-2">
              {/* Search 버튼 */}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="flex justify-center items-center w-10 h-10 p-2 bg-white rounded-[16px] shadow-[0_0_4px_0_rgba(0,0,0,0.24)]"
                aria-label="Search"
              >
                <img
                  src="/icons/search-lg.svg"
                  alt="Search"
                  className="w-4 h-4 opacity-80"
                />
              </button>

              {/* Map/Grid 토글 */}
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-[16px]">
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

                <button
                  data-active={viewMode === "grid"}
                  onClick={() =>
                    navigate("/stores", {
                      state: {
                        cityName,
                        townName,
                        userLocation: currentLocation || {
                          lat: 37.5665,
                          lng: 126.978,
                        },
                      },
                    })
                  }
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

          {/* 자동완성 리스트: 입력 아래에 전체폭으로 표시 */}
          {searchOpen && (
            <div className="pointer-events-auto mt-2 bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.12)] overflow-hidden max-h-[50vh] overflow-y-auto">
              {loadingPred && (
                <div className="px-3 py-3 text-sm text-gray-500">검색 중…</div>
              )}
              {!loadingPred && predictions.length === 0 && query && (
                <div className="px-3 py-3 text-sm text-gray-500">
                  결과가 없습니다
                </div>
              )}
              {predictions.map((p: any) => (
                <button
                  key={p.place_id}
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("fe:panToPlaceId", {
                        detail: { placeId: p.place_id },
                      })
                    );
                    sessionTokenRef.current = null;
                    setSearchOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50"
                >
                  <div className="text-[14px] font-semibold text-gray-900 line-clamp-1">
                    {p.structured_formatting?.main_text || p.description}
                  </div>
                  <div className="text-[12px] text-gray-500 line-clamp-1">
                    {p.structured_formatting?.secondary_text || ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FAB */}
        {/* {!showContent && (
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
        )} */}

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
                    <button
                      onClick={handleShare}
                      className="p-3 bg-gray-100 hover:bg-gray-200 rounded-[16px] transition-colors"
                      title="공유하기"
                    >
                      <img src="/icons/share-07.svg" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleBookmarkToggle}
                      className={`p-3 rounded-[16px] transition-colors ${
                        isBookmarked
                          ? "bg-redorange-100 hover:bg-redorange-200"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      title={isBookmarked ? "북마크 해제" : "북마크 추가"}
                    >
                      <img
                        src={
                          isBookmarked
                            ? "/icons/bookmark-added.svg"
                            : "/icons/bookmark.svg"
                        }
                        className="w-4 h-4"
                      />
                    </button>
                  </div>
                </div>

                {/* 이미지 2개 */}
                <PhotosBlock img1={img1} img2={img2} />

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

      {/* UserMenu */}
      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default MainScreen;
