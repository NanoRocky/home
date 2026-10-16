<template>
  <Teleport to="body">
    <Transition name="notes-mask-fade">
      <div v-if="store.noteOpenState" class="notes-overlay" :class="{ 'avoid-footer': shouldAvoidFooter }"
        :style="overlayStyle" @click="closeNotes" @mousedown="handleMouseDown">
        <Transition name="notes-sink" appear>
          <div v-if="store.noteOpenState" class="notes-container" ref="notesContainerRef" :style="containerStyle"
            @click.stop @mousedown="handleMouseDown">
            <!-- 头部：书签按钮、标题、已打开标签栏、操作按钮 -->
            <div class="notes-header">
              <div class="header-left">
                <!-- 书签侧栏展开/收起按钮 -->
                <el-tooltip :content="$t('components.notes.bookmarkList')" placement="top" effect="color"
                  :show-arrow="false">
                  <button class="action-btn bookmark-btn" :class="{ active: showSidebar }"
                    @click="showSidebar = !showSidebar" type="button">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                    </svg>
                  </button>
                </el-tooltip>
                <div class="title-badge">
                  <span class="badge-text">{{ $t("components.notes.title") }}</span>
                </div>
              </div>

              <!-- 顶部标签栏（仅显示已打开的便签标签） -->
              <div class="header-tabs">
                <div class="tabs-scroll" ref="tabsScrollRef" @wheel="onTabsWheel">
                  <button v-for="item in openedNotes" :key="item.id" class="tab-item"
                    :class="{ active: item.id === currentNote?.id }" @click="switchNoteById(item.id)" type="button">
                    <span class="tab-index">{{ getNoteNumber(item.id) }}</span>
                    <el-tooltip :content="item.title.trim() || $t('components.notes.untitled')" placement="top"
                      effect="color" :show-arrow="false">
                      <span class="tab-name text-truncate-ellipsis">
                        {{ item.title.trim() || $t("components.notes.untitled") }}
                      </span>
                    </el-tooltip>
                    <!-- 关闭标签页按钮（多于 1 个打开标签时可关闭标签，不删除原便签） -->
                    <el-tooltip v-if="openedNotes.length > 1" :content="$t('components.notes.closeTab')" placement="top"
                      effect="color" :show-arrow="false">
                      <span class="tab-close-icon" @click.stop="closeTab(item.id)"> &times; </span>
                    </el-tooltip>
                  </button>
                </div>
              </div>

              <!-- 右侧快捷操作：新建、导入、导出、删除、关闭 -->
              <div class="header-actions">
                <!-- 新建便签 -->
                <el-tooltip :content="$t('components.notes.newNote')" placement="top" effect="color"
                  :show-arrow="false">
                  <button class="action-btn new-btn" @click="addNewNote" type="button">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                  </button>
                </el-tooltip>

                <!-- 导入 JSON -->
                <el-tooltip :content="$t('components.notes.importNotes')" placement="top" effect="color"
                  :show-arrow="false">
                  <button class="action-btn import-btn" @click="triggerImport" type="button">
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                  </button>
                </el-tooltip>
                <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="onFileSelected" />

                <!-- 导出 JSON -->
                <el-tooltip :content="$t('components.notes.exportNotes')" placement="top" effect="color"
                  :show-arrow="false">
                  <button class="action-btn export-btn" @click="exportNotes" type="button">
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
                    </svg>
                  </button>
                </el-tooltip>

                <!-- 删除便签 -->
                <el-tooltip :content="$t('components.notes.deleteNote')" placement="top" effect="color"
                  :show-arrow="false">
                  <span class="btn-tooltip-wrap">
                    <button class="action-btn delete-btn" :disabled="notes.length <= 1 && isCurrentNoteEmpty"
                      @click="deleteCurrentNote" type="button">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </span>
                </el-tooltip>

                <!-- 关闭便签 -->
                <el-tooltip :content="$t('components.notes.shortcutHint')" placement="top" effect="color"
                  :show-arrow="false">
                  <button class="action-btn close-btn" @click="closeNotes" type="button">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </el-tooltip>
              </div>
            </div>

            <!-- 便签主体包装区 -->
            <div class="notes-content-wrap">
              <!-- 左侧书签便签全量列表 -->
              <Transition name="sidebar-slide">
                <div v-show="showSidebar" class="notes-sidebar">
                  <div class="sidebar-header">
                    <span class="sidebar-title">
                      {{ $t("components.notes.bookmarkList") }}
                      <span class="count-pill">{{ notes.length }}</span>
                    </span>
                    <el-tooltip :content="$t('components.notes.newNote')" placement="top" effect="color"
                      :show-arrow="false">
                      <button class="sidebar-action-btn" @click="addNewNote" type="button">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                      </button>
                    </el-tooltip>
                  </div>
                  <div class="sidebar-list">
                    <div v-for="(item, index) in notes" :key="item.id" class="sidebar-item"
                      :class="{ active: item.id === currentNote?.id }" @click="openNoteFromSidebar(item.id)">
                      <span class="sidebar-item-index">{{ index + 1 }}</span>
                      <div class="sidebar-item-info">
                        <el-tooltip :content="item.title.trim() || $t('components.notes.untitled')" placement="top"
                          effect="color" :show-arrow="false">
                          <span class="sidebar-item-title text-truncate-ellipsis">
                            {{ item.title.trim() || $t("components.notes.untitled") }}
                          </span>
                        </el-tooltip>
                        <span class="sidebar-item-date">{{ formatDate(item.updatedAt) }}</span>
                      </div>
                      <el-tooltip :content="$t('components.notes.deleteNote')" placement="top" effect="color"
                        :show-arrow="false">
                        <button class="sidebar-item-del" @click.stop="deleteNoteById(item.id)" type="button">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                          </svg>
                        </button>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </Transition>

              <!-- 便签编辑区 -->
              <div class="notes-body" v-if="currentNote">
                <input ref="titleInputRef" v-model="currentNote.title" class="note-title-input" type="text"
                  :placeholder="$t('components.notes.titlePlaceholder')" autocomplete="off" spellcheck="false"
                  @input="onNoteInput" @keydown.space.stop />
                <div class="note-divider"></div>
                <textarea ref="contentAreaRef" v-model="currentNote.content" class="note-content-area"
                  :placeholder="$t('components.notes.contentPlaceholder')" spellcheck="false" @input="onNoteInput"
                  @keydown.space.stop></textarea>
              </div>
            </div>

            <!-- 底部状态条：翻页指示器、切歌/翻页模式提示、字数统计、拖拽缩放把手 -->
            <div class="notes-footer">
              <div class="footer-left">
                <!-- 翻页控制 -->
                <div class="pager-controls">
                  <el-tooltip :content="$t('components.notes.pageUp')" placement="top" effect="color"
                    :show-arrow="false">
                    <span class="btn-tooltip-wrap">
                      <button class="pager-btn" :disabled="currentIndex <= 0" @click="prevNote" type="button">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                        </svg>
                      </button>
                    </span>
                  </el-tooltip>
                  <span class="pager-text"> {{ currentIndex + 1 }} / {{ notes.length }} </span>
                  <el-tooltip :content="$t('components.notes.pageDown')" placement="top" effect="color"
                    :show-arrow="false">
                    <span class="btn-tooltip-wrap">
                      <button class="pager-btn" :disabled="currentIndex >= notes.length - 1" @click="nextNote"
                        type="button">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                        </svg>
                      </button>
                    </span>
                  </el-tooltip>
                </div>

                <!-- PGUP / PGDN 功能提示徽章 -->
                <div class="key-hint-chip" :class="{ 'is-music': store.playerState }">
                  <span class="chip-dot"></span>
                  <span>
                    {{
                      store.playerState
                        ? $t("components.notes.musicPlayingHint")
                        : $t("components.notes.pageFlipHint")
                    }}
                  </span>
                </div>
              </div>

              <div class="footer-right">
                <span class="word-count">
                  {{ currentNote?.content?.length || 0 }} {{ $t("components.notes.characters") }}
                </span>
                <el-tooltip :content="$t('components.notes.shortcutHint')" placement="top" effect="color"
                  :show-arrow="false">
                  <span class="shortcut-tag" @click="closeNotes">Alt N</span>
                </el-tooltip>

                <!-- 右下角鼠标拖拽调大/调小手柄 -->
                <el-tooltip :content="$t('components.notes.resize')" placement="top" effect="color" :show-arrow="false">
                  <div class="resize-grip" @mousedown.prevent.stop="startResize">
                    <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                      <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="currentColor" stroke-width="1.6"
                        stroke-linecap="round" />
                    </svg>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { mainStore } from "@/store";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import type { NoteItem } from "@/typings/store";

