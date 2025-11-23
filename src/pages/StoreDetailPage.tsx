import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { sdk } from "@farcaster/frame-sdk";
import Header from "../components/Header";
import Rating from "../components/Rating";
import ConfirmModal from "../components/ConfirmModal";
import { useFavoreatApi } from "../hooks/useFavoreatApi";
import ConnectWalletButton from "../components/ConnectWalletButton";
import UserMenu from "../components/UserMenu";

import {
  supabase,
  getReviewsWithImages,
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  softDeleteReview,
  ensurePlaceExists,
  addPointsToUser,
  addLikeToReview,
  getReviewCountLast24Hours,
  getPlaceReviewStats,
} from "../supabaseClient";

interface PlaceDetailsResult {
  displayName: string;
  photos: string[];
  placeId?: string;
  distanceMeters?: number; // StoreListScreen에서 전달받은 거리
  address?: string; // 주소 정보
  latitude?: number; // 위도
  longitude?: number; // 경도
}

interface ReviewData {
  id: string;
  place_id: string;
  author_wallet: string;
  rating: number;
  body: string | null;
  created_at: string;
  like_count: number;
  photos: Array<
    | string
    | {
        id: string;
        url: string;
        exif_latitude: number | null;
        exif_longitude: number | null;
      }
  >;
  users?: {
    user_name: string | null;
    user_pfp_url: string | null;
    wallet_address: string;
  } | null;
}

// 히어로 이미지: 없거나 로드 실패 시 placeholder 표시
const ImgHeroOrPlaceholder: React.FC<{ src?: string; alt?: string }> =
  React.memo(({ src, alt }) => {
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
  });

const StoreDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // /store/:displayName
  const location = useLocation();
  const place = (location.state || {}) as PlaceDetailsResult;
  const { address } = useAccount();
  const { submitReview } = useFavoreatApi();

  // 기본 데이터 설정 (state 없을 경우 대비)
  const displayName = place.displayName || id || "Unknown Store";
  const heroImage = place.photos?.[0] || "/sample/burger-hero.jpg";

  // 리뷰 통계 상태
  const [placeReviewStats, setPlaceReviewStats] = useState<{
    count: number;
    averageRating: number;
  } | null>(null);

  // DB에서 가져온 리뷰 통계만 사용
  const rating = placeReviewStats?.averageRating || 0;
  const ratingCount = placeReviewStats?.count || 0;

  // 거리 계산 상태
  const [distance, setDistance] = useState<number | null>(
    place.distanceMeters || null
  );

  // 내가 남길 별점 (0.5 단위)
  const [myRating, setMyRating] = useState<number>(0);
  // 리뷰 작성 UI (확장형)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]); // object URL 보관
  const [reviewFiles, setReviewFiles] = useState<File[]>([]); // 실제 파일 보관

  // 리뷰 데이터 상태
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // 리뷰 작성 완료 모달 상태
  const [showReviewCompleteModal, setShowReviewCompleteModal] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [currentPlaceId, setCurrentPlaceId] = useState<string | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // 리뷰 작성 제한 모달 상태
  const [showReviewLimitModal, setShowReviewLimitModal] = useState(false);
  // 로그인 필요 모달 상태
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);

  // 장소 UUID 상태 (한 번만 생성)
  const [placeUuid, setPlaceUuid] = useState<string | null>(null);

  // 현재 위치 상태
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // UserMenu 상태
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // SDK Context 상태
  const [sdkContext, setSdkContext] = useState<any>(null);

  // 장소 UUID 생성 (한 번만 실행)
  useEffect(() => {
    const initializePlace = async () => {
      if (!place.placeId || placeUuid) return; // 이미 생성되었거나 placeId가 없으면 스킵

      try {
        // 장소 UUID 초기화 시작

        // placeId가 UUID 형태인지 확인
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            place.placeId
          );

        if (isUUID) {
          // UUID인 경우 places 테이블에서 해당 ID가 존재하는지 확인
          // UUID 형태의 placeId 확인

          const { data: existingPlace } = await supabase
            .from("places")
            .select("id")
            .eq("id", place.placeId)
            .single();

          if (existingPlace) {
            // places 테이블에 존재하는 UUID인 경우 그대로 사용
            // places 테이블에서 UUID 발견
            setPlaceUuid(place.placeId);
          } else {
            // places 테이블에 없는 UUID인 경우 google_place_id로 검색
            // places 테이블에 없는 UUID, google_place_id로 검색

            const { data: placeByGoogleId } = await supabase
              .from("places")
              .select("id")
              .eq("google_place_id", place.placeId)
              .single();

            if (placeByGoogleId) {
              console.log("google_place_id로 장소 발견:", placeByGoogleId.id);
              setPlaceUuid(placeByGoogleId.id);
            } else {
              console.log(
                "장소를 찾을 수 없음, 기본 UUID 사용:",
                place.placeId
              );
              setPlaceUuid(place.placeId);
            }
          }
        } else {
          // Google Places API placeId인 경우 ensurePlaceExists 호출
          const uuid = await ensurePlaceExists(
            place.placeId,
            displayName,
            place.address,
            place.latitude,
            place.longitude
          );
          setPlaceUuid(uuid);
        }

        console.log("장소 UUID 초기화 완료:", placeUuid);
      } catch (error) {
        console.error("장소 UUID 초기화 실패:", error);
      }
    };

    initializePlace();
  }, [
    place.placeId,
    displayName,
    place.address,
    place.latitude,
    place.longitude,
    placeUuid,
  ]);

  // placeUuid가 준비되면 리뷰 로드
  useEffect(() => {
    if (placeUuid) {
      loadReviews(placeUuid);
      setIsLoadingReviews(false);
    }
  }, [placeUuid]);

  // placeUuid가 준비되면 북마크 상태 확인 및 리뷰 통계 조회
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!address || !placeUuid) return;

      try {
        const bookmarks = await getMyBookmarks(address);
        const isBookmarkedInServer = bookmarks.some(
          (bookmark) => bookmark.place_id === placeUuid
        );
        setIsBookmarked(isBookmarkedInServer);
      } catch (error) {
        console.error("북마크 상태 조회 실패:", error);
        setIsBookmarked(false);
      }
    };

    const fetchReviewStats = async () => {
      if (!placeUuid) return;

      try {
        const stats = await getPlaceReviewStats(placeUuid);
        setPlaceReviewStats(stats);
      } catch (error) {
        console.error("리뷰 통계 조회 실패:", error);
        setPlaceReviewStats(null);
      }
    };

    if (placeUuid && address) {
      checkBookmarkStatus();
    }

    if (placeUuid) {
      fetchReviewStats();
    }
  }, [placeUuid, address]);

  const MAX_IMAGES = 2;
  const MAX_LEN = 400;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const openComposer = () => {
    // 로그인하지 않은 경우 모달 표시
    if (!address) {
      setShowLoginRequiredModal(true);
      return;
    }
    setIsReviewOpen(true);
  };

  // 리뷰 작성 상태 초기화 함수
  const resetReviewState = () => {
    setReviewText("");
    setReviewImages([]);
    setReviewFiles([]);
    setMyRating(0);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "56px";
    }
  };

  // 리뷰 작성 창 닫기 함수
  const closeReviewComposer = () => {
    setIsReviewOpen(false);
    resetReviewState();
  };

  // 거리 계산 함수 (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371000; // 지구 반지름 (미터)
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const la1 = toRad(lat1);
    const la2 = toRad(lat2);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLng = Math.sin(dLng / 2);
    const h =
      sinDLat * sinDLat + Math.cos(la1) * Math.cos(la2) * sinDLng * sinDLng;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

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

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remain = Math.max(0, MAX_IMAGES - reviewImages.length);
    const selected = Array.from(files).slice(0, remain);

    // 파일명을 안전한 형태로 변환
    const safeFiles = selected
      .filter((file) => {
        // 이미지 파일 타입 검증
        // 모바일에서 MIME 타입이 비어있을 수 있으므로 파일명이나 크기로도 확인
        const hasImageMime = file.type.startsWith("image/");
        const hasImageExtension =
          /\.(jpg|jpeg|png|gif|webp|bmp|heic|heif)$/i.test(file.name);
        const hasValidSize = file.size > 0;

        if (!hasImageMime && !hasImageExtension) {
          console.warn(
            "이미지 파일이 아닙니다:",
            file.name,
            file.type,
            file.size
          );
          return false;
        }

        if (!hasValidSize) {
          console.warn("파일 크기가 0입니다:", file.name);
          return false;
        }

        return true;
      })
      .map((file, index) => {
        const timestamp = Date.now();

        // 파일 확장자 추출 (대소문자 구분 없이)
        let extension = "jpg"; // 기본값
        const fileName = file.name.toLowerCase();
        const lastDotIndex = fileName.lastIndexOf(".");

        if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
          const ext = fileName.substring(lastDotIndex + 1);
          // 허용된 이미지 확장자 목록
          const allowedExtensions = [
            "jpg",
            "jpeg",
            "png",
            "gif",
            "webp",
            "bmp",
            "heic",
            "heif",
          ];

          if (allowedExtensions.includes(ext)) {
            extension = ext === "jpeg" ? "jpg" : ext; // jpeg를 jpg로 통일
          } else {
            // MIME 타입에서 확장자 추출 시도
            const mimeToExt: { [key: string]: string } = {
              "image/jpeg": "jpg",
              "image/jpg": "jpg",
              "image/png": "png",
              "image/gif": "gif",
              "image/webp": "webp",
              "image/bmp": "bmp",
              "image/heic": "jpg", // HEIC는 브라우저에서 제대로 표시 안될 수 있어 jpg로 변환 권장
              "image/heif": "jpg", // HEIF도 마찬가지
              // 모바일에서 자주 나타나는 MIME 타입들
              "": "jpg", // MIME 타입이 없는 경우
            };
            extension = mimeToExt[file.type.toLowerCase()] || "jpg";
            console.warn(
              `알 수 없는 확장자: ${ext}, MIME 타입: ${file.type || "없음"}, 추출된 확장자: ${extension}`
            );
          }
        } else {
          // 확장자가 없는 경우 MIME 타입에서 추출
          const mimeToExt: { [key: string]: string } = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/bmp": "bmp",
            "image/heic": "jpg", // HEIC는 jpg로 변환
            "image/heif": "jpg", // HEIF도 jpg로 변환
            "": "jpg", // MIME 타입이 없는 경우
          };
          extension = mimeToExt[file.type.toLowerCase()] || "jpg";
          console.warn(
            `확장자가 없는 파일: ${file.name}, MIME 타입: ${file.type || "없음"}, 추출된 확장자: ${extension}`
          );
        }

        // HEIC/HEIF 파일은 브라우저에서 제대로 표시되지 않을 수 있으므로
        // 실제로는 jpg로 변환하는 것이 좋지만, 여기서는 확장자만 변경
        // (실제 변환은 서버나 클라이언트 라이브러리가 필요)
        if (extension === "heic" || extension === "heif") {
          console.warn(
            "HEIC/HEIF 파일 감지. 일부 브라우저에서 표시되지 않을 수 있습니다:",
            file.name
          );
        }

        // 고유한 파일명 생성 (같은 타임스탬프 방지)
        const uniqueName = `review-${timestamp}-${index}.${extension}`;

        // MIME 타입이 없거나 잘못된 경우 기본값 설정
        let fileType = file.type;
        if (!fileType || fileType === "") {
          const extToMime: { [key: string]: string } = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            bmp: "image/bmp",
          };
          fileType = extToMime[extension] || "image/jpeg";
        }

        return new File([file], uniqueName, { type: fileType });
      });

    if (safeFiles.length === 0) {
      console.error("유효한 이미지 파일이 없습니다.");
      return;
    }

    const urls = safeFiles.map((f) => URL.createObjectURL(f));
    setReviewImages((prev) => [...prev, ...urls]);
    setReviewFiles((prev) => [...prev, ...safeFiles]);
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    setReviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleExpand = (id: string) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 리뷰 로드 함수
  const loadReviews = async (placeId: string) => {
    if (currentPlaceId === placeId) return; // 이미 로드된 장소면 스킵

    setIsLoadingReviews(true);
    try {
      const reviewsData = await getReviewsWithImages(placeId);
      setReviews(reviewsData);
      setCurrentPlaceId(placeId);
    } catch (error) {
      console.error("❌ Failed to load reviews:", error);
      setReviews([]);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  // 페이지 로드 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // SDK Context 로드
  useEffect(() => {
    const loadSdkContext = async () => {
      try {
        const context = await sdk.context;
        setSdkContext(context);
      } catch (error) {
        console.error("SDK Context error:", error);
      }
    };

    loadSdkContext();
  }, []);

  // 현재 위치 가져오기 (MainScreen에서 온 경우에만)
  useEffect(() => {
    const fetchCurrentLocation = async () => {
      // StoreListScreen에서 온 경우 (이미 거리가 계산됨)는 스킵
      if (place.distanceMeters !== undefined) {
        return;
      }

      try {
        const location = await getCurrentLocation();
        setCurrentLocation(location);
        console.log("현재 위치 가져오기 성공:", location);
      } catch (error) {
        console.error("위치 정보 가져오기 실패:", error);
        // 기본값으로 서울시청 설정
        setCurrentLocation({ lat: 37.37, lng: 126.9562 });
      }
    };

    fetchCurrentLocation();
  }, [place.distanceMeters]);

  // 거리 계산 (MainScreen에서 온 경우)
  useEffect(() => {
    const calculateDistanceIfNeeded = () => {
      console.log("거리 계산 조건 확인:", {
        placeDistanceMeters: place.distanceMeters,
        currentLocation,
        placeLatitude: place.latitude,
        placeLongitude: place.longitude,
      });

      // 이미 거리가 있으면 스킵
      if (place.distanceMeters !== undefined) {
        return;
      }

      // 현재 위치가 없으면 스킵
      if (!currentLocation) {
        console.log("현재 위치가 없어서 거리 계산 스킵");
        return;
      }

      // MainScreen에서 전달받은 좌표 정보 사용
      const placeLat = place.latitude;
      const placeLng = place.longitude;

      if (placeLat && placeLng) {
        try {
          const calculatedDistance = calculateDistance(
            currentLocation.lat,
            currentLocation.lng,
            placeLat,
            placeLng
          );
          setDistance(calculatedDistance);
          console.log("거리 계산 완료:", calculatedDistance);
        } catch (error) {
          console.warn("거리 계산 실패:", error);
        }
      } else {
        console.log("장소 좌표를 가져올 수 없어서 거리 계산 불가");
      }
    };

    calculateDistanceIfNeeded();
  }, [
    currentLocation,
    place.latitude,
    place.longitude,
    place.distanceMeters,
    place.placeId,
  ]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuWrapRef.current) return;
      const target = e.target as Node;
      if (!menuWrapRef.current.contains(target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const canSubmit =
    myRating > 0 && reviewText.trim().length > 0 && !isSubmittingReview;

  // 공유 기능
  const handleShare = async () => {
    if (!place) return;

    try {
      // Google Maps 링크 생성 (placeId 사용)
      const googleMapsUrl = place.placeId
        ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayName)}`;

      if (navigator.share) {
        // 모바일에서 네이티브 공유 사용
        await navigator.share({
          title: displayName,
          text: `${displayName} - FavorEat에서 발견한 장소`,
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
        const googleMapsUrl = place.placeId
          ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayName)}`;
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
    if (!place || !address) {
      console.log("지갑을 연결해주세요.");
      return;
    }

    if (!place.placeId) {
      console.log("장소 정보를 가져올 수 없습니다.");
      return;
    }

    const originalBookmarkState = isBookmarked;

    // 즉시 UI 상태 변경 (Optimistic Update)
    setIsBookmarked(!isBookmarked);

    try {
      if (!placeUuid) {
        console.log(
          "장소 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요."
        );
        return;
      }

      if (originalBookmarkState) {
        // 북마크 해제
        await removeBookmark(placeUuid, address);
        console.log("북마크가 해제되었습니다.");
      } else {
        // 북마크 추가
        await addBookmark(placeUuid, address);
        console.log("북마크에 추가되었습니다.");
      }
    } catch (error) {
      console.error("북마크 처리 실패:", error);

      // 에러 발생 시 원래 상태로 되돌리기
      setIsBookmarked(originalBookmarkState);
      console.error("북마크 처리 중 오류가 발생했습니다.");
    }
  };

  const onSubmitReview = async () => {
    if (!canSubmit || !address || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      // UTC 기준 24시간 내 리뷰 작성 개수 확인
      const reviewCount = await getReviewCountLast24Hours(address);
      console.log(`24시간 내 리뷰 작성 개수: ${reviewCount}/5`);

      if (reviewCount >= 5) {
        setReviewMessage("You have already written \n5 reviews today.");
        setShowReviewLimitModal(true);
        setIsSubmittingReview(false);
        return; // DB에 저장하지 않고 종료
      }
      // 1. 먼저 장소가 DB에 있는지 확인하고 없으면 생성
      let placeId: string;

      // 장소 검색 (이름으로)
      const { data: existingPlace } = await supabase
        .from("places")
        .select("id")
        .eq("name", displayName)
        .single();

      if (existingPlace) {
        placeId = existingPlace.id;
      } else {
        // 장소가 없으면 생성
        const { data: newPlace, error: placeError } = await supabase
          .from("places")
          .insert({
            name: displayName,
            address_text: "Unknown Address", // 실제로는 Google Places API에서 가져와야 함
            latitude: 37.37, // 기본값
            longitude: 126.9562, // 기본값
          })
          .select("id")
          .single();

        if (placeError) throw placeError;
        placeId = newPlace.id;
      }

      // 2. 리뷰 생성 (이미지 포함)
      const review = await submitReview({
        placeId,
        walletAddress: address,
        rating: myRating,
        body: reviewText,
        photos: reviewFiles, // File 배열 전달
      });

      console.log("✅ Review submitted:", review.id);

      // 3. 포인트 지급 (리뷰 작성 보상)
      try {
        if (address) {
          let totalPoints = 10; // 기본 리뷰 작성 포인트
          let reason = "리뷰 작성";

          // 사진이 첨부된 경우 추가 포인트
          if (reviewFiles.length > 0) {
            totalPoints += 5;
            reason = "리뷰 작성 (사진 포함)";
          }

          await addPointsToUser(address, totalPoints, reason, review.id);
          console.log(`🎉 ${totalPoints}포인트 지급 완료!`);
        }
      } catch (pointError) {
        console.error("포인트 지급 실패:", pointError);
        // 포인트 지급 실패해도 리뷰 작성은 성공으로 처리
      }

      // 4. 새 리뷰를 상태에 바로 추가 (새로고침 없이)
      const newReview: ReviewData = {
        id: review.id,
        place_id: review.place_id,
        author_wallet: review.author_wallet,
        rating: review.rating,
        body: review.body,
        created_at: review.created_at,
        like_count: 0, // 새 리뷰는 좋아요 0개
        photos:
          review.photos?.map((photo: any) => ({
            id: photo.id,
            url: photo.url,
            exif_latitude: photo.exif_latitude,
            exif_longitude: photo.exif_longitude,
          })) || [], // 업로드된 이미지들
      };

      // 새 리뷰를 맨 앞에 추가
      setReviews((prev) => [newReview, ...prev]);

      // 4. 리뷰 통계 갱신
      if (placeUuid) {
        try {
          const stats = await getPlaceReviewStats(placeUuid);
          setPlaceReviewStats(stats);
        } catch (error) {
          console.error("리뷰 통계 갱신 실패:", error);
        }
      }

      // 5. 초기화 및 닫기
      closeReviewComposer();

      // 5. 리뷰 작성 완료 모달 표시
      // 이미지 포함 여부에 따라 다른 메시지 설정
      if (reviewFiles.length > 0) {
        setReviewMessage(
          "You have earned 15 YuP\nthrough photo review creation."
        );
      } else {
        setReviewMessage("You have earned 10 YuP\nthrough review creation.");
      }
      setShowReviewCompleteModal(true);
    } catch (error) {
      console.error("❌ Review submission failed:", error);
      console.error("리뷰 제출에 실패했습니다: " + error);
    } finally {
      setIsSubmittingReview(false);
    }
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

  const handleBack = () => {
    navigate(-1);
  };

  // 거리 포맷팅 함수 (StoreCard.tsx에서 가져옴)
  function formatDistance(m?: number | null) {
    if (m == null || m == undefined) return "";
    if (m >= 1000) return `${(m / 1000).toFixed(1)}km`;
    return `${Math.round(m)}m`;
  }

  return (
    <div className="min-h-screen bg-white pt-16">
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
          <img
            src="/icons/icon-filled.svg"
            alt="logo"
            className="h-[30.75px] w-auto"
          />
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
            <button
              onClick={handleShare}
              className="p-3.5 bg-gray-100 hover:bg-gray-200 rounded-[16px] transition-colors"
              title="공유하기"
            >
              <img src="/icons/share-07.svg" className="w-5 h-5" />
            </button>
            <button
              type="button"
              className={`p-3.5 rounded-[16px] transition-colors ${
                isBookmarked
                  ? "bg-redorange-100 hover:bg-redorange-200"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              onClick={handleBookmarkToggle}
              title={isBookmarked ? "북마크 해제" : "북마크 추가"}
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
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                // 별점이 해당 별의 값 이상이면 채워진 별
                if (rating >= starValue) {
                  return <span key={i}>★</span>;
                }
                // 별점이 해당 별의 값 - 0.5 이상이면 반 별
                else if (rating >= starValue - 0.5) {
                  return (
                    <span key={i} className="relative inline-block">
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
                  return <span key={i}>☆</span>;
                }
              })}
            </div>
            <span className="text-rating-count">({ratingCount})</span>
          </div>
          <div className="text-location-content text-gray-600">
            At my location
            <span className="text-location-content text-redorange-500 ml-1">
              {formatDistance(distance)}
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
            Write a review
          </button>
          <div className="flex" onClick={openComposer}>
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
              onClick={closeReviewComposer}
              aria-expanded={isReviewOpen}
              aria-controls="review-composer"
            >
              Close a review
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
                    className="absolute top-2 right-2 w-5 h-5 rounded-[8px] bg-gray-200 flex items-center justify-center text-gray-950"
                    aria-label="remove image"
                  >
                    <img
                      src="/icons/close.svg"
                      alt="Remove"
                      className="w-4 h-4"
                    />
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
              disabled={!canSubmit || isSubmittingReview}
              className={`px-4 py-2.5 rounded-[12px] text-button-content flex items-center justify-center gap-2 min-w-[100px] ${
                isSubmittingReview
                  ? "bg-orange-500 text-white"
                  : canSubmit
                    ? "bg-gray-900 text-gray-50"
                    : "bg-gray-300 text-gray-400"
              }`}
            >
              {isSubmittingReview ? (
                <svg
                  className="animate-spin h-5 w-5"
                  style={{ color: "#ffffff" }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                "Confirm"
              )}
            </button>
          </div>
        </div>
      )}

      <div className="h-2 bg-gray-200"></div>

      {/* 리뷰 리스트 */}
      {isLoadingReviews ? (
        <div className="flex flex-col justify-center items-center pt-[18px] text-center bg-gray-200 text-gray-600 h-32">
          <p className="text-location-content">리뷰를 불러오는 중...</p>
        </div>
      ) : reviews.length > 0 ? (
        <div className="divide-y">
          {reviews.map((review) => (
            <div key={review.id} className="px-5 py-5">
              <div className="flex items-center justify-between mb-4 relative">
                <div className="flex items-center gap-1">
                  {review.users?.user_pfp_url ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#e5e5e5] overflow-hidden">
                        <img
                          src={review.users.user_pfp_url}
                          alt="Profile"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                      <div
                        className={`text-review-title ${
                          review.author_wallet.toLowerCase() ===
                          address?.toLowerCase()
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {review.users.user_name ||
                          review.author_wallet.slice(0, 6) +
                            "..." +
                            review.author_wallet.slice(-4)}
                      </div>
                    </>
                  ) : review.author_wallet.toLowerCase() ===
                      address?.toLowerCase() && sdkContext?.user?.pfpUrl ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-[#e5e5e5] overflow-hidden">
                        <img
                          src={sdkContext.user.pfpUrl}
                          alt="Profile"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </div>
                      <div className="text-review-title text-blue-700">
                        {sdkContext.user.displayName ||
                          review.author_wallet.slice(0, 6) +
                            "..." +
                            review.author_wallet.slice(-4)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 text-[14px] rounded-full bg-[#e5e5e5] flex items-center justify-center font-semibold text-orange-600">
                        {review.author_wallet.slice(2, 4).toUpperCase()}
                      </div>
                      <div
                        className={`text-review-title ${
                          review.author_wallet.toLowerCase() ===
                          address?.toLowerCase()
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {review.author_wallet.slice(0, 6)}...
                        {review.author_wallet.slice(-4)}
                      </div>
                    </>
                  )}
                </div>
                {/* 본인 리뷰일 때만 메뉴 버튼 표시 */}
                {review.author_wallet.toLowerCase() ===
                  address?.toLowerCase() && (
                  <button
                    type="button"
                    className="w-6 h-6 flex items-center justify-center text-2xl leading-none"
                    onClick={() => {
                      setOpenMenuId(
                        openMenuId === review.id ? null : review.id
                      );
                    }}
                  >
                    ⋮
                  </button>
                )}
                {openMenuId === review.id && (
                  <div
                    ref={menuWrapRef}
                    className="absolute right-0 top-8 rounded-[20px] overflow-hidden border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.15)] bg-white"
                  >
                    <div
                      className="flex w-full px-4 py-2.5 justify-center items-center gap-1 border-b border-gray-300 bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setOpenMenuId(null);
                        setReviewToDelete(review.id);
                        setShowDeleteModal(true);
                      }}
                    >
                      <span className="text-action-content">Delete</span>
                      <img src="/icons/trash.svg" className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      className="flex w-full px-4 py-2.5 justify-center items-center gap-1 bg-gray-100"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Share 버튼 클릭됨!");
                        setOpenMenuId(null);

                        try {
                          // Farcaster 환경 확인
                          console.log("현재 환경:", window.location.href);
                          console.log("SDK 상태 확인:", sdk);
                          console.log(
                            "composeCast 함수 존재:",
                            typeof sdk.actions.composeCast
                          );

                          // Farcaster 환경이 아닌 경우 처리
                          if (!sdk.actions.composeCast) {
                            console.log(
                              "Farcaster 환경에서만 Cast 기능을 사용할 수 있습니다."
                            );
                            return;
                          }

                          // 리뷰의 모든 이미지 URL 추출 (최대 2개)
                          const reviewImageUrls: string[] = [];
                          if (review.photos && review.photos.length > 0) {
                            review.photos.slice(0, 2).forEach((photo) => {
                              const imageUrl =
                                typeof photo === "string" ? photo : photo.url;
                              if (imageUrl) {
                                reviewImageUrls.push(imageUrl);
                              }
                            });
                          }

                          // 이미지가 있으면 모든 이미지 URL을 embeds에 사용, 없으면 embeds 없이 전송
                          const result = await sdk.actions.composeCast({
                            text: `🍽️ ${displayName}에서 맛있는 식사를 했어요! #FavorEat\n`,
                            ...(reviewImageUrls.length > 0
                              ? {
                                  embeds:
                                    reviewImageUrls.length === 1
                                      ? [reviewImageUrls[0]]
                                      : [
                                          reviewImageUrls[0],
                                          reviewImageUrls[1],
                                        ],
                                }
                              : {}),
                          });

                          if (result?.cast) {
                            console.log(
                              "Cast posted successfully:",
                              result.cast.hash
                            );
                            console.log("Cast가 성공적으로 작성되었습니다!");
                          } else {
                            console.log("Cast가 취소되었거나 실패했습니다.");
                            console.log("Cast 작성이 취소되었습니다.");
                          }
                        } catch (error) {
                          console.error("Cast 작성 실패:", error);
                          console.error("에러 상세:", error);
                          console.error(
                            `Cast 작성에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`
                          );
                        }
                      }}
                    >
                      <span className="text-action-content">Share</span>
                      <img src="/icons/share-06.svg" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 별점 표시 */}
              <div className="text-orange-500 mb-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const starValue = i + 1;
                  // 별점이 해당 별의 값 이상이면 채워진 별
                  if (review.rating >= starValue) {
                    return <span key={i}>★</span>;
                  }
                  // 별점이 해당 별의 값 - 0.5 이상이면 반 별
                  else if (review.rating >= starValue - 0.5) {
                    return (
                      <span key={i} className="relative inline-block">
                        <span className="text-orgrange-500">☆</span>
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
                    return <span key={i}>☆</span>;
                  }
                })}
              </div>

              {/* 리뷰 이미지들 */}
              {review.photos.length > 0 && (
                <div
                  className={`grid gap-3 mb-2 ${review.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                >
                  {review.photos.map((photo, index) => {
                    // photo가 객체인 경우 url 속성 사용, 문자열인 경우 그대로 사용
                    const imageUrl =
                      typeof photo === "string" ? photo : photo.url;
                    return (
                      <img
                        key={index}
                        src={imageUrl}
                        className="w-full h-32 object-cover rounded-xl"
                        alt="Review photo"
                        onError={(e) => {
                          console.error(
                            `이미지 로드 실패 [${index}]:`,
                            imageUrl
                          );
                          console.error("이미지 로드 에러:", e);
                          // 이미지 로드 실패 시 숨기기
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                        onLoad={() => {
                          // 이미지 로드 성공
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* 리뷰 텍스트 */}
              {review.body && (
                <>
                  <p className="text-review-content text-gray-800 whitespace-normal break-words">
                    {expandedReviews[review.id]
                      ? review.body
                      : review.body.length > 200
                        ? review.body.slice(0, 200) + "..."
                        : review.body}
                  </p>
                  {review.body.length > 200 && (
                    <button
                      type="button"
                      className="text-xs text-gray-500"
                      onClick={() => toggleExpand(review.id)}
                    >
                      {expandedReviews[review.id] ? "접기" : "더보기"}
                    </button>
                  )}
                </>
              )}

              {/* 좋아요 수와 작성 시간 */}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                <span>
                  {(() => {
                    const now = new Date();
                    const reviewTime = new Date(review.created_at);
                    const diffMs = now.getTime() - reviewTime.getTime();

                    if (diffMs < 0) {
                      return "now";
                    }

                    const diffMinutes = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffMonths = Math.floor(diffDays / 30);
                    const diffYears = Math.floor(diffDays / 365);

                    if (diffYears >= 1) {
                      return `${diffYears}y`;
                    } else if (diffMonths >= 1) {
                      return `${diffMonths}m`;
                    } else if (diffDays >= 1) {
                      return `${diffDays}d`;
                    } else if (diffHours >= 1) {
                      return `${diffHours}h`;
                    } else if (diffMinutes >= 1) {
                      return `${diffMinutes}m`;
                    } else {
                      return "now";
                    }
                  })()}
                </span>

                {/* 좋아요 버튼 - 다른 사용자의 리뷰에만 표시 */}
                {review.author_wallet.toLowerCase() !==
                  address?.toLowerCase() && (
                  <button
                    onClick={async () => {
                      if (!address) {
                        console.log("지갑을 연결해주세요.");
                        return;
                      }

                      try {
                        console.log("좋아요 클릭:", review.id);

                        const result = await addLikeToReview(
                          review.id,
                          address
                        );

                        if (result.success) {
                          // UI에서 즉시 좋아요 수 업데이트
                          setReviews((prev) =>
                            prev.map((r) =>
                              r.id === review.id
                                ? { ...r, like_count: result.newLikeCount }
                                : r
                            )
                          );
                          console.log(
                            `✅ 좋아요 추가 완료! 새로운 좋아요 수: ${result.newLikeCount}`
                          );
                        }
                      } catch (error) {
                        console.error("좋아요 실패:", error);
                        if (
                          error instanceof Error &&
                          error.message.includes("이미 좋아요를 누른")
                        ) {
                          console.log("이미 좋아요를 누른 리뷰입니다.");
                        } else {
                          console.error("좋아요 처리 중 오류가 발생했습니다.");
                        }
                      }
                    }}
                    className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <img
                      src="/icons/thumbs-up.svg"
                      alt="좋아요"
                      className="w-5 h-5"
                    />
                    <span className="text-[15px]">{review.like_count}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col justify-start pt-[18px] text-center bg-gray-200 text-gray-600 h-screen">
          <p className="text-location-content mb-1">no review yet</p>
          <p className="text-location-content-700">Be the first reviewer</p>
          <p className="text-location-content-700">
            Just fill in that empty star up there!
          </p>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={showDeleteModal}
        variant={deleteSuccess ? "success" : "confirm"}
        message={
          deleteSuccess
            ? "The review has been successfully deleted!"
            : "Are you sure you want to delete the review?"
        }
        okText="okay"
        onClose={() => {
          setShowDeleteModal(false);
          setReviewToDelete(null);
          setDeleteSuccess(false);
        }}
        onCancel={() => {
          setShowDeleteModal(false);
          setReviewToDelete(null);
          setDeleteSuccess(false);
        }}
        onConfirm={async () => {
          if (deleteSuccess) {
            // 성공 상태에서 okay 클릭 시 모달 닫기
            setShowDeleteModal(false);
            setReviewToDelete(null);
            setDeleteSuccess(false);
            return;
          }

          if (!reviewToDelete || !address) {
            setShowDeleteModal(false);
            setReviewToDelete(null);
            setDeleteSuccess(false);
            return;
          }

          try {
            await softDeleteReview(reviewToDelete, address);
            console.log("리뷰 삭제 완료");

            // UI에서 즉시 제거
            setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete));

            // 리뷰 통계 갱신
            if (placeUuid) {
              try {
                const stats = await getPlaceReviewStats(placeUuid);
                setPlaceReviewStats(stats);
              } catch (error) {
                console.error("리뷰 통계 갱신 실패:", error);
              }
            }

            // 성공 상태로 변경
            setDeleteSuccess(true);
          } catch (error) {
            console.error("리뷰 삭제 실패:", error);
            console.error("리뷰 삭제에 실패했습니다.");
            setShowDeleteModal(false);
            setReviewToDelete(null);
            setDeleteSuccess(false);
          }
        }}
      />

      <UserMenu
        isOpen={isUserMenuOpen}
        onClose={() => setIsUserMenuOpen(false)}
      />

      {/* 리뷰 작성 완료 모달 */}
      <ConfirmModal
        open={showReviewCompleteModal}
        variant="success"
        message={reviewMessage}
        okText="okay"
        onClose={() => setShowReviewCompleteModal(false)}
        onConfirm={() => setShowReviewCompleteModal(false)}
      />

      {/* 리뷰 작성 제한 모달 */}
      <ConfirmModal
        open={showReviewLimitModal}
        variant="success"
        message={reviewMessage}
        okText="okay"
        onClose={() => {
          setShowReviewLimitModal(false);
          closeReviewComposer();
        }}
        onConfirm={() => {
          setShowReviewLimitModal(false);
          closeReviewComposer();
        }}
      />

      {/* 로그인 필요 모달 */}
      <ConfirmModal
        open={showLoginRequiredModal}
        variant="success"
        message="Please Login to write a review."
        okText="okay"
        onClose={() => setShowLoginRequiredModal(false)}
        onConfirm={() => setShowLoginRequiredModal(false)}
      />
    </div>
  );
};

export default StoreDetailScreen;
