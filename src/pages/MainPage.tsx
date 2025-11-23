import React, { useEffect, useRef, useState } from "react";
import { BottomSheet } from "react-spring-bottom-sheet";
import "react-spring-bottom-sheet/dist/style.css";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";
import Navigator, { TabType } from "../components/Navigator";
import { useAccount } from "wagmi";
import {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  ensurePlaceExists,
  getPlaceReviewStats,
} from "../supabaseClient";
import RecentFeed from "../components/RecentFeed";
import Leaderboard from "../components/Leaderboard";
import { sdk } from "@farcaster/miniapp-sdk";

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
  onMapLocationChanged?: (location: { lat: number; lng: number }) => void;
  userPfpUrl?: string | null;
}

interface PlaceDetailsResult {
  displayName: string;
  photos: string[];
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

// 마커 아이콘 캐시 (성능 최적화)
const markerIconCache = new Map<string, string>();

// 이미지를 base64로 변환하는 함수
function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const base64 = canvas.toDataURL("image/png");
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Image load failed"));

    // 타임아웃 설정 (2초)
    setTimeout(() => reject(new Error("Image load timeout")), 2000);

    img.src = url;
  });
}

// 핀 아이콘 안에 pfp 이미지를 그리는 함수 (SVG 기반, base64 이미지 포함)
async function createCustomMarkerIcon(pfpUrl: string | null): Promise<string> {
  // 캐시 키 생성
  const cacheKey = pfpUrl || "default";
  if (markerIconCache.has(cacheKey)) {
    return markerIconCache.get(cacheKey)!;
  }

  const baseSize = 48;
  const centerX = baseSize / 2;
  const centerY = 20; // 원형 중심 Y 위치 (tipHeight/2만큼 위로 올림)
  const radius = 16; // 원형 부분 반지름
  const tipHeight = 8; // 아래쪽 뾰족한 부분 높이
  const tipWidth = 9; // 아래쪽 뾰족한 부분 너비
  const imageRadius = radius; // 이미지 반지름 (테두리 여백)

  // 삼각형 좌표 계산
  const circleBottom = centerY + radius; // 원형의 아래쪽 끝 (y = 20 + 19 = 39)
  const tipTopLeft = circleBottom - tipHeight / 3; // 삼각형 왼쪽 상단 (y = 39 - 1.67 = 37.33)
  const tipTopRight = circleBottom - tipHeight / 3; // 삼각형 오른쪽 상단 (y = 37.33)
  const tipBottom = circleBottom + tipHeight / 2; // 삼각형 아래쪽 뾰족한 점 (y = 39 + 2.5 = 41.5)
  const tipLeftX = centerX - tipWidth / 3; // 삼각형 왼쪽 X (x = 24 - 3 = 21)
  const tipRightX = centerX + tipWidth / 3; // 삼각형 오른쪽 X (x = 24 + 3 = 27)

  let imageBase64: string | null = null;

  // pfp 이미지가 있으면 base64로 변환
  if (pfpUrl) {
    try {
      imageBase64 = await imageToBase64(pfpUrl);
    } catch (error) {
      // 이미지 로드 실패 시 null로 처리 (기본 핀만 표시)
      // console.warn("pfp 이미지 로드 실패:", error);
    }
  }

  // SVG 생성 (base64 이미지 포함)
  let svg = `
    <svg width="${baseSize}" height="${baseSize}" viewBox="0 0 ${baseSize} ${baseSize}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="circleClip-${cacheKey.replace(/[^a-zA-Z0-9]/g, "")}">
          <circle cx="${centerX}" cy="${centerY}" r="${imageRadius}"/>
        </clipPath>
      </defs>
      
      <!-- 원형 테두리 -->
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="#FF4500" stroke-width="4"/>
      
      <!-- 아래쪽 뾰족한 부분 (삼각형) - 원형과 자연스럽게 연결 -->
      <path d="M ${tipLeftX} ${tipTopLeft} L ${centerX} ${tipBottom} L ${tipRightX} ${tipTopRight} Z" fill="#FF4500" stroke="#FF4500" stroke-width="4" stroke-linejoin="round"/>
      
      ${
        imageBase64
          ? `
      <!-- pfp 이미지 (base64, 원형 클리핑) -->
      <image 
        href="${imageBase64}" 
        x="${centerX - imageRadius}" 
        y="${centerY - imageRadius}" 
        width="${imageRadius * 2}" 
        height="${imageRadius * 2}" 
        clip-path="url(#circleClip-${cacheKey.replace(/[^a-zA-Z0-9]/g, "")})"
        preserveAspectRatio="xMidYMid slice"
      />
      `
          : ""
      }
    </svg>
  `;

  // SVG를 Data URL로 변환
  const svgDataUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  markerIconCache.set(cacheKey, svgDataUrl);
  return svgDataUrl;
}

