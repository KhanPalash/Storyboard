import type { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`px-4 py-2.5 rounded-lg text-xs font-medium shadow-lg border ${
            toast.tone === 'error'
              ? 'bg-[#991B1B] text-white border-[#7F1D1D]'
              : toast.tone === 'success'
                ? 'bg-[#141413] text-white border-[#2E2D2B]'
                : 'bg-[#141413] text-white border-[#2E2D2B]'
          }`}
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
}
