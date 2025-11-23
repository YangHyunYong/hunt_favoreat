import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import StoreCard from "../components/StoreCard";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchPlaceDetails } from "./MainPage";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";
import { getPlaceReviewStats } from "../supabaseClient";

// 이미지 캐시 시스템
const imageCache = new Map<string, string[]>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5분
const cacheTimestamps = new Map<string, number>();

// 캐시된 이미지 가져오기
function getCachedImages(placeId: string): string[] | null {
  const timestamp = cacheTimestamps.get(placeId);
  if (timestamp && Date.now() - timestamp < CACHE_EXPIRY) {
    return imageCache.get(placeId) || null;
  }
  return null;
}

// 이미지 캐시에 저장
function setCachedImages(placeId: string, images: string[]) {
  imageCache.set(placeId, images);
  cacheTimestamps.set(placeId, Date.now());
}

// API 호출 제한 시스템
let apiCallCount = 0;
const MAX_API_CALLS = 50; // 최대 API 호출 수
const API_RESET_TIME = 60 * 1000; // 1분
let lastResetTime = Date.now();

function canMakeApiCall(): boolean {
  const now = Date.now();
  if (now - lastResetTime > API_RESET_TIME) {
    apiCallCount = 0;
    lastResetTime = now;
  }
  return apiCallCount < MAX_API_CALLS;
}

function recordApiCall() {
  apiCallCount++;
}

// 디바운싱은 현재 사용하지 않지만 향후 확장 가능

// 재시도 로직
async function fetchPlaceDetailsWithRetry(
  placeId: string,
  maxRetries = 2
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchPlaceDetails(placeId);
    } catch (error: any) {
      if (
        error.message?.includes("too many requests") ||
        error.message?.includes("quota")
      ) {
        // console.warn(`API 호출 제한 감지, ${i + 1}/${maxRetries} 재시도`);
        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // 지수 백오프
        }
      } else {
        throw error;
      }
    }
  }
  throw new Error("최대 재시도 횟수 초과");
}

// ── util ───────────────────────────────────────────────────────────────────────
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// 구글 스크립트 로더 (places 라이브러리 포함)
async function loadGoogleMaps() {
  if (typeof window !== "undefined" && window.google?.maps?.places) return;
  await new Promise<void>((resolve, reject) => {
    const exists = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (exists && (window as any).google?.maps?.places) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps script load failed"));
    document.head.appendChild(script);
  });
}

