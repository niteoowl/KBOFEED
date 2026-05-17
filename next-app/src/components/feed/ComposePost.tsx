'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createPost } from '@/app/actions/post';
import { useProfile } from '@/context/ProfileContext';
import { buildPollTag, extractGifUrl } from '@/lib/content';

// ─── IMGBB 임시방편 키 (제거 쉽게 분리) ───
const IMGBB_API_KEY = 'fdd1c97d2f4e24833b2ae441153061f9';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

// ─── Klipy GIF API ───
const KLIPY_APP_KEY = '8HmSCYNUL4rhrnFaKVJDVgJpparYc0PmqS5LgCR6wB60cHjp41vsX2C40pmWPefT';
const KLIPY_BASE_URL = `https://api.klipy.com/api/v1/${KLIPY_APP_KEY}`;

type ComposePostProps = {
  /** 게시 후 홈 피드 등에서 목록 갱신 */
  onPosted?: (newPostContent?: string) => void | Promise<void>;
};

interface KlipyGif {
  id: string;
  slug: string;
  title: string;
  blur_preview?: string;
  file: {
    md?: { webp?: string; gif?: string; mp4?: string };
    sm?: { webp?: string; gif?: string; mp4?: string };
    xs?: { webp?: string; gif?: string };
  };
}

