'use server'

import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/database.types'
import { Memo, MemoFormData } from '@/types/memo'
import { sampleMemos } from '@/utils/seedData'

type MemoRow = Database['public']['Tables']['memos']['Row']
type MemoInsert = Database['public']['Tables']['memos']['Insert']
type MemoUpdate = Database['public']['Tables']['memos']['Update']

function toMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeFormData(formData: MemoFormData): MemoFormData {
  return {
    title: formData.title.trim(),
    content: formData.content.trim(),
    category: formData.category,
    tags: formData.tags.map(tag => tag.trim()).filter(Boolean),
  }
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('로그인이 필요합니다.')
  }

  return { supabase, user }
}

export async function listMemos(): Promise<Memo[]> {
  const { supabase, user } = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`메모를 불러오지 못했습니다: ${error.message}`)
  }

  return data.map(toMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const { supabase, user } = await getAuthenticatedUser()
  const memoData = normalizeFormData(formData)
  const now = new Date().toISOString()
  const insertData: MemoInsert = {
    id: uuidv4(),
    user_id: user.id,
    ...memoData,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await supabase
    .from('memos')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new Error(`메모를 저장하지 못했습니다: ${error.message}`)
  }

  revalidatePath('/')
  return toMemo(data)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { supabase, user } = await getAuthenticatedUser()
  const memoData = normalizeFormData(formData)
  const updateData: MemoUpdate = {
    ...memoData,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('memos')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`메모를 수정하지 못했습니다: ${error.message}`)
  }

  revalidatePath('/')
  return toMemo(data)
}

export async function deleteMemo(id: string): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase
    .from('memos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`메모를 삭제하지 못했습니다: ${error.message}`)
  }

  revalidatePath('/')
}

export async function clearMemos(): Promise<void> {
  const { supabase, user } = await getAuthenticatedUser()
  const { error } = await supabase.from('memos').delete().eq('user_id', user.id)

  if (error) {
    throw new Error(`메모를 모두 삭제하지 못했습니다: ${error.message}`)
  }

  revalidatePath('/')
}

export async function seedSampleMemos(): Promise<Memo[]> {
  const { supabase, user } = await getAuthenticatedUser()
  const { count, error: countError } = await supabase
    .from('memos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) {
    throw new Error(
      `샘플 데이터 상태를 확인하지 못했습니다: ${countError.message}`
    )
  }

  if ((count ?? 0) > 0) {
    return listMemos()
  }

  const insertData: MemoInsert[] = sampleMemos.map(memo => ({
    id: uuidv4(),
    user_id: user.id,
    title: memo.title,
    content: memo.content,
    category: memo.category,
    tags: memo.tags,
    created_at: memo.createdAt,
    updated_at: memo.updatedAt,
  }))

  const { data, error } = await supabase
    .from('memos')
    .insert(insertData)
    .select()
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`샘플 데이터를 생성하지 못했습니다: ${error.message}`)
  }

  revalidatePath('/')
  return data.map(toMemo)
}
