import React from "react";

type Variant = "confirm" | "success";

interface ConfirmModalProps {
  open: boolean;
  variant?: Variant; // "confirm" | "success" (default: "confirm")
  message: string; // 중앙 메시지
  cancelText?: string; // confirm 변형 왼쪽 버튼
  confirmText?: string; // confirm 변형 오른쪽 버튼
  okText?: string; // success 변형 단일 버튼
  onClose: () => void; // X 버튼/백드롭 클릭
  onCancel?: () => void; // cancel 클릭
  onConfirm?: () => void; // confirm/ok 클릭
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  variant = "confirm",
  message,
  cancelText = "No, I won't.",
  confirmText = "Yes, delete it.",
  okText = "okay",
  onClose,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10] flex items-center justify-center bg-black/60">
      <div
        className="
          flex w-[320px] flex-col items-center gap-6
          rounded-[24px] bg-gray-50 shadow-xl
          px-2 py-4
        "
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-end w-full pr-4 pb-4"
        >
          <img src="/icons/cancel.svg" alt="close" className="w-6 h-6" />
        </button>

        {/* Message */}
        <div className="text-center text-gray-800 text-confirm-content px-4">
          {message}
        </div>

        {/* Actions */}
        {variant === "confirm" ? (
          <div className="flex w-full gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="
                flex-1 py-2.5 px-4 rounded-[12px] bg-white text-redorange-500 text-button-content
                shadow-[inset_0_0_0_1px_var(--Redorange-500,#FF4500)]
              "
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="
                flex-1 py-2.5 px-4 rounded-[12px] bg-redorange-500
                text-white text-button-content
              "
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onConfirm}
            className="
              w-full py-2.5 px-4 mt-4 rounded-[12px] bg-redorange-500
              text-white text-button-content
            "
          >
            {okText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConfirmModal;
