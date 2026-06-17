import Modal from './Modal'

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }: { open: boolean; title?: string; message?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div>
        {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
        {message && <p className="mt-3 text-sm text-slate-400">{message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-2xl border border-slate-700 px-4 py-2">Cancel</button>
          <button onClick={onConfirm} className="rounded-2xl bg-rose-500 px-4 py-2 text-white">Delete</button>
        </div>
      </div>
    </Modal>
  )
}