const store = mainStore();
const { t } = useI18n();

const notes = ref<NoteItem[]>([]);
const currentIndex = ref(0);
const openedTabIds = ref<string[]>([]);
const showSidebar = ref(false);

const titleInputRef = ref<HTMLInputElement | null>(null);
const contentAreaRef = ref<HTMLTextAreaElement | null>(null);
const notesContainerRef = ref<HTMLElement | null>(null);
const tabsScrollRef = ref<HTMLElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const customWidth = ref<number | null>(null);
const customHeight = ref<number | null>(null);

const shouldAvoidFooter = computed(() => {
  return !!(store.playerLrcShow && store.notesAvoidFooter);
});

const footerClearance = computed(() => {
  if (!shouldAvoidFooter.value) return 0;
  const hasTrLrc = !!(
    store.playerState &&
    store.playerLrcShow &&
    store.playerTrLrc &&
    store.playerTrLrcText
  );
  return hasTrLrc ? 100 : 60;
});

const overlayStyle = computed(() => {
  if (!shouldAvoidFooter.value) return {};
  return {
    paddingBottom: `${footerClearance.value + 16}px`,
  };
});

const containerStyle = computed(() => {
  const styles: Record<string, string> = {};
  if (customWidth.value) {
    styles.width = `${customWidth.value}px`;
  }
  if (customHeight.value) {
    styles.height = `${customHeight.value}px`;
  }
  if (shouldAvoidFooter.value) {
    const bottomReserve = footerClearance.value + 36;
    const maxH = Math.max(280, window.innerHeight - bottomReserve);
    styles.maxHeight = `${maxH}px`;
  }
  return styles;
});

