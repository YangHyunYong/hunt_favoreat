import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import {
  getReviewsWithImages,
  getBookmarkPlacesWithReviews,
  supabase,
} from "../supabaseClient";
import Header from "../components/Header";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";

// MainPage.tsx와 동일한 fetchPlaceDetails 함수
export async function fetchPlaceDetails(placeId: string): Promise<{
  displayName: string;
  photos: string[];
  rating?: number;
  userRatingCount?: number;
  placeId?: string;
  latitude?: number;
  longitude?: number;
}> {
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
        fields: ["name", "photos", "rating", "user_ratings_total", "geometry"],
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
            rating: place.rating || undefined,
            userRatingCount: place.user_ratings_total || undefined,
            placeId: placeId,
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

interface BookmarkData {
  id: string;
  name: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  reviews: {
    id: string;
    rating: number;
    body?: string;
    created_at: string;
    author_wallet: string;
    photos: string[];
  }[];
  totalReviews: number;
  averageRating: number;
  placeImage?: string; // Google Places API에서 가져온 가게 이미지
}

interface ReviewData {
  id: string;
  place_id: string;
  author_wallet: string;
  body?: string;
  rating: number;
  created_at: string;
  photos: string[];
  like_count: number;
  place: {
    id: string;
    name: string;
    address_text?: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

const BookmarkScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { isConnected: isReownConnected, address: reownAddress } =
    useAppKitAccount();
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookmarks" | "reviews">(
    "bookmarks"
  );
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 자동 로그인 시에는 useAccount, 그 외에는 useAppKitAccount 사용
  const isWalletConnected = isConnected || isReownConnected;
  const walletAddress = isConnected ? address : reownAddress;

  // 북마크 이미지 로드 함수
  const loadBookmarkImages = async (bookmarks: BookmarkData[]) => {
    const bookmarksWithImages = await Promise.all(
      bookmarks.map(async (bookmark) => {
        try {
          // places 테이블에서 google_place_id 조회
          const { data: placeData, error: placeError } = await supabase
            .from("places")
            .select("google_place_id")
            .eq("id", bookmark.id)
            .single();

          if (placeError || !placeData?.google_place_id) {
            console.log(`북마크 ${bookmark.name}의 google_place_id 없음`);
            return bookmark;
          }

          // Google Places API로 이미지 가져오기
          const placeDetails = await fetchPlaceDetails(
            placeData.google_place_id
          );

          return {
            ...bookmark,
            placeImage: placeDetails.photos[0] || undefined,
          };
        } catch (error) {
          console.error(`북마크 ${bookmark.name} 이미지 로드 실패:`, error);
          return bookmark;
        }
      })
    );

    return bookmarksWithImages;
  };

  useEffect(() => {
    const loadData = async () => {
      if (isWalletConnected && walletAddress) {
        try {
          console.log("로딩 시작 - 지갑 주소:", walletAddress);
          const [bookmarkData, reviewData] = await Promise.all([
            getBookmarkPlacesWithReviews(walletAddress),
            getReviewsWithImages(undefined, walletAddress),
          ]);
          console.log("북마크 데이터:", bookmarkData);
          console.log("리뷰 데이터:", reviewData);
          console.log("리뷰 데이터 개수:", reviewData?.length || 0);

          // 북마크 이미지 로드
          const bookmarksWithImages = await loadBookmarkImages(bookmarkData);
          setBookmarks(bookmarksWithImages);
          setReviews(reviewData);
        } catch (error) {
          console.error("데이터 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadData();
  }, [isWalletConnected, walletAddress]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBookmarkClick = async (bookmark: BookmarkData) => {
    try {
      // places 테이블에서 google_place_id 조회
      const { data: placeData, error: placeError } = await supabase
        .from("places")
        .select("google_place_id")
        .eq("id", bookmark.id)
        .single();

      if (placeError || !placeData?.google_place_id) {
        console.log(`북마크 ${bookmark.name}의 google_place_id 없음`);
        // 기본 데이터로 이동
        const slug = bookmark.name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, "-")
          .replace(/^-+|-+$/g, "");
        navigate(`/store/${slug}`, {
          state: {
            displayName: bookmark.name,
            placeId: bookmark.id,
            distanceMeters: undefined,
          },
        });
        return;
      }

      // Google Places API로 상세 정보 가져오기
      const placeDetails = await fetchPlaceDetails(placeData.google_place_id);

      const slug = bookmark.name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-+|-+$/g, "");

      navigate(`/store/${slug}`, {
        state: {
          displayName: placeDetails.displayName || bookmark.name,
          placeId: placeData.google_place_id,
          photos: placeDetails.photos,
          rating: placeDetails.rating,
          userRatingCount: placeDetails.userRatingCount,
          latitude: placeDetails.latitude,
          longitude: placeDetails.longitude,
          distanceMeters: undefined, // 거리는 StoreDetailPage에서 계산
        },
      });
    } catch (error) {
      console.error("북마크 클릭 시 데이터 로드 실패:", error);
      // 에러 시 기본 데이터로 이동
      const slug = bookmark.name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]+/g, "-")
        .replace(/^-+|-+$/g, "");
      navigate(`/store/${slug}`, {
        state: {
          displayName: bookmark.name,
          placeId: bookmark.id,
          distanceMeters: undefined,
        },
      });
    }
  };

  const handleRemoveBookmark = async (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (!walletAddress) return;

      // 북마크를 찾기 위해 place_id로 검색
      const { data: bookmarkData, error: findError } = await supabase
        .from("bookmarks")
        .select("*")
        .eq("place_id", placeId)
        .eq("wallet_address", walletAddress.toLowerCase())
        .single();

      if (findError) {
        console.error("북마크 찾기 실패:", findError);
        return;
      }

      if (bookmarkData) {
        // 북마크 삭제 (place_id와 wallet_address로 삭제)
        const { error: deleteError } = await supabase
          .from("bookmarks")
          .delete()
          .eq("place_id", placeId)
          .eq("wallet_address", walletAddress.toLowerCase());

        if (deleteError) {
          console.error("북마크 삭제 실패:", deleteError);
          return;
        }

        setBookmarks((prev) => prev.filter((b) => b.id !== placeId));
      }
    } catch (error) {
      console.error("북마크 제거 실패:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-gray-600">북마크를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header
        leftElement={
          <button
            onClick={handleBack}
            className="bg-white/60 flex items-center"
          >
            <img src="/icons/chevron-left.svg" className="w-8 h-8" alt="뒤로" />
          </button>
        }
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

      <div className="p-5">
        {/* Toggle */}
        <div className="bg-gray-300 rounded-2xl mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`flex-1 rounded-2xl p-3 flex items-center justify-center gap-2 transition-all ${
                activeTab === "bookmarks"
                  ? "bg-white shadow-[0px_0px_4px_0px_rgba(0,0,0,0.24)]"
                  : ""
              }`}
            >
              <img
                src={
                  activeTab === "bookmarks"
                    ? "/icons/bookmark-added.svg"
                    : "/icons/bookmark.svg"
                }
                className="w-4 h-4"
                alt="Bookmark"
              />
              <p
                className={`text-xs font-semibold ${
                  activeTab === "bookmarks" ? "text-gray-950" : "text-gray-600"
                }`}
              >
                Bookmark List ({bookmarks.length})
              </p>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 rounded-2xl p-3 flex items-center justify-center gap-2 transition-all ${
                activeTab === "reviews"
                  ? "bg-white shadow-[0px_0px_4px_0px_rgba(0,0,0,0.24)]"
                  : ""
              }`}
            >
              <img
                src={
                  activeTab === "reviews"
                    ? "/icons/star-added.svg"
                    : "/icons/star.svg"
                }
                className="w-4 h-4"
                alt="Reviews"
              />
              <p
                className={`text-xs font-semibold ${
                  activeTab === "reviews" ? "text-gray-950" : "text-gray-600"
                }`}
              >
                My Reviews ({reviews.length})
              </p>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "bookmarks" ? (
            bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <img
                  src="/icons/box.svg"
                  alt="빈 상태"
                  className="w-16 h-16 mb-4 opacity-60"
                />
                <p className="text-gray-500">북마크한 식당이 아직 없습니다</p>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  onClick={() => handleBookmarkClick(bookmark)}
                  className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <p className="flex-1 text-base font-semibold text-gray-700 truncate">
                      {bookmark.name}
                    </p>
                    <button
                      onClick={(e) => handleRemoveBookmark(bookmark.id, e)}
                      className="bg-gray-100 p-1 rounded-lg flex items-center justify-center"
                    >
                      <img
                        src="/icons/trash.svg"
                        className="w-5 h-5"
                        alt="삭제"
                      />
                    </button>
                  </div>

                  {/* 가게 이미지 표시 */}
                  {bookmark.placeImage ? (
                    <div className="h-16 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={bookmark.placeImage}
                        alt={`${bookmark.name} 이미지`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(
                            "가게 이미지 로드 실패:",
                            bookmark.placeImage
                          );
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : bookmark.reviews.length > 0 &&
                    bookmark.reviews[0].photos.length > 0 ? (
                    <div className="h-16 rounded-lg mb-4 flex gap-1">
                      {bookmark.reviews[0].photos
                        .slice(0, 2)
                        .map((photo, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-lg overflow-hidden"
                          >
                            <img
                              src={photo}
                              alt={`리뷰 이미지 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="h-16 rounded-lg bg-gray-200 mb-4 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">이미지 없음</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-teal-500">
                      Restaurant
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {bookmark.address_text || "주소 정보 없음"}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="text-orange-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>
                              {i < Math.round(bookmark.averageRating)
                                ? "★"
                                : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <img
                src="/icons/box.svg"
                alt="빈 상태"
                className="w-16 h-16 mb-4 opacity-60"
              />
              <p className="text-gray-500">작성한 리뷰가 아직 없습니다</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                onClick={async () => {
                  if (review.place) {
                    try {
                      // places 테이블에서 google_place_id 조회
                      const { data: placeData, error: placeError } =
                        await supabase
                          .from("places")
                          .select("google_place_id")
                          .eq("id", review.place_id)
                          .single();

                      if (placeError || !placeData?.google_place_id) {
                        console.log(
                          `리뷰 ${review.place.name}의 google_place_id 없음`
                        );
                        // 기본 데이터로 이동
                        const slug = review.place.name
                          .toLowerCase()
                          .replace(/[^a-z0-9가-힣]+/g, "-")
                          .replace(/^-+|-+$/g, "");
                        navigate(`/store/${slug}`, {
                          state: {
                            displayName: review.place.name,
                            placeId: review.place_id,
                            distanceMeters: undefined,
                          },
                        });
                        return;
                      }

                      // Google Places API로 상세 정보 가져오기
                      const placeDetails = await fetchPlaceDetails(
                        placeData.google_place_id
                      );

                      const slug = review.place.name
                        .toLowerCase()
                        .replace(/[^a-z0-9가-힣]+/g, "-")
                        .replace(/^-+|-+$/g, "");

                      navigate(`/store/${slug}`, {
                        state: {
                          displayName:
                            placeDetails.displayName || review.place.name,
                          placeId: placeData.google_place_id,
                          photos: placeDetails.photos,
                          rating: placeDetails.rating,
                          userRatingCount: placeDetails.userRatingCount,
                          latitude: placeDetails.latitude,
                          longitude: placeDetails.longitude,
                          distanceMeters: undefined, // 거리는 StoreDetailPage에서 계산
                        },
                      });
                    } catch (error) {
                      console.error("리뷰 클릭 시 데이터 로드 실패:", error);
                      // 에러 시 기본 데이터로 이동
                      const slug = review.place.name
                        .toLowerCase()
                        .replace(/[^a-z0-9가-힣]+/g, "-")
                        .replace(/^-+|-+$/g, "");
                      navigate(`/store/${slug}`, {
                        state: {
                          displayName: review.place.name,
                          placeId: review.place_id,
                          distanceMeters: undefined,
                        },
                      });
                    }
                  }
                }}
                className="bg-gray-50 rounded-2xl p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-4">
                  <p className="flex-1 text-base font-semibold text-gray-700 truncate">
                    {review.place?.name || "Unknown"}
                  </p>
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    {review.body || "리뷰 내용 없음"}
                  </p>

                  {review.photos.length > 0 && (
                    <div className="flex gap-2">
                      {review.photos.slice(0, 3).map((photo, index) => {
                        // photo가 객체인 경우 url 속성 사용, 문자열인 경우 그대로 사용
                        const imageUrl =
                          typeof photo === "string"
                            ? photo
                            : (photo as any).url;
                        return (
                          <div
                            key={index}
                            className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center"
                          >
                            <img
                              src={imageUrl}
                              alt={`리뷰 이미지 ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                console.error(
                                  `리뷰 이미지 로드 실패 [${index}]:`,
                                  imageUrl
                                );
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="text-orange-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>
                          {i < Math.floor(review.rating) ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-center items-center gap-1">
                      <img
                        src="/icons/thumbs-up.svg"
                        alt="좋아요"
                        className="w-4 h-4"
                      />
                      <span className="text-xs">{review.like_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />
    </div>
  );
};

export default BookmarkScreen;