// Fetch Google Place details by placeId and return typed data (기존 Places API 사용).
export async function fetchPlaceDetails(
  placeId: string
): Promise<PlaceDetailsResult> {
  if (!google || !google.maps) {
    throw new Error("Google Maps JS SDK is not loaded yet.");
  }

  // 기존 Places API 사용 (비용 절약)
  const service = new google.maps.places.PlacesService(
    document.createElement("div")
  );

  return new Promise((resolve, reject) => {
    service.getDetails(
      {
        placeId: placeId,
        fields: ["name", "photos", "geometry", "formatted_address"],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const photos: string[] =
            place.photos?.map((photo: any) =>
              photo.getUrl({ maxHeight: 400 })
            ) || [];

          resolve({
            displayName: place.name || "",
            photos,
            placeId: placeId,
            address: place.formatted_address || undefined,
            latitude: place.geometry?.location?.lat() || undefined,
            longitude: place.geometry?.location?.lng() || undefined,
          });
        } else {
          reject(new Error(`Places API error: ${status}`));
        }
      }
    );
  });
}

function MapView({
  onLocationResolved,
  onPlaceSelected,
  onMapLocationChanged,
  userPfpUrl,
}: MapViewProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  // 지도/마커를 보존하는 ref (재초기화 방지)
  const gMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // 최신 콜백 보존
  const onLocationResolvedRef = useRef(onLocationResolved);
  const onPlaceSelectedRef = useRef(onPlaceSelected);
  const onMapLocationChangedRef = useRef(onMapLocationChanged);
  useEffect(() => {
    onLocationResolvedRef.current = onLocationResolved;
  }, [onLocationResolved]);
  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);
  useEffect(() => {
    onMapLocationChangedRef.current = onMapLocationChanged;
  }, [onMapLocationChanged]);

  // 빠른 연속 클릭 대비 최신 요청만 반영하기 위한 토큰
  const latestReqId = useRef(0);

  // userPfpUrl을 ref로 저장하여 최신 값 유지
  const userPfpUrlRef = useRef(userPfpUrl);
  useEffect(() => {
    userPfpUrlRef.current = userPfpUrl;
  }, [userPfpUrl]);

  // userPfpUrl 변경 시 마커 아이콘 업데이트 (비동기, 블로킹 없음)
  useEffect(() => {
    if (markerRef.current && userPfpUrl !== undefined && gMapRef.current) {
      // 비동기로 아이콘 생성 (렌더링 블로킹 방지)
      createCustomMarkerIcon(userPfpUrl || null)
        .then((iconUrl) => {
          if (markerRef.current) {
            const markerIcon = {
              url: iconUrl,
              scaledSize: new google.maps.Size(48, 48),
              size: new google.maps.Size(48, 48),
              anchor: new google.maps.Point(24, 48), // 아래쪽 뾰족한 부분이 위치를 가리키도록
            };
            markerRef.current.setIcon(markerIcon);
          }
        })
        .catch((_error) => {
          // 실패해도 기존 마커는 유지
        });
    }
  }, [userPfpUrl]);

  useEffect(() => {
    // 이미 초기화되었으면 다시 초기화하지 않음
    if (gMapRef.current) {
      return;
    }

    const loadGoogleMapsScript = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 로드되어 있는지 확인
        if (typeof google === "object" && google.maps) {
          console.log("Google Maps API 이미 로드됨");
          resolve();
          return;
        }

        // 기존 스크립트가 있는지 확인
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]'
        );
        if (existingScript) {
          console.log("기존 Google Maps 스크립트 발견, 제거 후 재로드");
          existingScript.remove();
        }

        const script = document.createElement("script");
        const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en&region=US`;
        script.async = true;
        script.onerror = () => {
          console.error("Google Maps 스크립트 로드 실패");
          reject(new Error("Google Maps 스크립트 로드 실패"));
        };
        script.onload = () => {
          console.log("Google Maps API 로드 완료");
          resolve();
        };
        document.head.appendChild(script);
      });
    };

    async function initMapOnce() {
      try {
        console.log("지도 초기화 시작");
        await loadGoogleMapsScript();

        // Google Maps API가 완전히 로드될 때까지 대기
        let retryCount = 0;
        const maxRetries = 10;
        while (retryCount < maxRetries) {
          if (
            typeof google === "object" &&
            google.maps &&
            typeof google.maps.importLibrary === "function"
          ) {
            console.log("Google Maps API 로드 확인됨");
            break;
          }
          console.log(
            `Google Maps API 로드 대기 중... (${retryCount + 1}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          retryCount++;
        }

        if (retryCount >= maxRetries) {
          throw new Error("Google Maps API 로드 시간 초과");
        }

        // 기본 위치 (서울 시청)로 먼저 지도 표시 (geolocation 대기하지 않음)
        let position = { lat: 37.37, lng: 126.9562 };

        console.log("Google Maps 라이브러리 로드 완료");

        // 기존 Google Maps API 사용 (비용 절약)
        // 지도를 먼저 기본 위치로 빠르게 표시
        const gMap = new google.maps.Map(mapDivRef.current as HTMLElement, {
          center: position,
          zoom: 18,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: "cooperative", // 두 손가락으로만 확대/축소, 한 손가락으로는 지도 이동
          scrollwheel: false,
          disableDoubleClickZoom: true, // 더블 클릭 확대 비활성화
        });
        gMapRef.current = gMap;

        // geolocation은 비동기로 처리하여 지도 표시를 블로킹하지 않음
        if ("geolocation" in navigator) {
          // 타임아웃 설정 (3초)
          const timeoutId = setTimeout(() => {
            // console.warn("위치 정보 가져오기 타임아웃");
          }, 5000);

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              const newPosition = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              // 지도와 마커 위치 업데이트
              if (gMapRef.current) {
                gMapRef.current.setCenter(newPosition);
                if (markerRef.current) {
                  markerRef.current.setPosition(newPosition);
                }
              }
              // console.log("현재 위치 가져오기 성공:", newPosition);
            },
            (_e) => {
              clearTimeout(timeoutId);
              // console.warn("위치 정보를 가져오지 못했습니다:", _e);
            },
            {
              timeout: 3000, // 3초 타임아웃
              maximumAge: 60000, // 1분 이내 캐시된 위치 사용
            }
          );
        }

        // 마커 초기화: 먼저 기본 마커를 빠르게 표시하고, 커스텀 마커가 준비되면 교체
        const initializeMarker = () => {
          // 1. 먼저 기본 마커를 빠르게 생성 (지도 표시 지연 방지)
          markerRef.current = new google.maps.Marker({
            map: gMap,
            position,
            title: "현재 위치",
          });

          // 2. 비동기로 커스텀 마커 아이콘 생성 후 교체 (지도 렌더링을 블로킹하지 않음)
          // userPfpUrl이 준비되었을 때만 커스텀 마커 생성
          const currentPfpUrl = userPfpUrlRef.current;
          if (currentPfpUrl !== undefined) {
            createCustomMarkerIcon(currentPfpUrl || null)
              .then((iconUrl) => {
                if (markerRef.current) {
                  const markerIcon = {
                    url: iconUrl,
                    scaledSize: new google.maps.Size(48, 48),
                    size: new google.maps.Size(48, 48),
                    anchor: new google.maps.Point(24, 48), // 아래쪽 뾰족한 부분이 위치를 가리키도록
                  };
                  markerRef.current.setIcon(markerIcon);
                }
              })
              .catch((_error) => {
                // 실패해도 기본 마커는 이미 표시되어 있음
              });
          }
        };

        initializeMarker();

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
            markerRef.current?.setPosition(e.latLng);

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
          console.log("🔍 검색 결과 선택:", { placeId, detail: ev.detail });
          if (!placeId) return;

          try {
            // 검색 결과에서도 fetchPlaceDetails 함수 사용 (완전한 정보 가져오기)
            try {
              const details = await fetchPlaceDetails(placeId);
              console.log(
                "🔍 검색 장소 상세 정보 (fetchPlaceDetails):",
                details
              );

              // 지도/핀 이동
              if (details.latitude && details.longitude) {
                const latLng = {
                  lat: details.latitude,
                  lng: details.longitude,
                };
                gMapRef.current?.panTo(latLng);
                gMapRef.current?.setZoom(18);
                markerRef.current?.setPosition(latLng);

                // 지도 위치 변경 콜백 호출
                onMapLocationChangedRef.current?.(latLng);

                // 역지오코딩으로 City/Town 갱신
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
                      onLocationResolvedRef.current(city, town);
                    }
                  }
                );
              }

              // 이미지 프리로드
              if (details.photos?.length) {
                await preloadImages(details.photos);
              }

              // 완전한 장소 정보 전달
              onPlaceSelectedRef.current?.(details);
            } catch (error) {
              console.error("검색 장소 상세 정보 가져오기 실패:", error);
            }
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
        geocoder.geocode(
          { location: position },
          (results: any, status: any) => {
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
          }
        );

        // 클린업
        return () => {
          window.removeEventListener(
            "fe:panToPlaceId",
            handlePanToPlaceId as EventListener
          );
        };
      } catch (error) {
        console.error("지도 초기화 실패:", error);
        // 지도 초기화 실패 시 사용자에게 알림
        console.error("지도를 불러올 수 없습니다. 페이지를 새로고침해주세요.");
      }
    }

    // 구글맵 초기화 (userPfpUrl과 독립적으로 실행)
    const cleanup = initMapOnce();
    return () => {
      // initMapOnce 내에서 반환한 클린업이 Promise일 수 있으니 방어
      Promise.resolve(cleanup).catch(() => {});
    };
  }, []);

  return (
    <div
      ref={mapDivRef}
      className="w-full h-[calc(100svh-3rem)] md:h-[calc(100vh-3rem)] relative"
    />
  );
}

