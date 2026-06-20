import React from 'react'

export default function Modal({ children, open, onClose }: { children: React.ReactNode; open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-slate-900 p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}
