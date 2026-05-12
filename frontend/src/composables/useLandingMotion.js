import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export function useLandingMotion() {
  const landingRoot = ref(null)
  const heroProgress = ref(0)
  const storyProgress = ref(0)
  const activeScene = ref(0)
  const reducedMotion = ref(false)
  let lenis
  let rafId = 0
  let context
  let matchMedia
  let reduceMotionQuery

  const sceneProgress = computed(() => Math.max(heroProgress.value, storyProgress.value))

  function destroyLenis() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = 0
    }
    lenis?.destroy()
    lenis = undefined
  }

  function startLenis() {
    if (lenis) return
    lenis = new Lenis({
      duration: 0.86,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1.08,
      anchors: true
    })
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => {
      lenis?.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)
  }

  function resetMotionState() {
    heroProgress.value = 0
    storyProgress.value = 0
    activeScene.value = 0
  }

  onMounted(() => {
    if (typeof window === 'undefined') return

    reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.value = reduceMotionQuery.matches
    if (!landingRoot.value) return

    context = gsap.context(() => {
      matchMedia = gsap.matchMedia()
      matchMedia.add(
        {
          desktop: '(min-width: 1024px)',
          reduce: '(prefers-reduced-motion: reduce)'
        },
        (conditionsContext) => {
          const { desktop, reduce } = conditionsContext.conditions
          reducedMotion.value = reduce
          if (reduce) {
            destroyLenis()
            resetMotionState()
            return undefined
          }

          if (desktop) startLenis()
          else destroyLenis()

          const heroTween = gsap
            .timeline({
              scrollTrigger: {
                trigger: '.landing-hero-stage',
                start: 'top top',
                end: desktop ? '+=115%' : 'bottom top',
                scrub: desktop ? 0.4 : 0.28,
                pin: desktop,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  heroProgress.value = Number(self.progress.toFixed(3))
                  activeScene.value = Math.min(4, Math.floor(self.progress * 5))
                }
              }
            })
            .to('.voice-theater-backdrop', { scale: desktop ? 1.08 : 1, yPercent: desktop ? -4 : 0, ease: 'none' }, 0)
            .to('.hero-copy', { yPercent: desktop ? -8 : 0, autoAlpha: desktop ? 0.92 : 1, ease: 'none' }, 0)
            .to('.trust-strip', { yPercent: desktop ? -18 : 0, ease: 'none' }, 0)

          const storyTrack = landingRoot.value.querySelector('.story-track')
          const storyCards = gsap.utils.toArray('.story-card', landingRoot.value)
          let horizontalTween
          let mobileStoryTrigger
          const cardTweens = []
          const revealTweens = []

          if (storyTrack && storyCards.length > 1 && desktop) {
            const storyViewport = landingRoot.value.querySelector('.learning-theater')
            const distance = () => Math.max(0, storyTrack.scrollWidth - (storyViewport?.clientWidth || window.innerWidth) + 140)
            horizontalTween = gsap.to(storyTrack, {
              x: () => -distance(),
              ease: 'none',
              scrollTrigger: {
                trigger: '.story-stage',
                start: 'top top',
                end: () => `+=${distance() + window.innerHeight * 0.42}`,
                scrub: 0.32,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  storyProgress.value = Number(self.progress.toFixed(3))
                  activeScene.value = Math.min(storyCards.length - 1, Math.floor(self.progress * storyCards.length))
                }
              }
            })

            storyCards.forEach((card, index) => {
              cardTweens.push(
                gsap.fromTo(
                  card,
                  { autoAlpha: 0.34, y: 74, rotateY: -18, scale: 0.86 },
                  {
                    autoAlpha: 1,
                    y: 0,
                    rotateY: 0,
                    scale: 1.02,
                    ease: 'power3.out',
                    scrollTrigger: {
                      trigger: card,
                      containerAnimation: horizontalTween,
                      start: index === 0 ? 'left 75%' : 'left 82%',
                      end: 'left 34%',
                      scrub: true
                    }
                  }
                )
              )
            })
          } else {
            mobileStoryTrigger = ScrollTrigger.create({
              trigger: '.story-stage',
              start: 'top 70%',
              end: 'bottom 30%',
              scrub: 0.5,
              onUpdate: (self) => {
                storyProgress.value = Number(self.progress.toFixed(3))
                activeScene.value = Math.min(3, Math.floor(self.progress * 4))
              }
            })
          }

          gsap.utils.toArray('.kinetic-reveal', landingRoot.value).forEach((element, index) => {
            revealTweens.push(
              gsap.fromTo(
                element,
                { autoAlpha: 0, y: 28 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.72,
                  ease: 'power3.out',
                  delay: Math.min(index * 0.04, 0.18),
                  scrollTrigger: {
                    trigger: element,
                    start: 'top 86%',
                    once: true
                  }
                }
              )
            )
          })

          return () => {
            revealTweens.forEach((tween) => tween?.kill())
            cardTweens.forEach((tween) => tween?.kill())
            mobileStoryTrigger?.kill()
            horizontalTween?.kill()
            heroTween?.kill()
            destroyLenis()
            ScrollTrigger.refresh()
          }
        }
      )
    }, landingRoot)
  })

  onBeforeUnmount(() => {
    matchMedia?.revert()
    context?.revert()
    destroyLenis()
  })

  return {
    landingRoot,
    heroProgress,
    storyProgress,
    sceneProgress,
    activeScene,
    reducedMotion
  }
}
