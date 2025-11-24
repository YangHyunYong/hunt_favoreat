import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)


export type WalletAddress = string

// 개발용: RLS가 비활성화된 상태에서 인증 없이 작업

export async function upsertUser(params: { 
  walletAddress: WalletAddress; 
  userFid?: number | null;
  userName?: string | null;
  userPfpUrl?: string | null;
}) {
  const { walletAddress, userFid, userName, userPfpUrl } = params
  return supabase
    .from('users')
    .upsert({ 
      wallet_address: walletAddress.toLowerCase(), 
      user_fid: userFid ?? null,
      user_name: userName ?? null,
      user_pfp_url: userPfpUrl ?? null
    }, { onConflict: 'wallet_address' })
    .select('*')
    .single()
}

export async function ensureUserWithWallet(
  walletAddress: WalletAddress,
  userFid?: number | null,
  userName?: string | null,
  userPfpUrl?: string | null
) {
  // 개발용: RLS가 비활성화된 상태에서 직접 upsert
  const { data, error } = await upsertUser({ 
    walletAddress, 
    userFid: userFid ?? null,
    userName: userName ?? null,
    userPfpUrl: userPfpUrl ?? null
  })
  if (error) throw error
  return data
}

export type CreateReviewInput = {
  placeId: string
  authorWallet: WalletAddress
  rating: number
  body?: string
}

export async function createReview(input: CreateReviewInput) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      place_id: input.placeId,
      author_wallet: input.authorWallet.toLowerCase(),
      rating: input.rating,
      body: input.body ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function uploadReviewPhoto(params: { walletAddress: WalletAddress; reviewId: string; file: File }) {
  const path = `review-photos/${params.walletAddress.toLowerCase()}/${params.reviewId}/${params.file.name}`
  const { error: uploadError } = await supabase.storage.from('review-photos').upload(path, params.file, { upsert: false })
  if (uploadError) throw uploadError
  const { data, error } = await supabase
    .from('review_photos')
    .insert({ review_id: params.reviewId, storage_path: path })
    .select('*')
    .single()
  if (error) throw error
  
  // 이미지 URL 생성하여 반환
  const imageUrl = supabase.storage.from('review-photos').getPublicUrl(path).data.publicUrl
  return {
    ...data,
    url: imageUrl
  }
}

export async function likeReview(reviewId: string, walletAddress: WalletAddress) {
  const { error } = await supabase
    .from('review_likes')
    .insert({ review_id: reviewId, liker_wallet: walletAddress.toLowerCase() })
  if (error) throw error
}

export async function unlikeReview(reviewId: string, walletAddress: WalletAddress) {
  const { error } = await supabase
    .from('review_likes')
    .delete()
    .eq('review_id', reviewId)
    .eq('liker_wallet', walletAddress.toLowerCase())
  if (error) throw error
}

export async function addBookmark(placeId: string, walletAddress: WalletAddress) {
  const { error } = await supabase
    .from('bookmarks')
    .insert({ place_id: placeId, wallet_address: walletAddress.toLowerCase() })
  if (error) throw error
}

export async function removeBookmark(placeId: string, walletAddress: WalletAddress) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('place_id', placeId)
    .eq('wallet_address', walletAddress.toLowerCase())
  if (error) throw error
}

export async function softDeleteReview(reviewId: string, walletAddress: WalletAddress) {  
  const { data, error } = await supabase
    .from('reviews')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reviewId)
    .eq('author_wallet', walletAddress.toLowerCase())
    .select('*')

  if (error) {
    console.error('softDeleteReview 에러:', error);
    throw error;
  }
  
  return data;
}

export async function getMyReviews(walletAddress: WalletAddress) {
  const { data, error } = await supabase
    .from('reviews_with_counts')
    .select('*')
    .eq('author_wallet', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// UTC 기준 24시간 내 리뷰 작성 개수 확인
export async function getReviewCountLast24Hours(walletAddress: WalletAddress): Promise<number> {
  // 현재 UTC 시간
  const now = new Date();
  const utcNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ));
  
  // UTC 기준 오늘 00시00분
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  
  // 24시간 전 (오늘 00시00분)
  const twentyFourHoursAgo = todayUTC;
  
  const { count, error } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('author_wallet', walletAddress.toLowerCase())
    .gte('created_at', twentyFourHoursAgo.toISOString())
    .lte('created_at', utcNow.toISOString());
  
  if (error) {
    console.error("24시간 내 리뷰 개수 조회 실패:", error);
    throw error;
  }
  
  return count || 0;
}

