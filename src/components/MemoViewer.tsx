'use client'

import { useEffect, useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void | Promise<void>
}

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
}: MemoViewerProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!memo) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [memo, handleKeyDown])

  useEffect(() => {
    setSummary(null)
    setSummaryError(null)
    setSummaryLoading(false)
  }, [memo?.id])

  if (!memo) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category] ?? colors.other
  }

  const handleDeleteClick = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  const handleEditClick = () => {
    onEdit(memo)
    onClose()
  }

  const handleSummarize = async () => {
    if (!memo || summaryLoading) return
    setSummaryLoading(true)
    setSummaryError(null)
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: memo.title, content: memo.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '요약 실패')
      setSummary(data.summary ?? '')
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '요약에 실패했습니다.')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer-modal"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <h2
              className="text-2xl font-bold text-gray-900 mb-3 leading-tight"
              data-testid="memo-viewer-title"
            >
              {memo.title}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(memo.category)}`}
              >
                {MEMO_CATEGORIES[
                  memo.category as keyof typeof MEMO_CATEGORIES
                ] ?? memo.category}
              </span>
              <span className="text-xs text-gray-400">
                작성 {formatDate(memo.createdAt)}
              </span>
              {memo.createdAt !== memo.updatedAt && (
                <span className="text-xs text-gray-400">
                  수정 {formatDate(memo.updatedAt)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="닫기"
            data-testid="memo-viewer-close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 - 마크다운 프리뷰 */}
        <div
          className="px-6 py-5 prose prose-sm max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-2
            prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-em:text-gray-700 prose-em:italic
            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
            prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
            prose-li:text-gray-700 prose-li:my-0.5
            prose-blockquote:border-l-4 prose-blockquote:border-blue-300
            prose-blockquote:pl-4 prose-blockquote:text-gray-600 prose-blockquote:italic
            prose-code:bg-gray-100 prose-code:text-pink-600 prose-code:rounded
            prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:font-mono
            prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg
            prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:my-3
            prose-table:border-collapse prose-table:w-full
            prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50
            prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
            prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2
            prose-hr:border-gray-200 prose-hr:my-4"
          data-testid="memo-viewer-content"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {memo.content}
          </ReactMarkdown>
        </div>

        {/* AI 요약 결과 */}
        {(summary || summaryLoading || summaryError) && (
          <div
            className="mx-6 mb-4 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4"
            data-testid="memo-viewer-summary"
          >
            <div className="flex items-center gap-2 mb-2">
              <svg
                className="w-4 h-4 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span className="text-xs font-semibold text-purple-700">
                AI 요약
              </span>
            </div>
            {summaryLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>메모를 요약하는 중...</span>
              </div>
            )}
            {summaryError && (
              <p className="text-sm text-red-600" role="alert">
                {summaryError}
              </p>
            )}
            {summary && !summaryLoading && (
              <div
                className="prose prose-sm max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:my-1
                  prose-strong:text-gray-900
                  prose-ul:list-disc prose-ul:pl-5 prose-ul:my-1
                  prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-1
                  prose-li:text-gray-700 prose-li:my-0.5
                  prose-code:bg-white prose-code:text-pink-600 prose-code:rounded
                  prose-code:px-1 prose-code:py-0.5 prose-code:text-xs"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {summary}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* 태그 */}
        {memo.tags.length > 0 && (
          <div className="px-6 pb-4 flex gap-2 flex-wrap">
            {memo.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 푸터 액션 버튼 */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleSummarize}
            disabled={summaryLoading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            data-testid="memo-viewer-summarize"
          >
            {summaryLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
            AI 요약
          </button>
          <button
            onClick={handleEditClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            data-testid="memo-viewer-edit"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            편집
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            data-testid="memo-viewer-delete"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
