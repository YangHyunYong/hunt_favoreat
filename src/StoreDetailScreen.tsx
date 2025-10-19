import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Rating from "./components/Rating";
import ActionMenu from "./components/ActionMenu";
import ConfirmModal from "./components/ConfirmModal";

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
  // 리뷰 작성 UI (확장형)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]); // object URL 보관
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const MAX_IMAGES = 2;
  const MAX_LEN = 400;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const openComposer = () => setIsReviewOpen(true);

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remain = Math.max(0, MAX_IMAGES - reviewImages.length);
    const selected = Array.from(files).slice(0, remain);
    const urls = selected.map((f) => URL.createObjectURL(f));
    setReviewImages((prev) => [...prev, ...urls]);
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuWrapRef.current) return;
      const target = e.target as Node;
      if (!menuWrapRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const canSubmit = reviewText.trim().length > 0;

  const onSubmitReview = () => {
    if (!canSubmit) return;
    // TODO: 서버에 업로드 로직 연결
    console.log("submit review", {
      rating: myRating,
      text: reviewText,
      images: reviewImages,
    });
    // 초기화 및 닫기
    setIsReviewOpen(false);
    setReviewText("");
    setReviewImages([]);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "56px";
    }
    setMyRating(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    setReviewText(el.value);

    if (!textAreaRef.current) return;
    const ta = textAreaRef.current;

    // 현재 보이는 높이보다 내용이 커질 때만 확대 (초기 한 글자 입력 시 '점프' 방지)
    if (el.scrollHeight > ta.clientHeight) {
      ta.style.height = "auto";
      ta.style.height = `${el.scrollHeight}px`;
    }
    // 내용이 줄어들어도 높이는 유지 (원하면 줄어들도록 변경 가능)
  };

  // 히어로 이미지: 없거나 로드 실패 시 placeholder 표시
  const ImgHeroOrPlaceholder: React.FC<{ src?: string; alt?: string }> = ({
    src,
    alt,
  }) => {
    const [errored, setErrored] = useState(false);
    if (!src || errored) {
      return (
        <div
          className="flex h-[280px] w-full justify-center items-center bg-gray-200 text-gray-500"
          aria-label="no image"
        >
          no Image
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        className="w-full h-[280px] object-cover"
        decoding="async"
        loading="eager"
        onError={() => setErrored(true)}
      />
    );
  };

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
        centerElement={
          <div className="text-gray-600 text-rating-count">FavorEat</div>
        }
      />

      {/* 히어로 이미지 */}
      <div className="relative">
        <ImgHeroOrPlaceholder src={heroImage} alt={displayName} />
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
            <button
              type="button"
              className="p-3.5 bg-gray-100 rounded-[16px]"
              onClick={() => setIsBookmarked((v) => !v)}
            >
              <img
                src={
                  isBookmarked
                    ? "/icons/bookmark-added.svg"
                    : "/icons/bookmark.svg"
                }
                className="w-5 h-5"
                alt={isBookmarked ? "Bookmarked" : "Not bookmarked"}
              />
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

      {/* 리뷰 남기기: 확장형 컴포저 */}
      {!isReviewOpen ? (
        <div className="flex px-4 py-4 justify-between items-center">
          <button
            className="text-review-title text-gray-700 ml-4"
            onClick={openComposer}
          >
            리뷰 남기기
          </button>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <img
                key={i}
                src="/icons/star.svg"
                alt="star"
                className="w-[25px] h-[25px] m-[7.5px] opacity-80"
              />
            ))}
          </div>
        </div>
      ) : (
        <div id="review-composer" className="px-4 py-4 border-b">
          {/* 헤더: 타이틀 + 별점 */}
          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              className="text-review-title text-gray-700 ml-4"
              onClick={() => setIsReviewOpen(false)}
              aria-expanded={isReviewOpen}
              aria-controls="review-composer"
            >
              Write a review
            </button>
            <Rating
              value={myRating}
              onChange={setMyRating}
              step={0.5}
              icon="/icons/star.svg"
            />
          </div>

          {/* 선택된 이미지 썸네일 */}
          {reviewImages.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {reviewImages.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    className="w-full h-[136px] object-cover rounded-[16px]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-800"
                    aria-label="remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 텍스트 입력 */}
          <textarea
            ref={textAreaRef}
            value={reviewText}
            onChange={handleChange}
            placeholder="Please share your experiences!"
            maxLength={MAX_LEN}
            className="w-full h-[56px] min-h-[56px] bg-gray-100 rounded-[16px] p-4 text-gray-800 placeholder:text-gray-400 placeholder:text-placeholder-content outline-none overflow-hidden resize-none transition-[height] duration-200 ease-in-out"
          />
          <div className="flex justify-end text-review-text-count text-gray-400 px-2 mt-1">
            {reviewText.length}/{MAX_LEN}
          </div>

          {/* 하단: 이미지 추가, 글자수, 확인버튼 */}
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg bg-transparent"
                disabled={reviewImages.length >= MAX_IMAGES}
                aria-label="add images"
              >
                <img src="/icons/image.svg" className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">
                ({reviewImages.length}/{MAX_IMAGES})
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickImages}
              />
            </div>
            <button
              onClick={onSubmitReview}
              disabled={!canSubmit}
              className={`px-4 py-2.5 rounded-[12px] text-button-content ${canSubmit ? "bg-gray-900 text-gray-50" : "bg-gray-300 text-gray-400"}`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <div className="h-2 bg-gray-200"></div>

      {/* 리뷰 리스트 (샘플) */}
      {false ? ( // 리뷰 데이터가 있을 때 true로 변경 또는 조건 연결
        <div className="divide-y">
          <div className="px-5 py-5">
            <div
              ref={menuWrapRef}
              className="flex items-center justify-between mb-4 relative"
            >
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 text-[14px] rounded-full bg-orange-100 flex items-center justify-center font-semibold text-orange-600">
                  T
                </div>
                <div className="text-review-title text-blue-700">TomatoCat</div>
              </div>
              <button
                type="button"
                className="w-6 h-6 flex items-center justify-center text-2xl leading-none"
                onClick={() => setIsMenuOpen((v) => !v)}
              >
                ⋮
              </button>
              <ActionMenu
                open={isMenuOpen}
                onDelete={() => {
                  setIsMenuOpen(false);
                  setShowConfirm(true);
                }}
                onShare={() => {
                  setIsMenuOpen(false); /* 공유 로직 */
                }}
              />

              <ConfirmModal
                open={showConfirm}
                variant="confirm"
                message="Are you sure you want to delete the review?"
                cancelText="No, I won't."
                confirmText="Yes, delete it."
                onClose={() => setShowConfirm(false)}
                onCancel={() => setShowConfirm(false)}
                onConfirm={() => {
                  setShowConfirm(false);
                  // 실제 삭제 로직…
                  setShowDone(true);
                }}
              />
              <ConfirmModal
                open={showDone}
                variant="success"
                message="The review has been successfully deleted!"
                okText="okay"
                onClose={() => setShowDone(false)}
                onConfirm={() => setShowDone(false)}
              />
            </div>

            <div className="text-orange-500 mb-2">★ ★ ★ ☆ ☆</div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <img src={img1} className="w-full h-32 object-cover rounded-xl" />
              <img src={img2} className="w-full h-32 object-cover rounded-xl" />
            </div>

            <p className="text-review-content text-gray-800 mb-2">
              너무너무 좋아요! 너무너무 좋아요! 너무너무 좋아요! 너무너무
              좋아요!
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
      ) : (
        <div className="flex flex-col justify-center items-center text-center bg-gray-200 text-gray-600 h-[200px]">
          <p className="text-sm mb-1">no review yet</p>
          <p className="text-lg font-semibold">Be the first reviewer</p>
          <p className="text-md font-semibold">
            Just fill in that empty star up there!
          </p>
        </div>
      )}
    </div>
  );
};

export default StoreDetailScreen;
