export const THEME_COLORS = { light: '#F4F3EF', dark: '#0E0E0D' } as const

/** Runs in <head> before paint. Dark unless the visitor chose light. */
export const THEME_SCRIPT = `(function(){var t=null;try{t=localStorage.getItem('km-theme')}catch(e){}if(t==='light'){document.documentElement.dataset.theme='light';var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${THEME_COLORS.light}')}})()`
