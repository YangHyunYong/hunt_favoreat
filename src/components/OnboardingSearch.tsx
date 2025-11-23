import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  name: string;
  types?: string[];
  formatted_address?: string;
  place_id: string;
}

interface PlaceDetailsResult {
  displayName: string;
  photos: string[];
  rating?: number;
  userRatingCount?: number;
  placeId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// toSlug 함수: 이름을 URL slug로 변환
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface OnboardingSearchProps {
  onBack: () => void;
  onSearchComplete: (results: SearchResult[], searchQuery: string) => void;
}

const OnboardingSearch: React.FC<OnboardingSearchProps> = ({
  onBack,
  onSearchComplete,
}) => {
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPred, setLoadingPred] = useState(false);
  const [selectedPrediction, setSelectedPrediction] =
    useState<SearchResult | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [fullPlaceDetails, setFullPlaceDetails] =
    useState<PlaceDetailsResult | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sessionTokenRef = useRef<any | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // 실시간 검색: 입력할 때마다 검색 수행 (선택된 항목이 있을 때는 검색하지 않음)
  useEffect(() => {
    // 선택된 항목이 있으면 검색하지 않음
    if (selectedPrediction) {
      return;
    }

    let timer: any;
    async function run() {
      if (!restaurantName.trim()) {
        setPredictions([]);
        setLoadingPred(false);
        return;
      }

      if (!window.google?.maps?.places) {
        // console.warn("Google Maps API is not loaded");
        setPredictions([]);
        setLoadingPred(false);
        return;
      }

      setLoadingPred(true);
      try {
        // 기존 Places API 사용 (비용 절약) - MainPage와 동일하게 types 제거
        const svc = new google.maps.places.AutocompleteService();
        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new google.maps.places.AutocompleteSessionToken();
        }
        svc.getPlacePredictions(
          {
            input: restaurantName,
            sessionToken: sessionTokenRef.current,
            // types 제거: MainPage처럼 모든 장소 타입 검색 가능
          },
          (
            res: google.maps.places.AutocompletePrediction[] | null,
            status: google.maps.places.PlacesServiceStatus
          ) => {
            // console.log("Search status:", status, "Results:", res?.length || 0);
            if (status === google.maps.places.PlacesServiceStatus.OK && res) {
              setPredictions(res);
            } else {
              // console.warn("Search failed or no results:", status);
              setPredictions([]);
            }
            setLoadingPred(false);
          }
        );
      } catch (e) {
        // console.error("Search error:", e);
        setLoadingPred(false);
        setPredictions([]);
      }
    }
    timer = setTimeout(run, 250);
    return () => clearTimeout(timer);
  }, [restaurantName, selectedPrediction]);

  // 선택된 항목의 상세 정보 가져오기
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (!selectedPrediction) {
        setPlaceDetails(null);
        setFullPlaceDetails(null);
        return;
      }

      // 콘솔에 선택된 가게 정보 출력
      // console.log("=== 선택된 가게 정보 ===");
      // console.log("selectedPrediction:", selectedPrediction);
      // console.log("place_id:", selectedPrediction.place_id);
      // console.log("place_id 존재 여부:", !!selectedPrediction.place_id);
      // console.log("description:", selectedPrediction.description);
      // console.log(
      //         "structured_formatting:",
      //         selectedPrediction.structured_formatting
      //       );

      if (!window.google?.maps?.places) {
        // API가 없으면 기본 정보 사용
        setPlaceDetails({
          name:
            selectedPrediction.structured_formatting?.main_text ||
            selectedPrediction.description,
          types: [],
          formatted_address:
            selectedPrediction.structured_formatting?.secondary_text || "",
          place_id: selectedPrediction.place_id,
        });
        return;
      }

      setLoadingDetails(true);
      try {
        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        // 기본 정보 가져오기 (카테고리 표시용)
        service.getDetails(
          {
            placeId: selectedPrediction.place_id,
            fields: ["name", "types", "formatted_address", "place_id"],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              setPlaceDetails({
                name: place.name || "",
                types: place.types || [],
                formatted_address: place.formatted_address || "",
                place_id: selectedPrediction.place_id,
              });
            } else {
              // 기본값 반환
              setPlaceDetails({
                name:
                  selectedPrediction.structured_formatting?.main_text ||
                  selectedPrediction.description,
                types: [],
                formatted_address:
                  selectedPrediction.structured_formatting?.secondary_text ||
                  "",
                place_id: selectedPrediction.place_id,
              });
            }
          }
        );

        // 전체 정보 가져오기 (StoreDetailPage 이동용)
        service.getDetails(
          {
            placeId: selectedPrediction.place_id,
            fields: [
              "name",
              "photos",
              "rating",
              "user_ratings_total",
              "geometry",
              "formatted_address",
            ],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              const photos: string[] =
                place.photos?.map((photo: any) =>
                  photo.getUrl({ maxHeight: 400 })
                ) || [];

              const fullDetails: PlaceDetailsResult = {
                displayName: place.name || "",
                photos,
                rating: place.rating || undefined,
                userRatingCount: place.user_ratings_total || undefined,
                placeId: selectedPrediction.place_id,
                address: place.formatted_address || undefined,
                latitude: place.geometry?.location?.lat() || undefined,
                longitude: place.geometry?.location?.lng() || undefined,
              };

              setFullPlaceDetails(fullDetails);
              // console.log("=== 전체 상세 정보 ===");
              // console.log("fullPlaceDetails:", fullDetails);
            } else {
              // 기본값 반환
              setFullPlaceDetails({
                displayName:
                  selectedPrediction.structured_formatting?.main_text ||
                  selectedPrediction.description,
                photos: [],
                placeId: selectedPrediction.place_id,
                address:
                  selectedPrediction.structured_formatting?.secondary_text ||
                  undefined,
              });
            }
            setLoadingDetails(false);
          }
        );
      } catch (error) {
        // console.error("Error fetching place details:", error);
        // 에러 발생 시 기본 정보 사용
        setPlaceDetails({
          name:
            selectedPrediction.structured_formatting?.main_text ||
            selectedPrediction.description,
          types: [],
          formatted_address:
            selectedPrediction.structured_formatting?.secondary_text || "",
          place_id: selectedPrediction.place_id,
        });
        setFullPlaceDetails({
          displayName:
            selectedPrediction.structured_formatting?.main_text ||
            selectedPrediction.description,
          photos: [],
          placeId: selectedPrediction.place_id,
          address:
            selectedPrediction.structured_formatting?.secondary_text ||
            undefined,
        });
        setLoadingDetails(false);
      }
    };

    fetchPlaceDetails();
  }, [selectedPrediction]);

  // 카테고리 변환 함수
  const getCategory = (types: string[]): string => {
    const typeMap: { [key: string]: string } = {
      restaurant: "레스토랑",
      food: "음식점",
      meal_takeaway: "테이크아웃",
      cafe: "카페",
      bar: "바",
      bakery: "베이커리",
      meal_delivery: "배달",
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    if (types.some((t) => t.includes("restaurant"))) {
      return "레스토랑";
    }
    if (types.some((t) => t.includes("food"))) {
      return "음식점";
    }
    return "음식점";
  };

  // 리스트 닫기 함수
  const closePredictions = () => {
    setPredictions([]);
    setLoadingPred(false);
  };

  // ESC 키 및 외부 클릭 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePredictions();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        closePredictions();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 컴포넌트 마운트 시 포커스 및 세션 토큰 초기화
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
    if (window.google?.maps?.places) {
      sessionTokenRef.current =
        new window.google.maps.places.AutocompleteSessionToken();
    } else {
      sessionTokenRef.current = null;
    }

    return () => {
      setRestaurantName("");
      setPredictions([]);
      sessionTokenRef.current = null;
    };
  }, []);

  const handlePredictionClick = (prediction: any) => {
    const result: SearchResult = {
      place_id: prediction.place_id,
      description: prediction.description,
      structured_formatting: prediction.structured_formatting,
    };
    setSelectedPrediction(result);
    setRestaurantName(
      prediction.structured_formatting?.main_text || prediction.description
    );
    closePredictions();
  };

  const handleNext = async () => {
    if (selectedPrediction && fullPlaceDetails) {
      // 선택된 항목이 있고 전체 상세 정보가 있으면 StoreDetailPage로 이동
      const slug = toSlug(fullPlaceDetails.displayName || "store");
      // console.log("=== StoreDetailPage로 이동 ===");
      // console.log("slug:", slug);
      // console.log("fullPlaceDetails:", fullPlaceDetails);
      navigate(`/store/${slug}`, { state: fullPlaceDetails });
      return;
    }

    if (selectedPrediction) {
      // 선택된 항목이 있지만 전체 상세 정보가 아직 로딩 중인 경우
      // 기존 방식으로 처리 (OnboardingSearchResult로 이동)
      onSearchComplete([selectedPrediction], restaurantName);
    } else if (predictions.length > 0) {
      // 선택된 항목이 없고 검색 결과가 있으면 첫 번째 항목 선택
      const firstResult: SearchResult[] = [
        {
          place_id: predictions[0].place_id,
          description: predictions[0].description,
          structured_formatting: predictions[0].structured_formatting,
        },
      ];
      onSearchComplete(firstResult, restaurantName);
    } else if (restaurantName.trim()) {
      // 검색 결과가 없어도 입력값이 있으면 빈 배열 전달 (검색 결과 화면에서 "결과 없음" 표시)
      onSearchComplete([], restaurantName);
    }
  };

  return (
    <>
      <div className="bg-white h-[424px] rounded-[16px] p-6 flex flex-col gap-4 items-center w-full relative">
        <div className="flex flex-col gap-2 items-start leading-[0] text-center w-full">
          <div className="text-[14px] font-normal leading-[20px] text-gray-600 w-full whitespace-pre-wrap">
            {/* <p className="mb-0">Got it! It's in Anyang,</p>
            <p>Gyeonggi-do, South Korea, right?</p> */}
          </div>
          <div className="text-[16px] font-semibold leading-[24px] text-gray-700 tracking-[0.16px] w-full whitespace-pre-wrap">
            <p className="mb-0">What is the name of</p>
            <p>the restaurant you visited?</p>
          </div>
        </div>

        <div className="w-full relative" ref={searchContainerRef}>
          <div className="bg-gray-100 flex gap-2 items-center p-4 rounded-[16px] w-full">
            <input
              ref={inputRef}
              type="text"
              value={restaurantName}
              onChange={(e) => {
                setRestaurantName(e.target.value);
                setSelectedPrediction(null);
                setPlaceDetails(null);
                setFullPlaceDetails(null);
              }}
              placeholder="restaurant name"
              className="flex-1 min-h-0 min-w-0 text-[16px] font-medium leading-[24px] text-gray-400 tracking-[0.16px] whitespace-pre-wrap bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>

          {/* 자동완성 리스트: 선택된 항목이 없을 때만 표시 */}
          {!selectedPrediction &&
            (predictions.length > 0 ||
              loadingPred ||
              (restaurantName.trim() &&
                predictions.length === 0 &&
                !loadingPred)) && (
              <div className="mt-2 w-full bg-white rounded-[16px] shadow-[0_2px_10px_rgba(0,0,0,0.12)] overflow-hidden max-h-[50vh] overflow-y-auto absolute top-full z-10">
                {loadingPred && (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    검색 중…
                  </div>
                )}
                {!loadingPred &&
                  predictions.length === 0 &&
                  restaurantName.trim() && (
                    <div className="px-3 py-3 text-sm text-gray-500">
                      결과가 없습니다
                    </div>
                  )}
                {!loadingPred &&
                  predictions.map((p: any) => (
                    <button
                      key={p.place_id}
                      onClick={() => handlePredictionClick(p)}
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

        {/* 선택된 가게 정보 표시 */}
        {selectedPrediction && (
          <div className="w-full">
            {loadingDetails ? (
              <div className="w-full rounded-[8px] p-3 bg-gray-50 border border-redorange-500">
                <p className="text-[14px] font-semibold text-gray-900">
                  로딩 중...
                </p>
              </div>
            ) : placeDetails ? (
              <div className="w-full rounded-[8px] p-3 bg-gray-50 border border-redorange-500">
                <p className="text-[14px] font-semibold leading-[20px] text-black w-full whitespace-pre-wrap mb-1">
                  {placeDetails.name}
                </p>
                <div className="flex flex-col gap-0.5 items-start justify-center text-[12px] w-full">
                  <p className="text-[12px] font-semibold leading-[16px] text-teal-500 w-full">
                    {getCategory(placeDetails.types || [])}
                  </p>
                  <p className="text-[12px] font-normal leading-[14px] text-gray-500 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {placeDetails.formatted_address || "주소 정보 없음"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex gap-2 items-start w-full mt-auto">
          <button
            onClick={onBack}
            className="border border-redorange-500 border-solid flex-1 min-h-0 min-w-0 rounded-[16px]"
          >
            <div className="flex gap-1 items-center justify-center px-4 py-3 rounded-[inherit] w-full">
              <p className="text-[16px] font-bold leading-[24px] text-redorange-500 tracking-[0.16px]">
                Back
              </p>
            </div>
          </button>
          <button
            onClick={handleNext}
            disabled={!restaurantName.trim()}
            className="bg-redorange-500 flex gap-1 items-center justify-center px-4 py-3 rounded-[16px] w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <p className="text-[16px] font-bold leading-[24px] text-gray-50 tracking-[0.16px]">
              Next
            </p>
          </button>
        </div>
      </div>

      <div className="relative w-[160px] h-[160px] shrink-0">
        <img
          src="/icons/character.svg"
          alt="Character"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        />
      </div>
    </>
  );
};

export default OnboardingSearch;
