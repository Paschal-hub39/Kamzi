export default function EditHistoryModal({ history, onClose }) {
  return (
    <div className="absolute z-50 bottom-full mb-2 left-0 bg-gray-800 rounded-xl shadow-2xl p-4 w-72 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">Edit History</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>
      
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {history.map((edit, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              {index < history.length - 1 && <div className="w-0.5 flex-1 bg-gray-700 my-1" />}
            </div>
            <div className="flex-1 pb-3">
              <p className="text-sm text-gray-300">{edit.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(edit.editedAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
        {history.length} edit{history.length > 1 ? 's' : ''} total
      </div>
    </div>
  );
}
