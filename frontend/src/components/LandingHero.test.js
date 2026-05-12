import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LandingHero from './LandingHero.vue'

const routerLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="typeof to === \'string\' ? to : to?.path"><slot /></a>'
}

const voiceTheaterBackdropStub = {
  name: 'VoiceTheaterBackdrop',
  props: ['progress', 'activeScene'],
  template: '<div class="voice-theater-backdrop-stub" :data-progress="progress" :data-scene="activeScene" />'
}

describe('LandingHero', () => {
  it('uses an unframed first-screen voice theater backdrop without a right-side 3D box', () => {
    const wrapper = mount(LandingHero, {
      props: { progress: 0.42, activeScene: 2 },
      global: {
        stubs: {
          RouterLink: routerLinkStub,
          VoiceTheaterBackdrop: voiceTheaterBackdropStub
        },
        directives: {
          motion: {}
        }
      }
    })

    const theater = wrapper.find('.voice-theater-backdrop-stub')

    expect(wrapper.find('.landing-hero-stage').exists()).toBe(true)
    expect(theater.exists()).toBe(true)
    expect(theater.attributes('data-progress')).toBe('0.42')
    expect(theater.attributes('data-scene')).toBe('2')
    expect(wrapper.find('.three-voice-hero').exists()).toBe(false)
    expect(wrapper.text()).toContain('开始语音测评')
    expect(wrapper.text()).toContain('创建学习档案')
  })
})
