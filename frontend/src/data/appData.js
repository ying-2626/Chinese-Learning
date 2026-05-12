export const asset = (path) => `/assets/${path}`

export const evalModes = [
  { label: '读汉字', value: 0, helper: '适合声母、韵母、声调专项纠正' },
  { label: '读句子', value: 1, helper: '适合日常表达和完整句朗读' },
  { label: '读段落', value: 2, helper: '适合语流、停顿和整体语感训练' }
]

export const navItems = [
  { name: 'speech', path: '/app/speech', label: '语音测评', icon: 'Mic' },
  { name: 'voice', path: '/app/voice', label: '数字人口语', icon: 'Headphones' },
  { name: 'chat', path: '/app/chat', label: '聊天机器人', icon: 'MessageCircle' },
  { name: 'tools', path: '/app/tools', label: '工具箱', icon: 'Wrench' },
  { name: 'learning', path: '/app/learning', label: '个性学习', icon: 'GraduationCap' },
  { name: 'exam', path: '/app/exam', label: '考试冲刺', icon: 'ClipboardCheck' },
  { name: 'history', path: '/app/history', label: '历史记录', icon: 'History' },
  { name: 'feedback', path: '/app/feedback', label: '用户反馈', icon: 'Heart' }
]

export const partnerLogos = [
  { src: asset('img/华东师范大学.PNG'), alt: '华东师范大学' },
  { src: asset('img/科大讯飞.PNG'), alt: '科大讯飞' },
  { src: asset('img/chatgpt.png'), alt: 'ChatGPT' },
  { src: asset('img/fastgpt.PNG'), alt: 'FastGPT' }
]

export const learnerPhotos = ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg'].map(
  (name) => asset(`img/${name}`)
)

export const pricingPlans = [
  {
    name: '免费',
    price: '0元/月',
    tone: 'starter',
    features: ['每月50轮AI对话', '30天对话记录保留', '语音评分系统 10次/月', 'AI 领读与基础反馈']
  },
  {
    name: '标准',
    price: '33元/月',
    tone: 'standard',
    features: ['每月120轮AI对话', '180天对话记录保留', '语音详细评估 25次/月', '解锁单词本、语法家、阅读家等工具']
  },
  {
    name: '无限',
    price: '66元/月',
    tone: 'pro',
    features: ['不限 AI 对话轮次', '360天对话记录保留', '不限次数语音评估报告', '个性化学习方案定制']
  },
  {
    name: '团队版',
    price: '询价',
    tone: 'team',
    features: ['团队账号管理', '统一学习任务', '团队学习社区', '机构专属折扣']
  }
]

export const toolCategories = ['全部', '内容生成', '答疑润色', '阅读文化', '学习支持']

export const magicTools = [
  {
    name: '单词本',
    category: '学习支持',
    description: '根据学习主题提供 HSK 1-6 级中文单词记背和检测。',
    icon: asset('SVG/单词本.svg'),
    href: 'https://typing-word.ttentau.top',
    status: '已上线'
  },
  {
    name: '演讲家',
    category: '内容生成',
    description: '基于话题和要求生成中文演讲稿，适合课堂展示和比赛准备。',
    icon: asset('SVG/演讲家.svg'),
    status: '智能生成'
  },
  {
    name: '语法家',
    category: '答疑润色',
    description: '讲解语法点，纠正句子中的结构和搭配问题。',
    icon: asset('SVG/语法.svg'),
    status: '语法答疑'
  },
  {
    name: '阅读家',
    category: '阅读文化',
    description: '提供不同难度的中文阅读材料与理解练习。',
    icon: asset('SVG/阅读.svg'),
    status: '阅读训练'
  },
  {
    name: '文化家',
    category: '阅读文化',
    description: '结合真实语境介绍中国文化知识，帮助理解语言背后的表达习惯。',
    icon: asset('SVG/文化.svg'),
    status: '文化拓展'
  },
  {
    name: '中外互译',
    category: '答疑润色',
    description: '提供中外互译和表达润色，辅助跨文化沟通。',
    icon: asset('SVG/中外互译.svg'),
    status: '表达润色'
  },
  {
    name: '写作生成',
    category: '内容生成',
    description: '根据主题生成中文短文初稿，并给出修改方向。',
    icon: asset('SVG/写作生成.svg'),
    status: '写作支持'
  },
  {
    name: '朗读家',
    category: '学习支持',
    description: '提供朗读示范和跟读训练，帮助建立自然语感。',
    icon: asset('SVG/朗读.svg'),
    status: '跟读训练'
  }
]

export const promptTemplates = {
  default: `你是一位专业的中文口语老师，请根据以下口语测评数据对学生的表现进行评价。
请先给出鼓励性的整体评价，再指出低分字、声母韵母声调问题和练习建议。
不要输出 JSON 字段名，不使用 Markdown，用亲切自然的老师口吻。`,
  paragraph: `你是一位专业的中文口语老师，请根据以下段落朗读测评数据进行评价。
重点关注整体流利度、停顿、语调自然度、语流音变和语感。
不要输出 JSON 字段名，不使用 Markdown，用亲切自然的老师口吻。`
}

export const learningPlan = {
  profile: [
    ['母语背景', '英语（美国）'],
    ['当前水平', 'HSK 3-4'],
    ['学习目标', '提升普通话发音与课堂表达'],
    ['每周计划', '4 次语音训练 + 2 次场景对话']
  ],
  tasks: [
    { title: '声调专项', detail: '第三声、轻声和连读训练', progress: 72 },
    { title: '生活场景', detail: '点餐、问路、课堂发言', progress: 58 },
    { title: '阅读表达', detail: '短文朗读与复述', progress: 46 }
  ]
}

export const examTasks = [
  { title: 'HSK 口语初级', detail: '听后重复、回答问题、看图说话', level: '基础' },
  { title: 'HSK 口语中级', detail: '短文朗读、主题表达、语法纠错', level: '进阶' },
  { title: '普通话展示', detail: '演讲开场、节奏控制、声调稳定', level: '展示' }
]
