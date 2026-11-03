// 考试冲刺中心：按考试类型展示冲刺计划与题型，题型练习直接进入语音测评或数字人陪练
(() => {
    // 计划中的天数与预估分为演示数据；题型结构按考试大纲整理
    const EXAMS = {
        hskk: {
            title: 'HSKK 中级 · 目标 60 分以上',
            desc: '口语考试共 3 部分 14 题，重点考查复述、看图描述和成段表达。',
            days: 12,
            predicted: 72,
            readyNote: '再完成 2 次全真模考，预估分会更准确。',
            phase: 1,
            sections: [
                { name: '听后重复', meta: ['10 题'], desc: '听一句话后完整复述，考查语音和语句记忆。', mode: '读句子', practice: '读句子',
                  sample: '我每天早上七点起床，然后去公园跑步。' },
                { name: '看图说话', meta: ['2 题'], desc: '根据图片内容说一段完整的话。', target: 'voice', practice: '数字人陪练' },
                { name: '回答问题', meta: ['2 题'], desc: '围绕生活话题成段表达自己的看法。', target: 'voice', practice: '数字人陪练' }
            ]
        },
        putonghua: {
            title: '普通话水平测试 · 目标二级甲等',
            desc: '共 4 项，满分 100 分；二级甲等需达到 87 分。',
            days: 20,
            predicted: 84,
            readyNote: '声调是主要失分点，建议多练单音节字词。',
            phase: 1,
            sections: [
                { name: '读单音节字词', meta: ['100 个', '10 分'], desc: '逐字考查声母、韵母和声调。', mode: '读汉字', practice: '读汉字',
                  sample: '北 学 中 文 春 日 热 水 思 想' },
                { name: '读多音节词语', meta: ['100 音节', '20 分'], desc: '考查轻声、儿化和变调。', mode: '读汉字', practice: '读汉字',
                  sample: '普通话 朋友 学习 认真 一会儿' },
                { name: '朗读短文', meta: ['400 音节', '30 分'], desc: '考查语流音变、停顿和流畅度。', mode: '读段落', practice: '读段落',
                  sample: '春天来了，小草从地里钻出来，树枝上长出了新叶。孩子们在公园里放风筝，笑声传得很远。我喜欢春天，因为它让人充满希望。' },
                { name: '命题说话', meta: ['3 分钟', '40 分'], desc: '围绕给定话题连续说话，不看稿。', target: 'voice', practice: '数字人陪练' }
            ]
        }
    };
    const PHASES = ['基础纠音', '题型专项', '全真模考'];

    function openModule(id) {
        document.querySelector(`#sidebar .side-footer.${id}`)?.click();
    }

    function practice(section) {
        if (section.target === 'voice') {
            openModule('voice');
            return;
        }
        openModule('speech-evaluation');
        const mode = document.querySelector(`input[name="group"][value="${section.mode}"]`);
        if (mode && !mode.disabled) mode.checked = true;
        const text = document.getElementById('evalText');
        if (text && text.getAttribute('contenteditable') !== 'false') {
            text.textContent = section.sample;
            text.focus();
        }
    }

    function init() {
        const root = document.getElementById('exam-service');
        if (!root) return;
        const field = name => root.querySelector(`[data-exam-field="${name}"]`);
        const tabs = root.querySelectorAll('.exam-tab');
        let current = EXAMS.hskk;

        function render(key) {
            current = EXAMS[key];
            tabs.forEach(tab => {
                const on = tab.dataset.exam === key;
                tab.classList.toggle('active', on);
                tab.setAttribute('aria-selected', String(on));
            });
            field('title').textContent = current.title;
            field('desc').textContent = current.desc;
            field('days').textContent = current.days;
            field('predicted').textContent = current.predicted;
            field('readyNote').textContent = current.readyNote;
            field('ring').style.setProperty('--score', current.predicted);
            field('phases').innerHTML = PHASES.map((name, i) => {
                const state = i < current.phase ? 'done' : i === current.phase ? 'now' : 'todo';
                const tag = state === 'done' ? '已完成' : state === 'now' ? '进行中' : '未开始';
                return `<li data-state="${state}"><span>${i + 1}</span><b>${name}</b><small>${tag}</small></li>`;
            }).join('');
            field('sections').innerHTML = current.sections.map((s, i) => `
                <article class="ex-section">
                    <div class="ex-section-head">
                        <h4>${s.name}</h4>
                        <span class="ex-section-meta">${s.meta.map(m => `<em>${m}</em>`).join('')}</span>
                    </div>
                    <p>${s.desc}</p>
                    <div class="ex-section-foot">
                        <span class="ex-section-link" data-kind="${s.target === 'voice' ? 'voice' : 'eval'}">${s.practice}</span>
                        <button type="button" class="ex-go" data-section="${i}">去练习</button>
                    </div>
                </article>`).join('');
        }

        tabs.forEach(tab => tab.addEventListener('click', () => render(tab.dataset.exam)));
        root.addEventListener('click', event => {
            const go = event.target.closest('.ex-go');
            if (go) practice(current.sections[Number(go.dataset.section)]);
            if (event.target.closest('[data-exam-start]')) practice(current.sections[0]);
            if (event.target.closest('[data-exam-pro]') && typeof showPurchaseModal === 'function') showPurchaseModal('exam-service');
        });
        render('hskk');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
