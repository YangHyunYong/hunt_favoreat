import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Rating from "./components/Rating";

interface PlaceDetailsResult {
  displayName: string;
  photos: string[];
  rating?: number;
  userRatingCount?: number;
}

const StoreDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // /store/:displayName
  const location = useLocation();
  const place = (location.state || {}) as PlaceDetailsResult;

  // 기본 데이터 설정 (state 없을 경우 대비)
  const displayName = place.displayName || id || "Unknown Store";
  const heroImage = place.photos?.[0] || "/sample/burger-hero.jpg";
  const img1 = place.photos?.[0] || "/sample/burger.jpg";
  const img2 = place.photos?.[1] || "/sample/bibimbap.jpg";
  const rating = place.rating ?? 4;
  const ratingCount = place.userRatingCount ?? 12;

  // 내가 남길 별점 (0.5 단위)
  const [myRating, setMyRating] = useState<number>(0);

  return (
    <div className="min-h-screen bg-white">
      {/* 공통 헤더 */}
      <Header
        leftElement={
          <button
            onClick={() => navigate(-1)}
            className="p-2 h-15 bg-white"
            aria-label="Back"
          >
            <img
              src="/icons/chevron-left.svg"
              className="w-8 h-8 text-gray-950"
            />
          </button>
        }
        rightElement={
          <button className="p-2 h-15 bg-white" aria-label="Menu">
            <img
              src="/icons/dots-vertical.svg"
              className="w-8 h-8 text-gray-950"
            />
          </button>
        }
      />

      {/* 히어로 이미지 */}
      <div className="relative">
        <img
          src={heroImage}
          alt={displayName}
          className="w-full h-[280px] object-cover"
        />
      </div>

      {/* 타이틀 & 요약 */}
      <div className="px-4 py-5 border-b bg-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-place-title leading-snug flex-1 min-w-0 line-clamp-2">
            {displayName}
          </div>
          <div className="flex flex-none shrink-0">
            <button className="p-3.5 bg-gray-100 rounded-[16px]">
              <img src="/icons/share-07.svg" className="w-5 h-5" />
            </button>
            <button className="p-3.5 bg-gray-100 rounded-[16px]">
              <img src="/icons/bookmark.svg" className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {/* 가게의 고정 별점 표시 (읽기용) */}
            <div className="text-orange-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>{i < Math.round(rating) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-rating-count">({ratingCount})</span>
          </div>
          <div className="text-location-content text-gray-600">
            At my location{" "}
            <span className="text-location-content text-redorange-500">
              909m
            </span>
          </div>
        </div>
      </div>

      {/* 리뷰 남기기: Rating 컴포넌트 적용 (0.5 점 단위 선택) */}
      <div className="flex px-4 py-4 border-b justify-between items-center">
        <p className="text-review-title text-gray-700 ml-4">리뷰 남기기</p>

        <Rating
          value={myRating}
          onChange={setMyRating}
          step={0.5}
          icon="/icons/star.svg"
          sizePx={25}
        />
      </div>

      {/* 리뷰 리스트 (샘플) */}
      <div className="divide-y">
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 text-[14px] rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
                T
              </div>
              <div className="text-review-title text-blue-700">TomatoCat</div>
            </div>
            <button>⋮</button>
          </div>

          <div className="text-orange-500 mb-2">★ ★ ★ ☆ ☆</div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <img src={img1} className="w-full h-32 object-cover rounded-xl" />
            <img src={img2} className="w-full h-32 object-cover rounded-xl" />
          </div>

          <p className="text-review-content text-gray-800 mb-2">
            너무너무 좋아요! 너무너무 좋아요! 너무너무 좋아요! 너무너무 좋아요!
          </p>

          <div className="text-xs text-gray-400">1h</div>
        </div>

        <div className="px-4 py-4 space-y-2">
          <div className="flex items-center gap-1 mb-4">
            <div className="w-6 h-6 text-[14px] rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
              U
            </div>
            <div className="text-review-title text-gray-700">user</div>
          </div>
          <div className="text-orange-500 mb-2">★ ★ ★ ★ ☆</div>
          <p className="text-gray-700">너무너무 좋아요!</p>
          <div className="text-xs text-gray-400">1h</div>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailScreen;