const ComposePost = ({ onPosted }: ComposePostProps) => {
  const { data: session } = useSession();
  const { displayName, avatarUrl } = useProfile();
  const [content, setContent] = useState('');
  const [isPending, setIsPending] = useState(false);

  // ─── Image (IMGBB) ───
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // ─── GIF (Klipy) ───
  const [gifOpen, setGifOpen] = useState(false);
  const [gifSearch, setGifSearch] = useState('');
  const [gifs, setGifs] = useState<KlipyGif[]>([]);
  const [gifLoading, setGifLoading] = useState(false);

  // ─── Poll ───
  const [pollOpen, setPollOpen] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollEndsAt, setPollEndsAt] = useState('');

  if (!session) return null;

  // ─── Handlers ───

  const handleImageUpload = async (file: File) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('key', IMGBB_API_KEY);
      const res = await fetch(IMGBB_UPLOAD_URL, { method: 'POST', body: formData });
      const json: any = await res.json();
      if (json.success) {
        setImageUrls((prev) => [...prev, json.data.url]);
      } else {
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const fetchGifs = async (query?: string) => {
    setGifLoading(true);
    try {
      const endpoint = query
        ? `${KLIPY_BASE_URL}/gifs/search?q=${encodeURIComponent(query)}&per_page=20&locale=kr`
        : `${KLIPY_BASE_URL}/gifs/trending?per_page=20&locale=kr`;
      const res = await fetch(endpoint);
      const json: any = await res.json();
      if (json.result && json.data?.data) {
        setGifs(json.data.data);
      }
    } catch {
      setGifs([]);
    } finally {
      setGifLoading(false);
    }
  };

  const openGifPicker = () => {
    setGifOpen(true);
    setPollOpen(false);
    fetchGifs();
  };

  const selectGif = (gif: KlipyGif) => {
    // 1. 기존 함수로 URL 추출 시도
    let url = extractGifUrl(gif.file);

    // 2. 만약 반환값이 없거나 객체([object Object]) 형태로 들어왔다면 API 명세서 구조대로 직접 매핑
    if (!url || typeof url !== 'string' || url.includes('[object')) {
      // 명세서에 명시된 hd -> md -> sm -> xs 순서대로 gif 또는 webp 주소를 안전하게 탐색합니다.
      url = (gif.file as any)?.hd?.gif || (gif.file as any)?.hd?.webp ||
        gif.file?.md?.gif || gif.file?.md?.webp ||
        gif.file?.sm?.gif || gif.file?.sm?.webp ||
        gif.file?.xs?.gif || gif.file?.xs?.webp ||
        '';
    }

    // 3. 최종 URL 검증 및 상태 반영
    if (!url) {
      alert('GIF URL을 불러올 수 없습니다.');
      return;
    }

    setImageUrls([url]);
    setGifOpen(false);
    setGifSearch('');
  };

  const handleSubmit = async () => {
    if (isPending) return;

    // Poll logic: embed as JSON in content if poll active
    let finalContent = content;
    if (pollOpen && pollOptions.filter((o) => o.trim()).length >= 2) {
      finalContent =
        content +
        buildPollTag({
          options: pollOptions.filter((o) => o.trim()),
          endsAt: pollEndsAt || undefined,
        });
    }

    if (!finalContent.trim() && imageUrls.length === 0) return;

    const submittedContent = finalContent;
    
    let finalImgUrl: string | undefined = undefined;
    if (imageUrls.length > 1) {
      finalImgUrl = JSON.stringify(imageUrls);
    } else if (imageUrls.length === 1) {
      finalImgUrl = imageUrls[0];
    }

    setContent('');
    setImageUrls([]);
    setPollOpen(false);
    setPollOptions(['', '']);

    onPosted?.(submittedContent);

    setIsPending(true);
    try {
      await createPost(submittedContent, finalImgUrl);
    } catch {
      alert('게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="compose-trigger-section" style={{ padding: '16px 20px', borderBottom: '8px solid var(--divider-color)', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div
          className="user-avatar"
          style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined, backgroundSize: 'cover', width: '40px', height: '40px', minWidth: '40px', borderRadius: '50%', marginRight: 0 }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea
            placeholder="무슨 일이 일어나고 있나요?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontSize: '18px', resize: 'none', overflowY: 'auto', maxHeight: '400px', minHeight: '60px',
              fontFamily: 'inherit', color: 'var(--text-primary)', paddingTop: '8px'
            }}
          />

          {/* ─── Image Previews (Multiple) ─── */}
          {imageUrls.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <img src={url} alt="미리보기" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageUrls((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }} />
              이미지 업로드 중...
            </div>
          )}

          {/* ─── Poll Options ─── */}
          {pollOpen && (
            <div style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--divider-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>투표 만들기</span>
                <button onClick={() => { setPollOpen(false); setPollOptions(['', '']); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '16px' }}>
                  <i className="fas fa-times" />
                </button>
              </div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8, color: 'var(--text-secondary)' }}>
                투표 종료일 (선택)
                <input
                  type="datetime-local"
                  value={pollEndsAt}
                  onChange={(e) => setPollEndsAt(e.target.value)}
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: '1px solid var(--border-color)' }}
                />
              </label>
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[idx] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`선택지 ${idx + 1}`}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '15px', marginBottom: '6px', background: '#fff', color: 'var(--text-primary)' }}
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  style={{ background: 'none', border: '1px dashed var(--border-color)', color: 'var(--primary-color)', padding: '8px', borderRadius: '8px', width: '100%', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
                >
                  + 선택지 추가
                </button>
              )}
            </div>
          )}

          {/* ─── GIF Picker ─── */}
          {gifOpen && (
            <div style={{ marginTop: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', maxHeight: '360px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <i className="fas fa-search" style={{ color: 'var(--text-secondary)' }} />
                <input
                  value={gifSearch}
                  onChange={(e) => setGifSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchGifs(gifSearch); }}
                  placeholder="GIF 검색..."
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent', color: 'var(--text-primary)' }}
                />
                <button onClick={() => setGifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <i className="fas fa-times" />
                </button>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {gifLoading ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    <i className="fas fa-spinner fa-spin" /> 로딩 중...
                  </div>
                ) : gifs.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    결과가 없습니다.
                  </div>
                ) : (
                  gifs.map((gif) => {
                    const thumb = gif.file?.sm?.webp || gif.file?.sm?.gif || gif.file?.xs?.webp || '';
                    return (
                      <div
                        key={gif.id}
                        onClick={() => selectGif(gif)}
                        style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#f0f3f5' }}
                      >
                        <img src={thumb} alt={gif.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ─── Action Bar ─── */}
          <div className="compose-actions" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="action-icons" style={{ display: 'flex', gap: '16px', color: 'var(--primary-color)' }}>
              {/* Image Upload (IMGBB) */}
              <i
                className="far fa-image"
                title="이미지 업로드"
                style={{ cursor: 'pointer', fontSize: '20px', opacity: uploading ? 0.5 : 1 }}
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    for (let i = 0; i < files.length; i++) {
                      await handleImageUpload(files[i]);
                    }
                  }
                  e.target.value = '';
                }}
              />

              {/* GIF */}
              <i
                className="fas fa-film"
                title="GIF 추가"
                style={{ cursor: 'pointer', fontSize: '20px' }}
                onClick={openGifPicker}
              />

              {/* Hashtag */}
              <i
                className="fas fa-hashtag"
                title="태그 추가"
                style={{ cursor: 'pointer', fontSize: '20px' }}
                onClick={() => setContent(prev => prev + (prev.endsWith(' ') || !prev ? '#' : ' #'))}
              />

              {/* Poll */}
              <i
                className="fas fa-poll"
                title="투표 만들기"
                style={{ cursor: 'pointer', fontSize: '20px', color: pollOpen ? 'var(--accent-color)' : undefined }}
                onClick={() => { setPollOpen(!pollOpen); setGifOpen(false); }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && imageUrls.length === 0) || isPending}
              className="inline-post-btn"
              style={{
                padding: '8px 20px', fontSize: '15px', borderRadius: '9999px', border: 'none',
                backgroundColor: (content.trim() || imageUrls.length > 0) ? 'var(--primary-color)' : 'var(--primary-color-dim, #1d4ed8)',
                color: '#fff', fontWeight: 'bold', cursor: (content.trim() || imageUrls.length > 0) ? 'pointer' : 'default',
                opacity: (content.trim() || imageUrls.length > 0) ? 1 : 0.5, transition: '0.2s'
              }}
            >
              {isPending ? '게시 중...' : '게시하기'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComposePost;
