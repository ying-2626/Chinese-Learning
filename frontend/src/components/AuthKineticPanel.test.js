import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AuthKineticPanel from './AuthKineticPanel.vue'

const voiceParticleStub = {
  name: 'VoiceParticleField',
  props: ['activeScene'],
  template: '<div class="voice-particle-field-stub" :data-scene="activeScene" />'
}

describe('AuthKineticPanel', () => {
  it('highlights the matching Chinese step when an English input field is focused', () => {
    const wrapper = mount(AuthKineticPanel, {
      props: { mode: 'register', activeField: 'email' },
      global: { stubs: { VoiceParticleField: voiceParticleStub } }
    })

    expect(wrapper.find('.auth-step.active').text()).toContain('邮箱')
  })

  it('maps password focus to the verification and password scene', () => {
    const wrapper = mount(AuthKineticPanel, {
      props: { mode: 'login', activeField: 'password' },
      global: { stubs: { VoiceParticleField: voiceParticleStub } }
    })

    expect(wrapper.find('.voice-particle-field-stub').attributes('data-scene')).toBe('2')
  })
})