// 거리(m) 계산 (haversine)
function distanceMeters(
  a: google.maps.LatLngLiteral,
  b: google.maps.LatLngLiteral
) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// ── 화면 ───────────────────────────────────────────────────────────────────────
const StoreListScreen: React.FC = () => {
  const navigate = useNavigate();

  // MainScreen에서 전달된 state (도시/동네 + 위치 정보)
  const location = useLocation();
  const { cityName, townName, userLocation } =
    (location.state as {
      cityName?: string;
      townName?: string;
      userLocation?: { lat: number; lng: number };
    }) || {};

  // 이 화면은 "grid" 활성
  const [viewMode] = useState<"map" | "grid">("grid");

  type Item = React.ComponentProps<typeof StoreCard>;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 현재 위치 가져오기 (fallback)
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
        (_error) => {
          // console.warn("위치 정보를 가져올 수 없습니다:", _error);
          // 기본값: 서울시청
          resolve({ lat: 37.37, lng: 126.9562 });
        }
      );
    });
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadGoogleMaps();

        // MainScreen에서 전달받은 위치 정보 사용, 없으면 현재 위치 가져오기
        let userLoc = userLocation;

        if (!userLoc) {
          try {
            userLoc = await getCurrentLocation();
            // console.log(
            //               "StoreListScreen에서 현재 위치 가져오기 성공:",
            //               userLoc
            //             );
          } catch (error) {
            // console.error("위치 정보 가져오기 실패:", error);
            userLoc = { lat: 37.37, lng: 126.9562 };
          }
        }

        // PlacesService 생성 (DOM 엘리먼트 없이도 동작)
        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        // 이제 여러 검색 조건을 사용하므로 단일 request는 제거

        // 음식 관련 장소만 검색 (300m 반경)
        const searchRequests = [
          { location: userLoc, radius: 300, type: "restaurant" },
          { location: userLoc, radius: 300, type: "food" },
          { location: userLoc, radius: 300, type: "meal_takeaway" },
          { location: userLoc, radius: 300, type: "cafe" },
          { location: userLoc, radius: 300, type: "bakery" },
          { location: userLoc, radius: 300, type: "bar" },
          {
            location: userLoc,
            radius: 300,
            keyword: "restaurant cafe food bakery bar",
          },
        ];

        // API 호출 횟수 최소화: 병렬 처리로 모든 검색을 동시에 실행
        const searchPromises = searchRequests.map(async (searchRequest) => {
          try {
            const results = await new Promise<google.maps.places.PlaceResult[]>(
              (resolve) => {
                service.nearbySearch(searchRequest, (res, status) => {
                  if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    res
                  )
                    resolve(res);
                  else if (
                    status ===
                    google.maps.places.PlacesServiceStatus.ZERO_RESULTS
                  )
                    resolve([]);
                  else {
                    // console.warn(
                    //                       `검색 실패 (${searchRequest.type || "keyword"}): ${status}`
                    //                     );
                    resolve([]);
                  }
                });
              }
            );
            return results;
          } catch (error) {
            // console.warn(
            //               `검색 에러 (${searchRequest.type || "keyword"}):`,
            //               error
            //             );
            return [];
          }
        });

        // 모든 검색 결과를 병렬로 기다림
        const searchResults = await Promise.all(searchPromises);
        const allResults = searchResults.flat();

        // 중복 제거 (place_id 기준)
        const uniqueResults = allResults.filter(
          (place, index, self) =>
            index === self.findIndex((p) => p.place_id === place.place_id)
        );

        // 250m 이내 + 음식 관련 장소만 필터링
        const filteredResults = uniqueResults.filter((place) => {
          if (!place.geometry?.location) return false;

          // 거리 필터링
          const dist = distanceMeters(userLoc, {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
          if (dist > 250) return false;

          // 음식 관련 타입만 허용
          if (!place.types) return false;

          const allowedTypes = [
            "restaurant",
            "food",
            "meal_takeaway",
            "cafe",
            "bakery",
            "bar",
            "meal_delivery",
            "meal_takeaway",
            "night_club",
            "liquor_store",
          ];

          const hasFoodType = place.types.some((type) =>
            allowedTypes.includes(type)
          );

          // 제외할 타입들
          const excludedTypes = [
            "health",
            "hospital",
            "doctor",
            "dentist",
            "pharmacy",
            "beauty_salon",
            "hair_care",
            "spa",
            "gym",
            "fitness_center",
            "bank",
            "atm",
            "gas_station",
            "car_repair",
            "car_wash",
            "school",
            "university",
            "library",
            "museum",
            "church",
            "police",
            "fire_station",
            "post_office",
            "government",
          ];

          const hasExcludedType = place.types.some((type) =>
            excludedTypes.includes(type)
          );

          return hasFoodType && !hasExcludedType;
        });

        const results = filteredResults;

        // fetchPlaceDetails 함수를 사용하므로 Place import 불필요

        const mapped: Item[] = await Promise.all(
          (results || []).map(async (p) => {
            // 최적화된 이미지 처리 로직
            let photos: string[] = [];

            if (p.place_id) {
              // 1. 캐시 확인
              const cachedImages = getCachedImages(p.place_id);
              if (cachedImages) {
                photos = cachedImages;
              } else if (canMakeApiCall()) {
                // 2. API 호출 가능하면 fetchPlaceDetails 사용
                try {
                  recordApiCall();
                  const placeDetails = await fetchPlaceDetailsWithRetry(
                    p.place_id
                  );
                  photos = placeDetails.photos.slice(0, 2);
                  setCachedImages(p.place_id, photos); // 캐시에 저장
                } catch (error) {
                  // console.warn(`${p.name}: fetchPlaceDetails 실패:`, error);
                  // 실패 시 nearbySearch 결과 사용
                  photos =
                    p.photos
                      ?.slice(0, 2)
                      .map((ph) =>
                        ph.getUrl({ maxWidth: 800, maxHeight: 600 })
                      ) || [];
                }
              } else {
                // 3. API 호출 제한에 도달했으면 nearbySearch 결과 사용
                photos =
                  p.photos
                    ?.slice(0, 2)
                    .map((ph) =>
                      ph.getUrl({ maxWidth: 800, maxHeight: 600 })
                    ) || [];
              }
            } else {
              // place_id가 없으면 nearbySearch 결과만 사용
              photos =
                p.photos
                  ?.slice(0, 2)
                  .map((ph) => ph.getUrl({ maxWidth: 800, maxHeight: 600 })) ||
                [];
            }

            const dist = p.geometry?.location
              ? distanceMeters(userLoc, {
                  lat: p.geometry.location.lat(),
                  lng: p.geometry.location.lng(),
                })
              : undefined;

            // DB에서 리뷰 통계 가져오기
            let dbRating = 0;
            let dbRatingCount = 0;

            if (p.place_id) {
              try {
                const stats = await getPlaceReviewStats(p.place_id);
                dbRating = stats.averageRating;
                dbRatingCount = stats.count;
              } catch (error) {
                // console.warn(`${p.name}: 리뷰 통계 조회 실패:`, error);
              }
            }

            return {
              title: p.name || "Unknown",
              photos, // ← 전체 보관
              rating: dbRating,
              ratingCount: dbRatingCount,
              distanceMeters: dist ? Math.round(dist) : undefined,
              storeName: p.types && p.types[0] ? p.types[0] : undefined,
              addressPreview: p.vicinity || p.formatted_address || "",
              placeId: p.place_id, // Google Places API placeId 전달
              placeAddress: p.formatted_address || p.vicinity || "",
              latitude: p.geometry?.location?.lat() || undefined,
              longitude: p.geometry?.location?.lng() || undefined,
              bookmarked: false,
              onToggleBookmark: () => {},
              onViewDetails: () => {
                const slug = toSlug(p.name || "store");
                // MainScreen.tsx와 같은 방식으로 selectedPlace 객체 전달
                const selectedPlace = {
                  displayName: p.name || "Unknown",
                  photos: photos, // 현재 장소의 photos 배열 사용
                  placeId: p.place_id,
                  address: p.formatted_address || p.vicinity || "",
                  latitude: p.geometry?.location?.lat() || undefined,
                  longitude: p.geometry?.location?.lng() || undefined,
                };
                navigate(`/store/${slug}`, { state: selectedPlace });
              },
            };
          })
        );
        // ✅ 거리 기준 오름차순 정렬 추가
        mapped.sort((a, b) => {
          if (a.distanceMeters == null) return 1;
          if (b.distanceMeters == null) return -1;
          return a.distanceMeters - b.distanceMeters;
        });

        if (!cancelled) {
          setItems(mapped);
        }
      } catch (e) {
        // console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      {/* 상단 헤더 */}
      <Header
        leftElement={<div></div>}
        rightElement={
          <ConnectWalletButton onOpenUserMenu={() => setIsUserMenuOpen(true)} />
        }
        centerElement={
          <img
            src="/icons/icon-filled.svg"
            alt="logo"
            className="h-[30.75px] w-auto"
          />
        }
      />

      {/* 상단 도시/동네 + 우측 버튼 */}
      <div className="fixed top-16 left-0 right-0 z-10 bg-gray-100 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="text-location-content-700 text-gray-800">
              {townName}
            </div>
          </div>

          <div className="flex justify-center items-center pointer-events-auto gap-2">
            {/* Search */}
            {/* <button
              className="flex justify-center items-center w-10 h-10 p-2 bg-white rounded-[16px] shadow-[0_0_4px_0_rgba(0,0,0,0.24)]"
              aria-label="Search"
            >
              <img
                src="/icons/search-lg.svg"
                alt="Search"
                className="w-4 h-4 opacity-80"
              />
            </button> */}

            {/* Map/Grid 세그먼트 */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-[16px]">
              {/* Map (비활성) -> 메인으로 이동 */}
              <button
                data-active={viewMode === "map"}
                onClick={() =>
                  navigate("/main", {
                    state: { activeTab: "near-me", cityName, townName },
                  })
                }
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

              {/* Grid (활성) */}
              <button
                data-active={viewMode === "grid"}
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
      </div>

      {/* 카드 리스트 */}
      <div className="px-4 pt-20 pb-28 space-y-6">
        {loading && !items.length ? (
          <div className="rounded-[24px] bg-white border border-gray-200 p-6 animate-pulse">
            <div className="text-center">
              <div className="text-gray-600 mb-2">주변 가게 검색 중...</div>
            </div>
          </div>
        ) : items.length > 0 ? (
          items.map((it, idx) => (
            <StoreCard key={idx} {...it} onViewDetails={it.onViewDetails} />
          ))
        ) : (
          <div className="rounded-[24px] bg-white border border-gray-200 p-6 text-center">
            <div className="text-gray-600 mb-2">
              250m 반경 내에 가게가 없습니다
            </div>
            <div className="text-sm text-gray-500">
              다른 위치에서 다시 시도해보세요
            </div>
          </div>
        )}
      </div>
      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default StoreListScreen;
