import React, { useState, useEffect } from "react";

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

interface OnboardingSearchResultProps {
  results: SearchResult[];
  searchQuery: string;
  onBack: () => void;
  onSelect: (placeId: string) => void;
}

const OnboardingSearchResult: React.FC<OnboardingSearchResultProps> = ({
  results,
  searchQuery,
  onBack,
  onSelect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 결과의 place_id로 상세 정보 가져오기
  useEffect(() => {
    const fetchPlaceDetails = async () => {
      if (!window.google?.maps?.places || results.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const service = new google.maps.places.PlacesService(
          document.createElement("div")
        );

        const detailsPromises = results.map(
          (result) =>
            new Promise<PlaceDetails>((resolve) => {
              service.getDetails(
                {
                  placeId: result.place_id,
                  fields: ["name", "types", "formatted_address", "place_id"],
                },
                (place, status) => {
                  if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    place
                  ) {
                    resolve({
                      name: place.name || "",
                      types: place.types || [],
                      formatted_address: place.formatted_address || "",
                      place_id: result.place_id,
                    });
                  } else {
                    // 기본값 반환
                    resolve({
                      name:
                        result.structured_formatting?.main_text ||
                        result.description,
                      types: [],
                      formatted_address:
                        result.structured_formatting?.secondary_text || "",
                      place_id: result.place_id,
                    });
                  }
                }
              );
            })
        );

        const details = await Promise.all(detailsPromises);
        setPlaceDetails(details);
      } catch (error) {
        // console.error("Error fetching place details:", error);
        // 에러 발생 시 기본 정보 사용
        const defaultDetails: PlaceDetails[] = results.map((result) => ({
          name: result.structured_formatting?.main_text || result.description,
          types: [],
          formatted_address: result.structured_formatting?.secondary_text || "",
          place_id: result.place_id,
        }));
        setPlaceDetails(defaultDetails);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [results]);

  const getCategory = (types: string[]): string => {
    // Google Places API의 타입을 한국어 카테고리로 변환
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

    // 기본값
    if (types.some((t) => t.includes("restaurant"))) {
      return "레스토랑";
    }
    if (types.some((t) => t.includes("food"))) {
      return "음식점";
    }
    return "음식점";
  };

  const handleNext = () => {
    if (placeDetails[selectedIndex]) {
      onSelect(placeDetails[selectedIndex].place_id);
    }
  };

  if (loading) {
    return (
      <>
        <div className="bg-white h-[424px] rounded-[16px] p-6 flex flex-1 flex-col items-center justify-center w-full">
          <p className="text-[16px] font-semibold leading-[24px] text-gray-700">
            검색 중...
          </p>
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
  }

  if (placeDetails.length === 0) {
    return (
      <>
        <div className="bg-white h-[424px] rounded-[16px] p-6 flex flex-col items-center justify-between w-full">
          <div className="flex flex-col gap-2 items-start not-italic relative shrink-0 text-center w-full">
            <p className="text-[14px] font-normal leading-[20px] text-gray-600 w-full whitespace-pre-wrap">
              {`OMG There's no '${searchQuery}'`}
            </p>
            <div className="text-[16px] font-semibold leading-[24px] text-gray-700 tracking-[0.16px] w-full whitespace-pre-wrap">
              <p className="mb-0">Please search for</p>
              <p>the restaurant name again!</p>
            </div>
          </div>

          <div className="bg-gray-100 flex gap-2 items-center p-4 rounded-[16px] w-full">
            <p className="flex-1 min-h-0 min-w-0 text-[16px] font-medium leading-[24px] text-gray-900 tracking-[0.16px] whitespace-pre-wrap">
              {searchQuery}
            </p>
          </div>

          <div className="flex gap-2 items-start relative shrink-0 w-full">
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
              onClick={onBack}
              className="bg-redorange-500 flex gap-1 items-center justify-center px-4 py-3 rounded-[16px] w-[200px]"
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
  }

  return (
    <>
      <div className="bg-white rounded-[16px] p-6 flex flex-1 flex-col gap-6 items-center min-h-0 min-w-0 w-full">
        <div className="flex flex-col gap-2 items-start relative shrink-0 w-full">
          <p className="text-[16px] font-semibold leading-[24px] text-gray-700 text-center tracking-[0.16px] w-full whitespace-pre-wrap">
            Which one is it?
          </p>
        </div>

        <div className="flex flex-1 gap-2 items-start overflow-hidden relative shrink-0 w-full">
          <div className="flex flex-1 flex-col gap-2 items-center min-h-0 min-w-0 overflow-y-auto">
            {placeDetails.map((place, index) => {
              const isSelected = index === selectedIndex;
              const category = getCategory(place.types || []);

              return (
                <button
                  key={place.place_id}
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-[8px] p-3 text-left transition-colors ${
                    isSelected
                      ? "bg-gray-50 border border-redorange-500"
                      : "bg-gray-100 border border-transparent"
                  }`}
                >
                  <p className="text-[14px] font-semibold leading-[20px] text-black w-full whitespace-pre-wrap mb-1">
                    {place.name}
                  </p>
                  <div className="flex flex-col gap-0.5 items-start justify-center text-[12px] w-full">
                    <p className="text-[12px] font-semibold leading-[16px] text-teal-500 w-full">
                      {category}
                    </p>
                    <p className="text-[12px] font-normal leading-[14px] text-gray-500 w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {place.formatted_address || "주소 정보 없음"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="bg-gray-200 h-[243px] rounded-[24px] shrink-0 w-1" />
        </div>

        <div className="flex gap-2 items-start relative shrink-0 w-full">
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
            className="bg-redorange-500 flex gap-1 items-center justify-center px-4 py-3 rounded-[16px] w-[200px]"
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

export default OnboardingSearchResult;
