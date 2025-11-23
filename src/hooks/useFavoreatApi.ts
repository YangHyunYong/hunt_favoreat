import { useCallback } from 'react'
import {
  addBookmark,
  createReview,
  ensureUserWithWallet,
  getMyBookmarks,
  getMyReviews,
  likeReview,
  removeBookmark,
  unlikeReview,
  uploadReviewPhoto,
  type WalletAddress,
} from '../supabaseClient'

export function useFavoreatApi() {
  const ensureUser = useCallback(async (walletAddress: WalletAddress) => {
    return ensureUserWithWallet(walletAddress, null, null, null)
  }, [])

  const submitReview = useCallback(
    async (params: {
      placeId: string
      walletAddress: WalletAddress
      rating: number
      body?: string
      photos?: File[]
    }) => {
      const review = await createReview({
        placeId: params.placeId,
        authorWallet: params.walletAddress,
        rating: params.rating,
        body: params.body,
      })
      
      // 최대 2장까지 이미지 업로드하고 URL 수집
      const files = (params.photos ?? []).slice(0, 2)
      const uploadedPhotos = []
      
      for (const file of files) {
        const photoData = await uploadReviewPhoto({ 
          walletAddress: params.walletAddress, 
          reviewId: review.id, 
          file 
        })
        uploadedPhotos.push(photoData)
      }
      
      return {
        ...review,
        photos: uploadedPhotos
      }
    },
    []
  )

  const toggleLike = useCallback(async (reviewId: string, walletAddress: WalletAddress, liked: boolean) => {
    if (liked) {
      await unlikeReview(reviewId, walletAddress)
    } else {
      await likeReview(reviewId, walletAddress)
    }
  }, [])

  const toggleBookmark = useCallback(async (placeId: string, walletAddress: WalletAddress, bookmarked: boolean) => {
    if (bookmarked) return removeBookmark(placeId, walletAddress)
    return addBookmark(placeId, walletAddress)
  }, [])

  return {
    ensureUser,
    submitReview,
    toggleLike,
    toggleBookmark,
    getMyReviews,
    getMyBookmarks,
  }
}