// 장소의 리뷰 개수와 평균 평점 가져오기
export async function getPlaceReviewStats(placeId: string): Promise<{
  count: number;
  averageRating: number;
}> {
  try {
    // place_id가 UUID인지 Google place_id인지 확인
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId);
    
    let actualPlaceId: string;
    
    if (isUUID) {
      // UUID인 경우 직접 사용
      actualPlaceId = placeId;
    } else {
      // Google place_id인 경우 places 테이블에서 UUID 찾기
      const { data: placeData } = await supabase
        .from("places")
        .select("id")
        .eq("google_place_id", placeId)
        .single();
      
      if (!placeData?.id) {
        // places 테이블에 없는 경우 빈 결과 반환
        return { count: 0, averageRating: 0 };
      }
      
      actualPlaceId = placeData.id;
    }
    
    // 리뷰 개수와 평균 평점 계산
    const { data, error } = await supabase
      .from("reviews")
      .select("rating", { count: "exact" })
      .eq("place_id", actualPlaceId)
      .is("deleted_at", null);
    
    if (error) {
      console.error("리뷰 통계 조회 실패:", error);
      return { count: 0, averageRating: 0 };
    }
    
    const count = data?.length || 0;
    
    if (count === 0) {
      return { count: 0, averageRating: 0 };
    }
    
    // 평균 평점 계산
    const sum = data.reduce((acc, review) => acc + (review.rating || 0), 0);
    const rawAverage = sum / count;
    
    // 소수점 두자리에서 반올림
    const roundedToTwoDecimals = Math.round(rawAverage * 100) / 100;
    
    // 0.5 단위로 반올림 (0, 0.5, 1.0, 1.5, 2.0, ..., 5.0)
    const roundedToHalf = Math.round(roundedToTwoDecimals * 2) / 2;
    
    // 0~5 범위로 제한
    const averageRating = Math.max(0, Math.min(5, roundedToHalf));
    
    return {
      count,
      averageRating,
    };
  } catch (error) {
    console.error("리뷰 통계 조회 중 오류:", error);
    return { count: 0, averageRating: 0 };
  }
}

export async function getMyBookmarks(walletAddress: WalletAddress) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('place_id, created_at')
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// 리뷰와 함께 이미지 URL 가져오기
export async function getReviewsWithImages(
  placeId?: string,
  userWallet?: string,
  limit?: number,
  offset?: number
) {
  const query = supabase
    .from('reviews')
    .select(`
      *,
      review_photos (
        id,
        storage_path,
        exif_latitude,
        exif_longitude
      ),
      places (
        id,
        name,
        address_text,
        latitude,
        longitude
      ),
      users!reviews_author_wallet_fkey (
        user_name,
        user_pfp_url,
        wallet_address
      )
    `)
    .is('deleted_at', null) // 삭제되지 않은 리뷰만
    .order('created_at', { ascending: false })
  
  if (placeId) {
    query.eq('place_id', placeId)
  }
  
  if (userWallet) {
    console.log("사용자 지갑으로 필터링:", userWallet.toLowerCase())
    query.eq('author_wallet', userWallet.toLowerCase())
  }
  
  // limit과 offset 처리 (range를 사용하면 limit이 무시되므로 range만 사용)
  if (limit !== undefined && offset !== undefined) {
    query.range(offset, offset + limit - 1)
  } else if (limit !== undefined) {
    query.limit(limit)
  } else if (offset !== undefined) {
    query.range(offset, offset + 19) // 기본 20개
  }
  
  const { data, error } = await query
  if (error) {
    console.error("getReviewsWithImages 쿼리 오류:", error)
    throw error
  }
  
  console.log("getReviewsWithImages - 원본 데이터:", data)
  console.log("조회된 리뷰 개수:", data?.length || 0)
  
  // 이미지 URL 생성
  const result = data?.map(review => {
    console.log(`리뷰 ${review.id}의 원본 review_photos:`, review.review_photos);
    
    const photos = review.review_photos?.map((photo: any, index: number) => {
      const photoUrl = supabase.storage.from('review-photos').getPublicUrl(photo.storage_path).data.publicUrl;
      console.log(`리뷰 ${review.id} 이미지 ${index}:`, {
        storage_path: photo.storage_path,
        generated_url: photoUrl
      });
      // 객체 형태로 반환 (StoreDetailScreen에서 기대하는 형태)
      return {
        id: photo.id,
        url: photoUrl,
        exif_latitude: photo.exif_latitude,
        exif_longitude: photo.exif_longitude
      };
    }) || [];
    
    console.log(`리뷰 ${review.id} 최종 photos 배열:`, photos);
    
    return {
      ...review,
      like_count: review.like_count || 0, // 실제 DB에서 가져온 값 사용
      photos: photos,
      place: review.places,
      users: review.users
    };
  }) || []
  
  console.log("getReviewsWithImages - 처리된 데이터:", result)
  return result
}

