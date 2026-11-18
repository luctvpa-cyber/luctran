import { Check, ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { DEPOT_SCENES, type DepotSceneCategory } from '../data/depotScenes';

interface DepotGalleryModalProps {
  open: boolean;
  activeSceneId: string;
  onClose: () => void;
  onSelectAsBanner: (sceneId: string) => void;
}

const CATEGORY_TABS: Array<{ id: 'all' | DepotSceneCategory; label: string }> = [
  { id: 'all', label: 'Tất cả (22)' },
  { id: 'overview', label: 'Toàn cảnh' },
  { id: 'facilities', label: 'Cụm thiết bị & Nhà' },
  { id: 'night', label: 'Phối cảnh đêm' },
];

export function DepotGalleryModal({
  open,
  activeSceneId,
  onClose,
  onSelectAsBanner,
}: DepotGalleryModalProps) {
  const [category, setCategory] = useState<'all' | DepotSceneCategory>('all');
  const [currentId, setCurrentId] = useState(activeSceneId);

  const filteredScenes = useMemo(() => {
    if (category === 'all') return DEPOT_SCENES;
    return DEPOT_SCENES.filter((s) => s.category === category);
  }, [category]);

  useEffect(() => {
    if (!open) return;
    setCurrentId(activeSceneId);
  }, [open, activeSceneId]);

  useEffect(() => {
    if (filteredScenes.length === 0) return;
    if (!filteredScenes.some((s) => s.id === currentId)) {
      setCurrentId(filteredScenes[0].id);
    }
  }, [filteredScenes, currentId]);

  const currentIdx = Math.max(
    0,
    filteredScenes.findIndex((s) => s.id === currentId)
  );
  const currentScene = filteredScenes[currentIdx] ?? DEPOT_SCENES[0];

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && filteredScenes.length > 1) {
        const next = filteredScenes[(currentIdx + 1) % filteredScenes.length];
        setCurrentId(next.id);
      }
      if (e.key === 'ArrowLeft' && filteredScenes.length > 1) {
        const prev =
          filteredScenes[
            (currentIdx - 1 + filteredScenes.length) % filteredScenes.length
          ];
        setCurrentId(prev.id);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, filteredScenes, currentIdx]);

  if (!open) return null;

  const isPinned = currentScene.id === activeSceneId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="depot-gallery-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#0b1956] text-white grid place-items-center shrink-0">
              <ImageIcon className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2
                id="depot-gallery-title"
                className="text-sm sm:text-base font-extrabold text-[#172033] truncate"
              >
                Thư viện phối cảnh 3D · Kho Cam Ranh
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                Chọn góc nhìn để xem chi tiết hoặc ghim làm banner trang chủ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {CATEGORY_TABS.map((tab) => {
                const active = category === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategory(tab.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      active
                        ? 'bg-white text-[#172033] shadow-2xs'
                        : 'text-slate-600 hover:text-[#172033]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng thư viện 3D"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile category tabs */}
        <div className="px-4 py-2 border-b border-slate-100 flex md:hidden items-center gap-1 overflow-x-auto bg-slate-50">
          {CATEGORY_TABS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategory(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#0b1956] text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Stage */}
        <div className="relative flex-1 min-h-[260px] bg-slate-950 flex items-center justify-center overflow-hidden">
          <img
            src={currentScene.src}
            alt={currentScene.title}
            className="w-full h-full max-h-[54vh] object-contain"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent px-5 py-4 flex flex-wrap items-end justify-between gap-3">
            <div className="text-white min-w-0">
              <div className="text-xs sm:text-sm font-bold truncate">
                {currentScene.title}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 truncate">
                {currentScene.subtitle} · {currentIdx + 1}/{filteredScenes.length}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectAsBanner(currentScene.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isPinned
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#e99b20] text-[#172033] hover:bg-[#f4ad36]'
              }`}
            >
              {isPinned && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{isPinned ? 'Đang hiển thị trên Banner' : 'Đặt làm Banner trang chủ'}</span>
            </button>
          </div>

          {filteredScenes.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => {
                  const prev =
                    filteredScenes[
                      (currentIdx - 1 + filteredScenes.length) %
                        filteredScenes.length
                    ];
                  setCurrentId(prev.id);
                }}
                aria-label="Ảnh 3D trước"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white grid place-items-center border border-white/15 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next =
                    filteredScenes[(currentIdx + 1) % filteredScenes.length];
                  setCurrentId(next.id);
                }}
                aria-label="Ảnh 3D tiếp theo"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white grid place-items-center border border-white/15 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Filmstrip */}
        <div className="p-3 bg-[#f7f9fc] border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-2">
            {filteredScenes.map((scene) => {
              const selected = scene.id === currentScene.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setCurrentId(scene.id)}
                  title={scene.title}
                  className={`relative w-24 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    selected
                      ? 'border-[#0b1956] ring-2 ring-[#0b1956]/25'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={scene.src}
                    alt={scene.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