let justOpened = false;

// 随机 Hash 生成器（保证唯一性）
const generateHash = (len = 8) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, len);
  }
  return (
    Math.random()
      .toString(36)
      .slice(2, 2 + len) + Date.now().toString(36)
  );
};

const currentNote = computed<NoteItem | undefined>(() => {
  return notes.value[currentIndex.value];
});

// 标签栏仅展示 openedTabIds 包含的便签
const openedNotes = computed(() => {
  return openedTabIds.value
    .map((id) => notes.value.find((n) => n.id === id))
    .filter((n): n is NoteItem => Boolean(n));
});

const isCurrentNoteEmpty = computed(() => {
  if (!currentNote.value) return true;
  return !currentNote.value.title.trim() && !currentNote.value.content.trim();
});

const getNoteNumber = (id: string) => {
  const idx = notes.value.findIndex((n) => n.id === id);
  return idx !== -1 ? idx + 1 : 1;
};

// 格式化更新日期
const formatDate = (timestamp?: number) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}-${day} ${h}:${min}`;
};

// 标签栏自动横向滚动到当前选中项
const scrollToActiveTab = () => {
  nextTick(() => {
    if (!tabsScrollRef.value) return;
    const activeEl = tabsScrollRef.value.querySelector(".tab-item.active") as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  });
};

// 标签栏鼠标滚轮横向滚动
const onTabsWheel = (e: WheelEvent) => {
  if (tabsScrollRef.value && e.deltaY !== 0) {
    tabsScrollRef.value.scrollLeft += e.deltaY;
  }
};

// 加载笔记
const loadNotes = () => {
  try {
    const raw: any = store.userNotes;
    let parsed: any = raw;
    if (typeof raw === "string" && raw.trim()) {
      parsed = JSON.parse(raw);
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      notes.value = parsed.map((item: any) => ({
        id: item.id ? String(item.id) : `note_${Date.now()}_${generateHash()}`,
        title: typeof item.title === "string" ? item.title : "",
        content: typeof item.content === "string" ? item.content : "",
        createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
        updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
      }));
      if (currentIndex.value >= notes.value.length) {
        currentIndex.value = notes.value.length - 1;
      }
      // 默认仅将当前激活的一篇加入打开的标签栏中
      const curId = notes.value[currentIndex.value]?.id;
      if (curId && !openedTabIds.value.includes(curId)) {
        openedTabIds.value = [curId];
      }
      store.userNotes = notes.value;
      return;
    }
  } catch (err) {
    console.warn(t("console.notes.parseFailed"), err);
  }

  // 默认初始便签
  const initialId = `note_${Date.now()}_${generateHash()}`;
  notes.value = [
    {
      id: initialId,
      title: t("components.notes.welcomeTitle"),
      content: t("components.notes.welcomeContent"),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
  openedTabIds.value = [initialId];
  saveNotes();
};

const saveNotes = () => {
  try {
    store.userNotes = JSON.parse(JSON.stringify(notes.value));
  } catch (err) {
    console.error(t("console.notes.saveFailed"), err);
  }
};

const onNoteInput = () => {
  if (currentNote.value) {
    currentNote.value.updatedAt = Date.now();
    saveNotes();
  }
};

// 通过 ID 切换便签
const switchNoteById = (id: string) => {
  const idx = notes.value.findIndex((n) => n.id === id);
  if (idx !== -1) {
    currentIndex.value = idx;
    if (!openedTabIds.value.includes(id)) {
      openedTabIds.value.push(id);
    }
    scrollToActiveTab();
    nextTick(() => {
      contentAreaRef.value?.focus();
    });
  }
};

// 从侧栏点击打开便签
const openNoteFromSidebar = (id: string) => {
  switchNoteById(id);
};

// 关闭顶部单个标签
const closeTab = (id: string) => {
  if (openedTabIds.value.length <= 1) return;
  const idx = openedTabIds.value.indexOf(id);
  if (idx === -1) return;

  openedTabIds.value.splice(idx, 1);
  // 如果关闭的是当前正在编辑的便签，自动切换到相邻的标签
  if (currentNote.value?.id === id) {
    const nextId = openedTabIds.value[Math.min(idx, openedTabIds.value.length - 1)];
    const nextIdx = notes.value.findIndex((n) => n.id === nextId);
    if (nextIdx !== -1) {
      currentIndex.value = nextIdx;
      scrollToActiveTab();
    }
  }
};

// 翻页上一篇
const prevNote = () => {
  if (currentIndex.value > 0) {
    const targetId = notes.value[currentIndex.value - 1]?.id;
    if (targetId) {
      switchNoteById(targetId);
    }
  }
};

// 翻页下一篇
const nextNote = () => {
  if (currentIndex.value < notes.value.length - 1) {
    const targetId = notes.value[currentIndex.value + 1]?.id;
    if (targetId) {
      switchNoteById(targetId);
    }
  }
};

// 新建便签（自动生成 Hash 并加入标签栏）
const addNewNote = () => {
  const newNote: NoteItem = {
    id: `note_${Date.now()}_${generateHash()}`,
    title: "",
    content: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.value.push(newNote);
  openedTabIds.value.push(newNote.id);
  currentIndex.value = notes.value.length - 1;
  saveNotes();
  scrollToActiveTab();
  ElMessage({
    message: t("components.notes.created"),
    type: "success",
    grouping: true,
    duration: 1500,
  });
  nextTick(() => {
    titleInputRef.value?.focus();
  });
};

// 根据 ID 删除便签
const deleteNoteById = (id: string) => {
  const idx = notes.value.findIndex((n) => n.id === id);
  if (idx === -1) return;

  if (notes.value.length <= 1) {
    if (currentNote.value) {
      currentNote.value.title = "";
      currentNote.value.content = "";
      currentNote.value.updatedAt = Date.now();
      saveNotes();
      ElMessage({
        message: t("components.notes.deleted"),
        type: "info",
        grouping: true,
        duration: 1500,
      });
    }
    return;
  }

  notes.value.splice(idx, 1);
  const tabIdx = openedTabIds.value.indexOf(id);
  if (tabIdx !== -1) {
    openedTabIds.value.splice(tabIdx, 1);
  }

  if (currentIndex.value >= notes.value.length) {
    currentIndex.value = notes.value.length - 1;
  }
  const curId = notes.value[currentIndex.value]?.id;
  if (curId && !openedTabIds.value.includes(curId)) {
    openedTabIds.value.push(curId);
  }

  saveNotes();
  scrollToActiveTab();
  ElMessage({
    message: t("components.notes.deleted"),
    type: "info",
    grouping: true,
    duration: 1500,
  });
};

// 删除当前便签
const deleteCurrentNote = () => {
  if (currentNote.value) {
    deleteNoteById(currentNote.value.id);
  }
};

// 一键导出便签 (JSON)
const exportNotes = async () => {
  try {
    const dataStr = JSON.stringify(notes.value, null, 2);
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    const filename = `nanorocky-notes-${dateStr}.json`;

    // 优先尝试现代 File System Access API（向系统和浏览器明确指定保存类型为 JSON）
    if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "JSON (*.json)",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(new Blob([dataStr], { type: "application/json" }));
        await writable.close();

        ElMessage({
          message: t("components.notes.exportSuccess"),
          type: "success",
          grouping: true,
          duration: 2000,
        });
        return;
      } catch (pickerErr: any) {
        if (pickerErr?.name === "AbortError") {
          return; // 用户取消了保存
        }
        console.warn(t("console.notes.showSaveFilePickerFallback"), pickerErr);
      }
    }

    // 浏览器标准下载兜底：指定正确的 application/json MIME 类型与扩展名
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.type = "application/json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    ElMessage({
      message: t("components.notes.exportSuccess"),
      type: "success",
      grouping: true,
      duration: 2000,
    });
  } catch (err) {
    console.error(t("console.notes.exportFailed"), err);
  }
};

// 触发导入文件选择
const triggerImport = async () => {
  // 现代浏览器支持 showOpenFilePicker 时优先使用，可直接限制文件类型为 JSON
  if (typeof window !== "undefined" && "showOpenFilePicker" in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: "JSON (*.json)",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
        multiple: false,
      });
      if (handle) {
        const file = await handle.getFile();
        parseAndImportFile(file);
        return;
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return; // 用户取消选择
      }
      console.warn(t("console.notes.showOpenFilePickerFallback"), err);
    }
  }

  // 传统 input[type=file] 兜底
  fileInputRef.value?.click();
};

// 解析并导入 JSON 便签文件
const parseAndImportFile = (file: File) => {
  if (!file) return;

  // 校验扩展名与类型
  const isJson = file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
  if (!isJson) {
    ElMessage({
      message: t("components.notes.selectJsonHint"),
      type: "warning",
      grouping: true,
      duration: 2500,
    });
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const parsed = JSON.parse(content);
      let importedList: any[] = [];

      if (Array.isArray(parsed)) {
        importedList = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.notes)) {
          importedList = parsed.notes;
        } else if (parsed.content || parsed.title) {
          importedList = [parsed];
        }
      }

      if (importedList.length === 0) {
        throw new Error("No notes found in file");
      }

      let mergedCount = 0;
      for (const rawItem of importedList) {
        const item: NoteItem = {
          id: rawItem.id ? String(rawItem.id) : `note_${Date.now()}_${generateHash()}`,
          title: typeof rawItem.title === "string" ? rawItem.title : "",
          content: typeof rawItem.content === "string" ? rawItem.content : "",
          createdAt: typeof rawItem.createdAt === "number" ? rawItem.createdAt : Date.now(),
          updatedAt: typeof rawItem.updatedAt === "number" ? rawItem.updatedAt : Date.now(),
        };

        const existingIndex = notes.value.findIndex(
          (n) =>
            (n.id && n.id === item.id) ||
            (item.title.trim() && n.title.trim() === item.title.trim()),
        );

        if (existingIndex !== -1) {
          notes.value[existingIndex] = {
            ...notes.value[existingIndex],
            title: item.title,
            content: item.content,
            updatedAt: item.updatedAt || Date.now(),
          };
          if (!openedTabIds.value.includes(notes.value[existingIndex].id)) {
            openedTabIds.value.push(notes.value[existingIndex].id);
          }
        } else {
          if (notes.value.length === 1 && isCurrentNoteEmpty.value) {
            notes.value[0] = item;
            openedTabIds.value = [item.id];
          } else {
            notes.value.push(item);
            openedTabIds.value.push(item.id);
          }
        }
        mergedCount++;
      }

      saveNotes();
      scrollToActiveTab();
      ElMessage({
        message: t("components.notes.importSuccess", { count: mergedCount }),
        type: "success",
        grouping: true,
        duration: 2500,
      });
    } catch (err) {
      console.error(t("console.notes.importFailed"), err);
      ElMessage({
        message: t("components.notes.importError"),
        type: "error",
        grouping: true,
        duration: 2500,
      });
    } finally {
      if (fileInputRef.value) {
        fileInputRef.value.value = "";
      }
    }
  };
  reader.readAsText(file);
};

// 导入文件选择事件处理（用于 input[type=file] 兜底）
const onFileSelected = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    parseAndImportFile(file);
  }
};

// 鼠标拖拽调整大小
const startResize = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const container = notesContainerRef.value;
  if (!container) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = container.offsetWidth;
  const startHeight = container.offsetHeight;

  const onMouseMove = (moveEvent: MouseEvent) => {
    moveEvent.preventDefault();

    const bottomReserve = shouldAvoidFooter.value ? footerClearance.value + 36 : 40;
    const maxW = Math.max(320, window.innerWidth - 32);
    const maxH = Math.max(280, window.innerHeight - bottomReserve);
    const minW = Math.min(320, maxW);
    const minH = Math.min(280, maxH);

    const deltaX = (moveEvent.clientX - startX) * 2;
    const deltaY = (moveEvent.clientY - startY) * 2;

    const newWidth = Math.min(maxW, Math.max(minW, Math.round(startWidth + deltaX)));
    const newHeight = Math.min(maxH, Math.max(minH, Math.round(startHeight + deltaY)));

    customWidth.value = newWidth;
    customHeight.value = newHeight;
  };

  const onMouseUp = () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

// 视口缩放或避让底栏状态改变时自动修正窗口大小，确保始终有安全边距
const handleViewportResize = () => {
  const bottomReserve = shouldAvoidFooter.value ? footerClearance.value + 36 : 40;
  const maxW = window.innerWidth - 32;
  const maxH = Math.max(280, window.innerHeight - bottomReserve);
  if (customWidth.value && customWidth.value > maxW) {
    customWidth.value = Math.max(320, maxW);
  }
  if (customHeight.value && customHeight.value > maxH) {
    customHeight.value = maxH;
  }
};

watch([shouldAvoidFooter, footerClearance], () => {
  handleViewportResize();
});

// 打开便签
const openNotes = () => {
  if (
    store.mobileOpenState ||
    store.mobileFuncState ||
    store.setOpenState ||
    store.backgroundShow ||
    store.musicBoxOpenState ||
    store.boxOpenState
  ) {
    store.noteOpenState = false;
    return;
  }

  // 关闭搜索框
  if (store.searchOpenState) {
    store.searchOpenState = false;
  }

  loadNotes();
  handleViewportResize();
  store.noteOpenState = true;
  justOpened = true;
  setTimeout(() => {
    justOpened = false;
  }, 150);

  scrollToActiveTab();
  nextTick(() => {
    contentAreaRef.value?.focus();
  });
};

// 关闭便签
const closeNotes = () => {
  saveNotes();
  store.noteOpenState = false;
};

// 鼠标中键拦截（防止触发壁纸预览）
const handleMouseDown = (e: MouseEvent) => {
  if (e.button === 1) {
    e.stopPropagation();
    e.preventDefault();
  }
};

// 键盘事件监听
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  // Alt + N 呼出/收起便签
  if (e.altKey && (e.key === "n" || e.key === "N" || e.code === "KeyN")) {
    e.preventDefault();
    if (store.noteOpenState) {
      closeNotes();
    } else {
      openNotes();
    }
    return;
  }

  if (!store.noteOpenState) return;

  // Esc 退出
  if (e.key === "Escape") {
    e.preventDefault();
    closeNotes();
    return;
  }

  // PGUP / PGDN：音乐没有在播放时用于翻页
  if (e.code === "PageUp") {
    if (!store.playerState && notes.value.length > 1) {
      e.preventDefault();
      prevNote();
    }
  } else if (e.code === "PageDown") {
    if (!store.playerState && notes.value.length > 1) {
      e.preventDefault();
      nextNote();
    }
  }
};

// 监听开启状态
watch(
  () => store.noteOpenState,
  (val) => {
    if (val) {
      if (!justOpened) {
        openNotes();
      }
    } else {
      saveNotes();
    }
  },
);

// 监听当前便签切换，自动将选中便签滚动至标签栏视野中央
watch(
  () => currentIndex.value,
  () => {
    scrollToActiveTab();
  },
);

// 监听其他全屏/弹窗状态，如有开启则关闭便签
watch(
  () => [store.mobileOpenState, store.setOpenState, store.backgroundShow],
  ([mobile, set, bg]) => {
    if ((mobile || set || bg) && store.noteOpenState) {
      closeNotes();
    }
  },
);

onMounted(() => {
  loadNotes();
  window.addEventListener("keydown", handleGlobalKeyDown);
  window.addEventListener("resize", handleViewportResize);
});

onBeforeUnmount(() => {
  saveNotes();
  window.removeEventListener("keydown", handleGlobalKeyDown);
  window.removeEventListener("resize", handleViewportResize);
});
</script>

<style lang="scss" scoped>
.notes-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.4);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: padding-bottom 0.25s ease;

  &.avoid-footer {
    .notes-container {
      height: min(640px, calc(100% - 10px));
      min-height: min(280px, calc(100% - 10px));
      max-height: calc(100% - 10px);
    }
  }
}

.notes-container {
  position: relative;
  width: min(840px, calc(100vw - 40px));
  height: min(640px, calc(100vh - 80px));
  min-width: min(360px, calc(100vw - 32px));
  min-height: min(380px, calc(100vh - 40px));
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 40px);

  display: flex;
  flex-direction: column;
  border-radius: 20px;
  overflow: hidden;
  user-select: text;

  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%),
    var(--search-dropdown-background-color, rgba(22, 22, 26, 0.8));
  -webkit-backdrop-filter: blur(28px);
  backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.45),
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px rgba(255, 255, 255, 0.22);

  transition:
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

// 头部
.notes-header {
  height: 52px;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bookmark-btn {
  &.active {
    color: rgb(244, 167, 89);
    background-color: rgba(244, 167, 89, 0.18);
    opacity: 1;
  }
}

.title-badge {
  display: inline-flex;
  align-items: center;
  color: var(--text-color, #fff);
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.5px;
  opacity: 0.95;
  margin-right: 4px;
}

.header-tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.tabs-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.4);
    }
  }
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  max-width: 145px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-color, #fff);
  font-size: 0.8rem;
  cursor: pointer;
  opacity: 0.65;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    opacity: 0.95;
    background: rgba(255, 255, 255, 0.14);
  }

  &.active {
    opacity: 1;
    background: rgba(255, 255, 255, 0.22);
    border-color: rgba(255, 255, 255, 0.35);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-weight: 500;
  }

  .tab-index {
    font-size: 0.72rem;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.18);
    font-family: monospace;
    flex-shrink: 0;
  }

  .tab-name {
    flex: 1;
    min-width: 0;
    max-width: 96px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tab-close-icon {
    font-size: 1rem;
    line-height: 1;
    opacity: 0.5;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    margin-left: -1px;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.25);
      color: rgb(255, 99, 132);
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-color, #fff);
  opacity: 0.7;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background-color 0.2s,
    transform 0.15s,
    color 0.2s;

  &:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.15);
  }

  &:active {
    transform: scale(0.92);
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;

    &:hover {
      background: transparent;
    }
  }

  &.import-btn:hover {
    color: rgb(57, 159, 255);
    background-color: rgba(57, 159, 255, 0.16);
  }

  &.export-btn:hover {
    color: rgb(78, 205, 196);
    background-color: rgba(78, 205, 196, 0.16);
  }

  &.delete-btn:hover:not(:disabled) {
    color: rgb(255, 99, 132);
    background-color: rgba(255, 99, 132, 0.18);
  }
}

.btn-tooltip-wrap {
  display: inline-flex;
}

// 主体包装区（支持左侧抽屉式便签列表）
.notes-content-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
  overflow: hidden;
}

// 左侧书签便签全量列表
.notes-sidebar {
  width: 240px;
  min-width: 240px;
  max-width: 260px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
}

.sidebar-header {
  height: 42px;
  min-height: 42px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);

  .sidebar-title {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text-color, #fff);
    opacity: 0.85;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    .count-pill {
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.12);
      font-weight: 400;
    }
  }

  .sidebar-action-btn {
    border: none;
    background: transparent;
    color: var(--text-color, #fff);
    opacity: 0.7;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.18);
    border-radius: 4px;
  }
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  background: transparent;
  transition: all 0.18s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);

    .sidebar-item-del {
      opacity: 0.6;
    }
  }

  &.active {
    background: rgba(255, 255, 255, 0.16);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

    .sidebar-item-title {
      font-weight: 600;
      opacity: 1;
    }
  }

  .sidebar-item-index {
    font-size: 0.72rem;
    font-family: monospace;
    opacity: 0.6;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .sidebar-item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-item-title {
    font-size: 0.85rem;
    color: var(--text-color, #fff);
    opacity: 0.85;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-item-date {
    font-size: 0.7rem;
    color: var(--text-color, #fff);
    opacity: 0.45;
  }

  .sidebar-item-del {
    border: none;
    background: transparent;
    color: var(--text-color, #fff);
    opacity: 0;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover {
      opacity: 1 !important;
      color: rgb(255, 99, 132);
      background: rgba(255, 99, 132, 0.18);
    }
  }
}

// 主体编辑区
.notes-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 24px;
}

.note-title-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-color, #fff);
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: 0.4px;
  padding: 0 0 8px 0;
  font-family: inherit;

  &::placeholder {
    color: var(--text-color, #fff);
    opacity: 0.4;
    font-weight: 400;
  }
}

.note-divider {
  width: 100%;
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 6px 0 14px 0;
}

.note-content-area {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-color, #fff);
  font-family: inherit;
  font-size: 1.02rem;
  line-height: 1.75;
  letter-spacing: 0.3px;
  resize: none;
  padding: 0;
  overflow-y: auto;

  &::placeholder {
    color: var(--text-color, #fff);
    opacity: 0.4;
  }

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.22);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.35);
    }
  }
}

// 底部栏
.notes-footer {
  height: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  user-select: none;
  font-size: 0.8rem;
  color: var(--text-color, #fff);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pager-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pager-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-color, #fff);
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.16);
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
}

.pager-text {
  font-family: monospace;
  font-size: 0.82rem;
  opacity: 0.75;
}

.key-hint-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.72rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0.8;

  .chip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgb(57, 159, 255);
  }

  &.is-music {
    .chip-dot {
      background: rgb(244, 167, 89);
    }
  }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.word-count {
  opacity: 0.5;
  font-size: 0.75rem;
}

.shortcut-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-family: monospace, sans-serif;
  opacity: 0.45;
  padding: 2px 7px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition:
    opacity 0.2s,
    background-color 0.2s;

  &:hover {
    opacity: 0.9;
    background-color: rgba(255, 255, 255, 0.2);
  }
}

// 窗口右下角鼠标缩放把手
.resize-grip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  cursor: nwse-resize;
  opacity: 0.4;
  color: var(--text-color, #fff);
  transition:
    opacity 0.2s,
    transform 0.15s;

  &:hover {
    opacity: 0.95;
    transform: scale(1.15);
  }
}

// 侧栏展开动画
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition:
    width 0.28s cubic-bezier(0.2, 0.9, 0.3, 1),
    opacity 0.22s ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  width: 0 !important;
  opacity: 0;
}

// 动画：从顶部沉入
.notes-mask-fade-enter-active,
.notes-mask-fade-leave-active {
  transition: opacity 0.35s ease;
}

.notes-mask-fade-enter-from,
.notes-mask-fade-leave-to {
  opacity: 0;
}

.notes-sink-enter-active {
  transition:
    opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.42s cubic-bezier(0.16, 1, 0.3, 1);
}

.notes-sink-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.notes-sink-enter-from {
  opacity: 0;
  transform: translateY(-50px) scale(0.96);
}

.notes-sink-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.97);
}
</style>
