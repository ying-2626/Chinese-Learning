import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RealFeedbackProof from './RealFeedbackProof.vue'

describe('RealFeedbackProof', () => {
  it('uses only the approved local feedback board assets', () => {
    const wrapper = mount(RealFeedbackProof)
    const images = wrapper.findAll('img')
    const srcs = images.map((image) => image.attributes('src'))

    expect(srcs).toEqual(['/assets/img/图片1.png', '/assets/img/图片2.png'])
    expect(srcs.every((src) => src.startsWith('/assets/img/'))).toBe(true)
    expect(srcs.some((src) => src.includes('apple-ui'))).toBe(false)
    expect(srcs.some((src) => src.endsWith('.jpg'))).toBe(false)
  })

  it('keeps composite boards readable and replaces the rail with paper notes', () => {
    const wrapper = mount(RealFeedbackProof)
    const boards = wrapper.findAll('[data-feedback-kind="board"]')
    const photos = wrapper.findAll('[data-feedback-kind="photo"]')
    const notes = wrapper.findAll('.feedback-note-card')

    expect(boards.length).toBe(2)
    expect(boards.map((board) => board.classes()).flat()).toContain('feedback-frame-contain')
    expect(photos.length).toBe(0)
    expect(notes.length).toBeGreaterThanOrEqual(6)
    expect(wrapper.text()).toContain('用户内测纸条')
  })
})