// 특정 리뷰의 이미지 URL 가져오기
export function getReviewImageUrl(storagePath: string) {
  return supabase.storage.from('review-photos').getPublicUrl(storagePath).data.publicUrl
}

// 북마크된 가게의 리뷰와 사진 정보 가져오기
// Google Places API placeId를 UUID로 변환하는 함수 (places.id용)
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

// Google Places API에서 장소 상세 정보를 가져오는 함수
async function fetchPlaceDetailsFromGoogle(placeId: string): Promise<{
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}> {
  try {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    );
    
    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: ['formatted_address', 'geometry', 'name']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              name: place.name || '',
              address: place.formatted_address || '',
              latitude: place.geometry?.location?.lat() || null,
              longitude: place.geometry?.location?.lng() || null
            });
          } else {
            reject(new Error(`Places API error: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    console.warn("Google Places API 호출 실패:", error);
    return {
      name: '',
      address: '',
      latitude: null,
      longitude: null
    };
  }
}

// 중복 호출 방지를 위한 캐시
const placeCreationCache = new Map<string, Promise<string>>();

// 장소를 places 테이블에 생성하는 함수
export async function ensurePlaceExists(
  googlePlaceId: string,
  placeName: string,
  address?: string,
  latitude?: number,
  longitude?: number
): Promise<string> {
  // 캐시에서 진행 중인 요청이 있는지 확인
  if (placeCreationCache.has(googlePlaceId)) {
    console.log("이미 진행 중인 장소 생성 요청:", googlePlaceId);
    return await placeCreationCache.get(googlePlaceId)!;
  }

  const creationPromise = (async () => {
    try {
      // 먼저 장소가 존재하는지 확인 (google_place_id로 검색)
      const { data: existingPlace } = await supabase
        .from("places")
        .select("id")
        .eq("google_place_id", googlePlaceId)
        .single();

      if (existingPlace) {
        console.log("기존 장소 발견:", existingPlace.id);
        return existingPlace.id;
      }

      // 장소가 존재하지 않으면 생성
      const uuidPlaceId = await placeIdToUUID(googlePlaceId);
      
      // 전달받은 주소/좌표 정보가 있으면 우선 사용, 없으면 Google Places API에서 가져오기
      let finalAddress = address;
      let finalLatitude = latitude;
      let finalLongitude = longitude;
      
      if (!finalAddress || !finalLatitude || !finalLongitude) {
        const placeDetails = await fetchPlaceDetailsFromGoogle(googlePlaceId);
        finalAddress = finalAddress || placeDetails.address;
        finalLatitude = finalLatitude || placeDetails.latitude || undefined;
        finalLongitude = finalLongitude || placeDetails.longitude || undefined;
      }
      
      console.log("장소 생성 시도:", {
        id: uuidPlaceId,
        name: placeName,
        address: finalAddress,
        latitude: finalLatitude,
        longitude: finalLongitude,
        google_place_id: googlePlaceId
      });
      
      const { error } = await supabase.from("places").insert({
        id: uuidPlaceId,
        name: placeName,
        address_text: finalAddress,
        latitude: finalLatitude,
        longitude: finalLongitude,
        google_place_id: googlePlaceId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("장소 생성 실패:", error);
        throw error;
      } else {
        console.log("장소 생성 성공:", googlePlaceId);
        return uuidPlaceId;
      }
    } catch (error) {
      console.error("장소 확인/생성 실패:", error);
      throw error;
    } finally {
      // 캐시에서 제거
      placeCreationCache.delete(googlePlaceId);
    }
  })();

  // 캐시에 저장
  placeCreationCache.set(googlePlaceId, creationPromise);
  
  return await creationPromise;
}

export async function getBookmarkPlacesWithReviews(userWallet: string) {
  // 1. 사용자의 북마크 가져오기
  const { data: bookmarks, error: bookmarkError } = await supabase
    .from('bookmarks')
    .select('place_id')
    .eq('wallet_address', userWallet.toLowerCase())
  
  if (bookmarkError) throw bookmarkError
  if (!bookmarks || bookmarks.length === 0) return []
  
  const placeIds = bookmarks.map(b => b.place_id)
  
  // 2. 북마크된 장소들의 정보 가져오기
  const { data: places, error: placesError } = await supabase
    .from('places')
    .select('*')
    .in('id', placeIds)
  
  if (placesError) throw placesError
  
  // 3. 각 장소의 리뷰와 사진 정보 가져오기
  const placesWithReviews = await Promise.all(
    places.map(async (place) => {
      // 해당 장소의 리뷰들 가져오기
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('place_id', place.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(3) // 최신 3개 리뷰만
      
      if (reviewsError) throw reviewsError
      
      // 각 리뷰의 사진들 가져오기
      const reviewsWithPhotos = await Promise.all(
        (reviews || []).map(async (review) => {
          const { data: photos, error: photosError } = await supabase
            .from('review_photos')
            .select('storage_path')
            .eq('review_id', review.id)
            .limit(2) // 리뷰당 최대 2장
          
          if (photosError) throw photosError
          
          return {
            ...review,
            photos: photos?.map(photo => 
              supabase.storage.from('review-photos').getPublicUrl(photo.storage_path).data.publicUrl
            ) || []
          }
        })
      )
      
      return {
        ...place,
        reviews: reviewsWithPhotos,
        totalReviews: reviews?.length || 0,
        averageRating: reviews?.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0
      }
    })
  )
  
  return placesWithReviews
}

// 포인트 지급 함수
export async function addPointsToUser(
  userWallet: string,
  points: number,
  reason: string,
  reviewId?: string
) {
  try {
    // 1. 사용자의 현재 포인트 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("points")
      .eq("wallet_address", userWallet.toLowerCase())
      .single();

    if (userError) {
      console.error("사용자 포인트 조회 실패:", userError);
      throw userError;
    }

    const currentPoints = userData?.points || 0;
    const newPoints = currentPoints + points;

    // 2. 사용자 포인트 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({ points: newPoints })
      .eq("wallet_address", userWallet.toLowerCase());

    if (updateError) {
      console.error("포인트 업데이트 실패:", updateError);
      throw updateError;
    }

    // 3. 포인트 로그 추가
    const { error: logError } = await supabase
      .from("point_logs")
      .insert({
        user_wallet: userWallet.toLowerCase(),
        points: points,
        reason: reason,
        review_id: reviewId || null,
      });

    if (logError) {
      console.error("포인트 로그 추가 실패:", logError);
      throw logError;
    }

    console.log(`✅ 포인트 지급 완료: ${userWallet}에게 ${points}포인트 (${reason})`);
    return { success: true, newPoints, pointsAdded: points };
  } catch (error) {
    console.error("포인트 지급 실패:", error);
    throw error;
  }
}

// 좋아요 추가 함수
export async function addLikeToReview(
  reviewId: string,
  likerWallet: string
): Promise<{ success: boolean; newLikeCount: number }> {
  try {
    // 1. 이미 좋아요를 눌렀는지 확인
    const { data: existingLike, error: checkError } = await supabase
      .from("review_likes")
      .select("review_id, liker_wallet")
      .eq("review_id", reviewId)
      .eq("liker_wallet", likerWallet.toLowerCase())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116은 "no rows found" 에러
      console.error("좋아요 중복 확인 실패:", checkError);
      throw checkError;
    }

    if (existingLike) {
      throw new Error("이미 좋아요를 누른 리뷰입니다.");
    }

    // 2. review_likes 테이블에 좋아요 추가
    const { error: likeError } = await supabase
      .from("review_likes")
      .insert({
        review_id: reviewId,
        liker_wallet: likerWallet.toLowerCase(),
      });

    if (likeError) {
      console.error("좋아요 추가 실패:", likeError);
      throw likeError;
    }

    // 3. reviews 테이블의 like_count 증가
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select("like_count")
      .eq("id", reviewId)
      .single();

    if (reviewError) {
      console.error("리뷰 조회 실패:", reviewError);
      throw reviewError;
    }

    const newLikeCount = (reviewData?.like_count || 0) + 1;

    const { error: updateError } = await supabase
      .from("reviews")
      .update({ like_count: newLikeCount })
      .eq("id", reviewId);

    if (updateError) {
      console.error("좋아요 수 업데이트 실패:", updateError);
      throw updateError;
    }

    // 4. 포인트 지급 (리뷰 작성자와 좋아요 누른 사용자 모두에게 1포인트씩)
    try {
      // 리뷰 작성자 정보 조회
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("author_wallet")
        .eq("id", reviewId)
        .single();

      if (reviewError) {
        console.error("리뷰 작성자 조회 실패:", reviewError);
        throw reviewError;
      }

      const reviewAuthor = reviewData?.author_wallet;
      
      if (reviewAuthor) {
        // 리뷰 작성자에게 1포인트 지급
        await addPointsToUser(
          reviewAuthor,
          1,
          "리뷰 좋아요 받음",
          reviewId
        );
        console.log(`✅ 리뷰 작성자에게 1포인트 지급: ${reviewAuthor}`);
      }

      // 좋아요 누른 사용자에게 1포인트 지급
      await addPointsToUser(
        likerWallet,
        1,
        "리뷰 좋아요 누름",
        reviewId
      );
      console.log(`✅ 좋아요 누른 사용자에게 1포인트 지급: ${likerWallet}`);
      
    } catch (pointError) {
      console.error("포인트 지급 실패:", pointError);
      // 포인트 지급 실패해도 좋아요는 성공으로 처리
    }

    console.log(`✅ 좋아요 추가 완료: 리뷰 ${reviewId}, 좋아요 수: ${newLikeCount}`);
    return { success: true, newLikeCount };
  } catch (error) {
    console.error("좋아요 추가 실패:", error);
    throw error;
  }
}

// 리더보드 데이터 가져오기 (points 내림차순)
export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("users")
    .select("wallet_address, user_name, user_pfp_url, points")
    .order("points", { ascending: false });
  
  if (error) {
    console.error("리더보드 데이터 조회 실패:", error);
    throw error;
  }
  
  return data || [];
}

// UTC 기준 오늘 작성한 리뷰 개수 가져오기 (최대 5개)
export async function getTodayReviewCount(walletAddress: string): Promise<number> {
  // UTC 기준 오늘 00:00:00
  const now = new Date();
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  
  // UTC 기준 오늘 23:59:59.999
  const todayEndUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ));
  
  const { count, error } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("author_wallet", walletAddress.toLowerCase())
    .gte("created_at", todayUTC.toISOString())
    .lte("created_at", todayEndUTC.toISOString())
    .is("deleted_at", null);
  
  if (error) {
    console.error("오늘 작성한 리뷰 개수 조회 실패:", error);
    return 0;
  }
  
  // 최대 5개까지만 반환
  return Math.min(count || 0, 5);
}

// 여러 사용자의 오늘 작성한 리뷰 개수 가져오기
export async function getTodayReviewCounts(walletAddresses: string[]): Promise<Record<string, number>> {
  // UTC 기준 오늘 00:00:00
  const now = new Date();
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  
  // UTC 기준 오늘 23:59:59.999
  const todayEndUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ));
  
  const { data, error } = await supabase
    .from("reviews")
    .select("author_wallet")
    .in("author_wallet", walletAddresses.map(addr => addr.toLowerCase()))
    .gte("created_at", todayUTC.toISOString())
    .lte("created_at", todayEndUTC.toISOString());
  
  if (error) {
    console.error("오늘 작성한 리뷰 개수 조회 실패:", error);
    return {};
  }
  
  // 각 지갑 주소별 리뷰 개수 계산 (최대 5개)
  const counts: Record<string, number> = {};
  walletAddresses.forEach(addr => {
    const lowerAddr = addr.toLowerCase();
    const count = data?.filter(r => r.author_wallet === lowerAddr).length || 0;
    counts[addr] = Math.min(count, 5);
  });
  
  return counts;
}


