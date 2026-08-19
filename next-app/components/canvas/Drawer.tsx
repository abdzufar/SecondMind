"use client";

import { useState } from "react";
import { GitBranch } from "lucide-react";
import { elaborateNode, saveMindmap } from "@/lib/api";
import { removeNodeCascade } from "@/lib/canvas/layout";
import { useCanvasStore } from "@/store/canvasStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TodoPanel } from "./TodoPanel";

export type DrawerTab = "detail" | "todo";

type DrawerProps = {
  mindmapId: string;
  mindmapCreatedAt: string;
  mindmapTopic: string;
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
  onSendChat: (message: string, nodeId?: string, nodeLabel?: string) => void;
  onClose: () => void;
};

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function Drawer({
  mindmapId,
  mindmapCreatedAt,
  mindmapTopic,
  activeTab,
  onTabChange,
  onSendChat,
  onClose,
}: DrawerProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const toggleNodeComplete = useCanvasStore((s) => s.toggleNodeComplete);
  const renameNode = useCanvasStore((s) => s.renameNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const appendNodes = useCanvasStore((s) => s.appendNodes);
  const applyLayout = useCanvasStore((s) => s.applyLayout);
  const updateNodeNotes = useCanvasStore((s) => s.updateNodeNotes);
  const isOnline = useCanvasStore((s) => s.isOnline);

  const [isExpanding, setIsExpanding] = useState(false);
  const [expandError, setExpandError] = useState<string | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [notesDraft, setNotesDraft] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [chatDraft, setChatDraft] = useState("");

  const [isTogglingComplete, setIsTogglingComplete] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Sengaja diinisialisasi `null` (bukan `selectedNodeId`) — Drawer cuma di-mount
  // pas UDAH ada node yang dipilih (lihat isSidebarOpen di page.tsx), jadi kalau
  // di-seed dari selectedNodeId, `prevNodeId` bakal langsung sama kayak selectedNodeId
  // pas mount pertama dan block reset di bawah gak akan pernah jalan buat node
  // pertama yang diklik — notesDraft ketinggalan kosong walau node-nya punya catatan.
  const [prevNodeId, setPrevNodeId] = useState<string | null>(null);
  const node = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : undefined;

  if (selectedNodeId !== prevNodeId) {
    setPrevNodeId(selectedNodeId);
    setIsEditingTitle(false);
    setRenameError(null);
    setDeleteDialogOpen(false);
    setDeleteError(null);
    setChatDraft("");
    setNotesDraft(node?.data.userNotes ?? "");
    setNotesError(null);
    setCompleteError(null);
  }

  const isBranch = node?.type === "mindmap-branch";
  const parentEdge = isBranch ? edges.find((e) => e.target === node?.id) : undefined;
  const parentStep = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : undefined;

  const typeLabel = isBranch ? "Cabang mindmap" : "Langkah roadmap";

  // Cuma dihitung buat roadmap-step (bukan mindmap-branch) — klik anak node
  // (cabang) gak lagi nampilin seksi ini sama sekali, sesuai redesign yang
  // diminta. Filter eksplisit `type === "mindmap-branch"` (bukan cuma
  // `source === node.id`) sekalian benerin bug lama: tanpa itu, edge spine
  // ke step SELANJUTNYA ikut kehitung sebagai "cabang" (lihat catatan M5 di
  // CLAUDE.md).
  const stepBranches = !isBranch
    ? nodes.filter(
        (n) => n.type === "mindmap-branch" && edges.some((e) => e.source === node?.id && e.target === n.id),
      )
    : [];

  function handleStartEdit() {
    if (!node) return;
    setTitleDraft(node.data.label);
    setRenameError(null);
    setIsEditingTitle(true);
  }

  function handleCancelEdit() {
    setIsEditingTitle(false);
    setRenameError(null);
  }

  function handleSaveTitle() {
    if (!node || !isOnline) return;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setRenameError("Judul gak boleh kosong.");
      return;
    }
    if (trimmed === node.data.label) {
      setIsEditingTitle(false);
      return;
    }

    const previousLabel = node.data.label;
    setIsSavingTitle(true);
    setRenameError(null);
    renameNode(node.id, trimmed);
    const { nodes: updatedNodes } = useCanvasStore.getState();
    saveMindmap(mindmapId, { nodes: updatedNodes })
      .then(() => setIsEditingTitle(false))
      .catch(() => {
        renameNode(node.id, previousLabel);
        setRenameError("Gagal menyimpan judul baru.");
      })
      .finally(() => setIsSavingTitle(false));
  }

  function handleToggleComplete() {
    if (!node || !isOnline) return;

    setIsTogglingComplete(true);
    setCompleteError(null);
    toggleNodeComplete(node.id);
    const { nodes: updatedNodes } = useCanvasStore.getState();
    saveMindmap(mindmapId, { nodes: updatedNodes })
      .catch(() => {
        toggleNodeComplete(node.id);
        setCompleteError("Gagal menyimpan status selesai.");
      })
      .finally(() => setIsTogglingComplete(false));
  }

  function handleSaveNotes() {
    if (!node || !isOnline) return;
    const previousNotes = node.data.userNotes ?? "";
    if (notesDraft === previousNotes) return; // gak ada perubahan, gak usah call API

    setIsSavingNotes(true);
    setNotesError(null);
    updateNodeNotes(node.id, notesDraft);
    const { nodes: updatedNodes } = useCanvasStore.getState();
    saveMindmap(mindmapId, { nodes: updatedNodes })
      .catch(() => {
        updateNodeNotes(node.id, previousNotes);
        setNotesDraft(previousNotes);
        setNotesError("Gagal menyimpan catatan.");
      })
      .finally(() => setIsSavingNotes(false));
  }

  function handleConfirmDelete() {
    if (!node || !isOnline) return;

    setIsDeleting(true);
    setDeleteError(null);
    const preview = removeNodeCascade(nodes, edges, node.id);
    saveMindmap(mindmapId, { nodes: preview.nodes, edges: preview.edges })
      .then(() => {
        deleteNode(node.id);
        setDeleteDialogOpen(false);
        onClose();
      })
      .catch(() => setDeleteError("Gagal menghapus node. Coba lagi."))
      .finally(() => setIsDeleting(false));
  }

  function handleSubmitChat(e: React.FormEvent) {
    e.preventDefault();
    if (!node || !isOnline) return;
    const trimmed = chatDraft.trim();
    if (!trimmed) return;
    onSendChat(trimmed, node.id, node.data.label);
    onClose();
  }

  function handleExpand() {
    if (!node || !isOnline) return;

    setIsExpanding(true);
    setExpandError(null);
    elaborateNode({ nodeId: node.id, concept: node.data.label, action: "expand", language: "id" })
      .then(({ newNodes, newEdges }) => {
        appendNodes(newNodes, newEdges);
        applyLayout();
        const { nodes: updatedNodes, edges: updatedEdges } = useCanvasStore.getState();
        return saveMindmap(mindmapId, { nodes: updatedNodes, edges: updatedEdges }).catch(() => {
          setExpandError("Cabang baru muncul tapi gagal disimpan — refresh bisa menghilangkannya. Coba lagi.");
        });
      })
      .catch(() => setExpandError("Gagal memecah jadi sub-cabang. Coba lagi."))
      .finally(() => setIsExpanding(false));
  }

  return (
    <>
      {/* Cuma kepake di layar kecil (<900px, lihat canvas.css) — di layar
          gede gak dirender secara visual (display:none), gak ganggu apa-apa. */}
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer">
        <div className="drawer-handle" aria-hidden="true" />
        <div className="drawer-head">
        <div className="drawer-tabs">
          <button
            type="button"
            className={`drawer-tab${activeTab === "detail" ? " is-active" : ""}`}
            onClick={() => onTabChange("detail")}
          >
            Detail
          </button>
          <button
            type="button"
            className={`drawer-tab${activeTab === "todo" ? " is-active" : ""}`}
            onClick={() => onTabChange("todo")}
          >
            To-Do
          </button>
        </div>
        <button type="button" className="icon-btn" aria-label="Tutup panel" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      {activeTab === "todo" ? (
        <TodoPanel mindmapId={mindmapId} mindmapCreatedAt={mindmapCreatedAt} selectedNodeLabel={node?.data.label} />
      ) : !node ? (
        <div className="drawer-body">
          <p className="drawer-empty">Pilih node di canvas buat lihat detailnya.</p>
        </div>
      ) : (
        <div className="drawer-body">
          {isBranch && parentStep && (
            <button type="button" className="parent-step" onClick={() => selectNode(parentStep.id)}>
              <span className="parent-step-num">{parentStep.data.num}</span>
              <span className="parent-step-body">
                <span className="parent-step-time">{parentStep.data.timeMark}</span>
                <span className="parent-step-label">{parentStep.data.label}</span>
              </span>
            </button>
          )}

          <div className="node-head">
            <div className="node-head-row">
              {isEditingTitle ? (
                <input
                  className="node-title"
                  value={titleDraft}
                  onChange={(e) => {
                    setTitleDraft(e.target.value);
                    if (renameError) setRenameError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  aria-label="Judul node"
                  autoFocus
                />
              ) : (
                <strong className="node-title-static">{node.data.label}</strong>
              )}

              <div className="node-head-actions">
                {isEditingTitle ? (
                  <>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Simpan judul"
                      onClick={handleSaveTitle}
                      disabled={isSavingTitle || !isOnline}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button type="button" className="icon-btn" aria-label="Batal edit" onClick={handleCancelEdit}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="icon-btn" aria-label="Edit judul" onClick={handleStartEdit}>
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Hapus node"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={!isOnline}
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
              </div>
            </div>
            <span className={`node-type${isBranch ? "" : " is-step"}`}>{typeLabel}</span>
            {renameError && <p className="field-error">{renameError}</p>}
          </div>

          {!isBranch && (
            <>
              <button
                type="button"
                className={`complete-btn${node.data.isCompleted ? " is-complete" : ""}`}
                onClick={handleToggleComplete}
                disabled={isTogglingComplete || !isOnline}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {node.data.isCompleted ? "Sudah selesai" : "Tandai selesai"}
              </button>
              {completeError && <p className="field-error">{completeError}</p>}
            </>
          )}

          <div className="drawer-divider"></div>

          <div className="drawer-section">
            <h4>Ringkasan</h4>
            <p>{node.data.description}</p>
          </div>

          <div className="drawer-section">
            <h4>Catatan</h4>
            <div style={{ position: "relative" }}>
              <textarea
                key={node.id}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                onBlur={handleSaveNotes}
                disabled={isSavingNotes || !isOnline}
                placeholder="Tambahkan catatan buat cabang ini…"
                style={{ width: "100%", minHeight: "100px", padding: "8px", resize: "vertical", fontFamily: "var(--sm-font)", fontSize: "13px", borderRadius: "var(--sm-radius-sm)", border: "1px solid var(--sm-line)", background: "var(--sm-paper)", color: "var(--sm-ink)" }}
              />
            </div>
            {notesError && <p className="field-error">{notesError}</p>}
          </div>

          <div className="drawer-divider"></div>

          {!isBranch && (
            <div className="drawer-section">
              <h4 className="branch-section-title">
                <GitBranch aria-hidden="true" />
                Cabang yang Tumbuh di Sini
                {stepBranches.length > 0 && <span className="branch-count-badge">{stepBranches.length}</span>}
              </h4>
              {stepBranches.length > 0 ? (
                <div className="sibling-list">
                  {stepBranches.map((s) => (
                    <button type="button" key={s.id} className="sibling" onClick={() => selectNode(s.id)}>
                      {s.data.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="branch-section-empty">
                  Belum ada cabang di langkah ini — coba &quot;Pecah jadi sub-cabang&quot; di bawah.
                </p>
              )}
            </div>
          )}

          <div className="ai-zone">
            <span className="ai-zone-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v4" />
                <path d="M12 17v4" />
                <path d="M3 12h4" />
                <path d="M17 12h4" />
                <path d="m6.3 6.3 2.8 2.8" />
                <path d="m14.9 14.9 2.8 2.8" />
                <path d="m17.7 6.3-2.8 2.8" />
                <path d="m9.1 14.9-2.8 2.8" />
              </svg>
              Aksi AI
            </span>
            <form className="ask-ai" onSubmit={handleSubmitChat}>
              <input
                type="text"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Tanya soal cabang ini…"
              />
              <button type="submit" aria-label="Kirim" disabled={!isOnline}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </form>
            <button type="button" className="expand-btn" onClick={handleExpand} disabled={isExpanding || !isOnline}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              {isExpanding ? "Memproses…" : "Pecah jadi sub-cabang"}
            </button>
            {expandError && <p className="field-error">{expandError}</p>}
          </div>

          <p className="drawer-meta">Topik: {mindmapTopic}</p>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader className="items-center text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <TrashIcon className="size-5" />
            </div>
            <DialogTitle>Hapus node ini?</DialogTitle>
            <p style={{ marginTop: -4, marginBottom: 8, fontSize: 14, fontWeight: 600, color: "var(--sm-ink-70)" }}>
              &quot;{node?.data.label}&quot;
            </p>
            <DialogDescription>
              {isBranch
                ? "Cabang ini akan dihapus dari mindmap. Tindakan ini tidak bisa dibatalkan."
                : "Langkah ini beserta seluruh cabangnya akan dihapus, dan langkah sebelum-sesudahnya akan disambung ulang. Tindakan ini tidak bisa dibatalkan."}
            </DialogDescription>
            {deleteError && <p className="field-error">{deleteError}</p>}
          </DialogHeader>
          <DialogFooter className="justify-center" style={{ justifyContent: "center" }}>
            <Button
              variant="outline"
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="px-7"
              style={{ height: 40, paddingLeft: 28, paddingRight: 28 }}
              onClick={handleConfirmDelete}
              disabled={isDeleting || !isOnline}
            >
              {isDeleting ? "Menghapus…" : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </aside>
    </>
  );
}
