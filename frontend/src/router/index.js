import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '@/views/LandingView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import PricingView from '@/views/PricingView.vue'
import OnboardingView from '@/views/OnboardingView.vue'
import AppShell from '@/components/AppShell.vue'
import SpeechEvalView from '@/views/SpeechEvalView.vue'
import VoiceView from '@/views/VoiceView.vue'
import ChatView from '@/views/ChatView.vue'
import ToolsView from '@/views/ToolsView.vue'
import LearningView from '@/views/LearningView.vue'
import ExamView from '@/views/ExamView.vue'
import HistoryView from '@/views/HistoryView.vue'
import FeedbackView from '@/views/FeedbackView.vue'

const routes = [
  { path: '/', name: 'landing', component: LandingView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },
  { path: '/pricing', name: 'pricing', component: PricingView },
  { path: '/onboarding', name: 'onboarding', component: OnboardingView },
  {
    path: '/app',
    component: AppShell,
    redirect: '/app/speech',
    children: [
      { path: 'speech', name: 'speech', component: SpeechEvalView },
      { path: 'voice', name: 'voice', component: VoiceView },
      { path: 'chat', name: 'chat', component: ChatView },
      { path: 'tools', name: 'tools', component: ToolsView },
      { path: 'learning', name: 'learning', component: LearningView },
      { path: 'exam', name: 'exam', component: ExamView },
      { path: 'history', name: 'history', component: HistoryView },
      { path: 'feedback', name: 'feedback', component: FeedbackView }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

function hasSession() {
  try {
    return Boolean(JSON.parse(localStorage.getItem('user_info') || '{}')?.sessionId)
  } catch {
    return false
  }
}

router.beforeEach((to) => {
  if (to.path.startsWith('/app') && !hasSession()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