const MainScreen: React.FC = () => {
  const location = useLocation();
  const [cityName, setCityName] = useState("");
  const { address } = useAccount();
  const [userPfpUrl, setUserPfpUrl] = useState<string | null | undefined>(
    undefined
  );

  const [townName, setTownName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailsResult | null>(
    null
  );
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [placeReviewStats, setPlaceReviewStats] = useState<{
    count: number;
    averageRating: number;
  } | null>(null);

  // 🔹 Map/Grid 활성 상태 관리
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");

  // Navigator 탭 상태 (location.state에서 activeTab 가져오기)
  const [activeTab, setActiveTab] = useState<TabType>(
    (location.state as { activeTab?: TabType })?.activeTab || "recent"
  );

  const navigate = useNavigate();

  // 탭 전환 시 bottom sheet 초기화
  useEffect(() => {
    // selectedPlace 초기화
    setSelectedPlace(null);
    // showContent 초기화
    setShowContent(false);
    // placeReviewStats 초기화
    setPlaceReviewStats(null);
    // bottom sheet를 최소 높이로 스냅
    if (sheetRef.current?.snapTo) {
      try {
        sheetRef.current.snapTo(0); // 첫 번째 snap point (최소 높이)
      } catch (error) {
        console.warn("Bottom sheet 초기화 실패:", error);
      }
    }
  }, [activeTab]);

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
          resolve({ lat: 37.37, lng: 126.9562 });
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
        setCurrentLocation({ lat: 37.37, lng: 126.9562 });
        console.log("기본 위치 설정: 서울시청");
      }
    };

    fetchCurrentLocation();
  }, []);

  // user_pfp_url 가져오기 (Farcaster SDK에서만 가져오기)
  useEffect(() => {
    const fetchUserPfpUrl = async () => {
      if (!address) {
        setUserPfpUrl(null);
        return;
      }

      try {
        // Farcaster SDK에서만 가져오기
        const context = await sdk.context;
        if (context?.user?.pfpUrl) {
          setUserPfpUrl(context.user.pfpUrl);
        } else {
          setUserPfpUrl(null);
        }
      } catch (error) {
        // SDK context가 없으면 null로 설정
        setUserPfpUrl(null);
      }
    };

    fetchUserPfpUrl();
  }, [address]);

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

    const ro = new ResizeObserver(() => {
      // 시트 높이 관찰 (필요시 사용)
      // const h = entries[0].contentRect.height;
      // const ratio = h / window.innerHeight;
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

  // 장소 선택 시: 콘텐츠 표시 + 중간 스냅(0.46 높이)
  useEffect(() => {
    if (!selectedPlace) return;

    setShowContent(true);

    const snapMiddle = () => {
      const targetPx = Math.round(window.innerHeight * 0.46);
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

  // 선택된 장소의 북마크 상태 확인 및 리뷰 통계 조회
  useEffect(() => {
    if (!selectedPlace) {
      setIsBookmarked(false);
      setPlaceReviewStats(null);
      return;
    }

    if (!selectedPlace.placeId) {
      setIsBookmarked(false);
      setPlaceReviewStats(null);
      return;
    }

    // 서버에서 해당 장소의 북마크 상태를 조회
    const checkBookmarkStatus = async () => {
      if (!address) {
        setIsBookmarked(false);
        return;
      }

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

    // 리뷰 통계 조회
    const fetchReviewStats = async () => {
      try {
        const placeId = selectedPlace.placeId!;
        const stats = await getPlaceReviewStats(placeId);
        setPlaceReviewStats(stats);
      } catch (error) {
        console.error("리뷰 통계 조회 실패:", error);
        setPlaceReviewStats(null);
      }
    };

    checkBookmarkStatus();
    fetchReviewStats();
  }, [selectedPlace, address]);

  // 별점 UI (가득/빈 별 표현, 0.5점 단위 지원)
  const Stars = ({ rating = 0 }: { rating?: number }) => {
    const clampedRating = Math.min(5, Math.max(0, rating));
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const starValue = i + 1;
          // 별점이 해당 별의 값 이상이면 채워진 별
          if (clampedRating >= starValue) {
            return (
              <span key={i} className="text-orange-500 w-4">
                ★
              </span>
            );
          }
          // 별점이 해당 별의 값 - 0.5 이상이면 반 별
          else if (clampedRating >= starValue - 0.5) {
            return (
              <span key={i} className="relative inline-block w-4">
                <span className="text-orange-500">☆</span>
                <span
                  className="absolute left-0 top-0 overflow-hidden text-orange-500"
                  style={{ width: "52.5%" }}
                >
                  ★
                </span>
              </span>
            );
          }
          // 그 외는 빈 별
          else {
            return (
              <span key={i} className="text-gray-300 w-4">
                ☆
              </span>
            );
          }
        })}
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
        {img1 && (
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
        {img2 && (
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
  // DB에서 가져온 리뷰 통계만 사용
  const rating = placeReviewStats?.averageRating || 0;
  const ratingCount = placeReviewStats?.count || 0;

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
        console.log("Google Maps 링크가 클립보드에 복사되었습니다!");
      }
    } catch (error) {
      console.error("공유 실패:", error);
      // 폴백: 클립보드에 복사
      try {
        const googleMapsUrl = selectedPlace.placeId
          ? `https://www.google.com/maps/place/?q=place_id:${selectedPlace.placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPlace.displayName)}`;
        await navigator.clipboard.writeText(googleMapsUrl);
        console.log("Google Maps 링크가 클립보드에 복사되었습니다!");
      } catch (clipboardError) {
        console.error("클립보드 복사 실패:", clipboardError);
        console.error("공유 기능을 사용할 수 없습니다.");
      }
    }
  };

  // 북마크 토글 기능
  const handleBookmarkToggle = async () => {
    console.log("🔖 북마크 토글 시도:", { selectedPlace, address });

    if (!selectedPlace || !address) {
      console.log("지갑을 연결해주세요.");
      return;
    }

    if (!selectedPlace.placeId) {
      console.log(
        "장소 정보를 가져올 수 없습니다. selectedPlace:",
        selectedPlace
      );
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
        console.log("북마크가 해제되었습니다.");
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
        console.log("북마크에 추가되었습니다.");
      }
    } catch (error) {
      console.error("북마크 처리 실패:", error);

      // 에러 발생 시 원래 상태로 되돌리기
      setIsBookmarked(originalBookmarkState);

      console.error("북마크 처리 중 오류가 발생했습니다.");
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
        // 기존 Places API 사용 (비용 절약)
        const svc = new google.maps.places.AutocompleteService();
        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new google.maps.places.AutocompleteSessionToken();
        }
        svc.getPlacePredictions(
          {
            input: query,
            sessionToken: sessionTokenRef.current,
          },
          (
            res: google.maps.places.AutocompletePrediction[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && res)
              setPredictions(res);
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
        leftElement={
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-[2px]"
          >
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
          </button>
        }
        rightElement={
          <ConnectWalletButton onOpenUserMenu={() => setIsUserMenuOpen(true)} />
        }
      />

      <Navigator activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Recent 탭 */}
      {activeTab === "recent" && (
        <div className="pt-[112px] bg-gray-100 min-h-screen">
          <RecentFeed />
        </div>
      )}

      {/* Near me 탭 (지도) - 항상 마운트하여 재로딩 방지 */}
      <div
        className={`h-screen overflow-visible bg-white flex flex-col font-sans relative pt-28 ${
          activeTab !== "near-me" ? "hidden" : ""
        }`}
      >
        {/* 지도 영역 */}
        <MapView
          onLocationResolved={(city, town) => {
            setCityName(city);
            setTownName(town);
          }}
          onPlaceSelected={(details) => {
            setSelectedPlace(details); // 프리로드 완료 후 전달됨
          }}
          onMapLocationChanged={(location) => {
            // 검색 결과 선택으로 지도 위치가 변경되면 currentLocation 업데이트
            setCurrentLocation(location);
            // console.log("지도 위치 변경됨:", location);
          }}
          userPfpUrl={userPfpUrl}
        />

        {/* 상단 */}
        <div className="absolute top-16 left-0 w-full z-10 p-4 pointer-events-none">
          {/* 1줄: City / Town 라벨 (항상 표시) */}
          <div className="pointer-events-auto">
            <div className="text-title-600 text-gray-800 inline-block px-2 py-1 rounded-lg">
              {cityName}
            </div>
            <div className="text-display-700 text-gray-800 mt-4 px-2">
              {townName}
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
                          lat: 37.37,
                          lng: 126.9562,
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
                    console.log("🔍 검색 결과 클릭:", {
                      placeId: p.place_id,
                      prediction: p,
                    });
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

        {/* Bottom Sheet (0.075 / 0.46 / 1.0 단계) - near-me 탭에서만 표시 */}
        {activeTab === "near-me" && (
          <div ref={sheetHostRef}>
            <BottomSheet
              ref={sheetRef}
              open={true}
              blocking={false}
              snapPoints={({ maxHeight }) => {
                if (!selectedPlace) {
                  return [0.08 * maxHeight];
                }
                return [0.08 * maxHeight, 0.46 * maxHeight];
              }}
              defaultSnap={({ snapPoints }) => snapPoints[0]}
              onDismiss={() => {}}
            >
              {!showContent ? (
                // 0.46 미만: 프리뷰
                <div className="p-3">
                  <p className="text-center text-sm text-gray-500">
                    지도를 탭해 주변 가게를 선택하세요
                  </p>
                </div>
              ) : (
                // 0.46 이상: 이미지 카드/별점/버튼
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-place-title leading-snug flex-1 min-w-0 line-clamp-2 mr-1">
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
                        const slug = toSlug(
                          selectedPlace.displayName || "store"
                        );
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
        )}
      </div>

      {/* Leaderboard 탭 */}
      {activeTab === "leaderboard" && <Leaderboard />}

      {/* UserMenu */}
      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default MainScreen;
