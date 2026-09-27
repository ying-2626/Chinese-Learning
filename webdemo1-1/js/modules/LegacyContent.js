// Shared handling for server content and the existing session response contract.
const LegacyContent = {
    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[character]);
    },

    getUser() {
        try {
            const user = JSON.parse(localStorage.getItem('user_info') || 'null');
            return user && typeof user.sessionId === 'string' && user.sessionId ? user : null;
        } catch (_) {
            return null;
        }
    },

    headers(json = false) {
        const user = this.getUser();
        if (!user) {
            const error = new Error('请先登录后使用此功能');
            error.code = 1013;
            throw error;
        }
        return { ...(json ? { 'Content-Type': 'application/json' } : {}), session: user.sessionId };
    },

    result(response) {
        const data = response.data;
        if (!data || data.code !== 0) {
            const error = new Error(data?.message || '服务暂时不可用，请稍后重试');
            error.code = data?.code;
            throw error;
        }
        return data.result;
    },

    isAuthError(error) {
        const code = error?.code ?? error?.response?.data?.code;
        return [1013, 1014, 1015, 1016, 1017, 2003, 2004, 2005, 2006, 9041].includes(code)
            || error?.response?.status === 401;
    },

    safeUrl(value) {
        try {
            const url = new URL(String(value), window.location.href);
            return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '';
        } catch (_) {
            return '';
        }
    },

    markdown(value) {
        const content = String(value ?? '');
        if (typeof marked === 'undefined') return this.escapeHtml(content).replace(/\n/g, '<br>');
        const template = document.createElement('template');
        template.innerHTML = marked.parse(content);
        const allowed = new Set(['P', 'BR', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'CODE', 'PRE',
            'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TABLE', 'THEAD', 'TBODY',
            'TR', 'TH', 'TD', 'A', 'HR', 'DEL']);
        template.content.querySelectorAll('*').forEach(element => {
            if (!allowed.has(element.tagName)) {
                if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH'].includes(element.tagName)) {
                    element.remove();
                } else {
                    element.replaceWith(document.createTextNode(element.textContent || ''));
                }
                return;
            }
            const href = element.tagName === 'A' ? this.safeUrl(element.getAttribute('href') || '') : '';
            [...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
            if (href) {
                element.setAttribute('href', href);
                element.setAttribute('target', '_blank');
                element.setAttribute('rel', 'noopener noreferrer');
            }
        });
        return template.innerHTML;
    }
};

if (typeof window !== 'undefined') window.LegacyContent = LegacyContent;
if (typeof module !== 'undefined' && module.exports) module.exports = LegacyContent;
