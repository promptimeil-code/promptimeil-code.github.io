// promptime guides: small helpers for the reader. Nothing is saved and nothing is sent anywhere.
(() => {
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // home: a cover shows only once its post is out, like the Instagram grid; the newest gets "חדש"
  $$('.feed a[data-at]').forEach(a => { if (Date.parse(a.dataset.at) > Date.now()) a.hidden = true; });
  $$('.feed a').find(a => !a.hidden)?.classList.add('new');

  const more = $$('main h2').find(h => h.textContent.trim() === 'עוד מדריכים');
  const h1 = document.querySelector('h1');
  if (!more || !h1 || document.querySelector('.feed')) return;  // the rest is for guide pages only
  const before = el => more.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING;
  const title = document.title.split(' | ')[0];
  const meta = document.querySelector('h1 ~ .meta');

  // reading time, in the line under the title
  const words = $$('main p, main li, main pre').filter(before).reduce((n, e) => n + e.textContent.split(/\s+/).length, 0);
  const mins = Math.max(1, Math.round(words / 180));
  meta?.append(mins === 1 ? ' · דקת קריאה אחת' : ` · ${mins} דקות קריאה`);

  // steps menu: sticky at the top, marks the part you are reading
  const heads = $$('main h2').filter(h => before(h) && h.textContent.trim() !== 'מקורות');
  if (heads.length > 2) {
    const nav = document.createElement('nav');
    nav.className = 'toc';
    nav.setAttribute('aria-label', 'מה במדריך');
    for (const [i, h] of heads.entries()) {
      h.id ||= 's' + (i + 1);
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      nav.append(a);
    }
    (meta || h1).after(nav);
    let on = null;
    const mark = () => {  // the last heading that passed the top third of the screen
      const cur = heads.filter(h => h.getBoundingClientRect().top < innerHeight / 3).pop();
      if (cur === on) return;
      on = cur;
      for (const a of nav.children) a.classList.toggle('on', !!cur && a.hash === '#' + cur.id);
      nav.querySelector('.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    };
    addEventListener('scroll', mark, { passive: true });
    mark();
  }

  // steps you can tick off while you do them
  $$('main ol').filter(before).forEach(ol => {
    const lis = $$(':scope > li', ol);
    const prog = document.createElement('p');
    prog.className = 'prog';
    prog.setAttribute('aria-live', 'polite');
    const show = () => {
      const d = lis.filter(li => li.classList.contains('done')).length;
      prog.textContent = d === lis.length ? 'כל הצעדים ✓ מה יצא לכם?'
        : d ? `סימנתם ${d} מתוך ${lis.length} צעדים` : `${lis.length} צעדים · סמנו כל צעד שעשיתם`;
    };
    lis.forEach((li, i) => {
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.setAttribute('aria-label', `עשיתי את צעד ${i + 1}`);
      box.onchange = () => { li.classList.toggle('done', box.checked); show(); };
      li.prepend(box);
    });
    ol.classList.add('steps');
    ol.after(prog);
    show();
  });

  // one tap: copy the request and open the app it was written for
  const apps = [['Claude', 'https://claude.ai/new'], ['Gemini', 'https://gemini.google.com/app'], ['Gamma', 'https://gamma.app/']];
  const desc = document.querySelector('meta[name="description"]')?.content || '';
  const pick = t => apps.find(([n]) => t.includes(n));
  const app = /Notebook|Vids/.test(title + desc) ? null : pick(title) || pick(desc);
  if (app) $$('.copy[data-t]').forEach(b => {
    if (/^\s*(https?:|[\w.-]+\.(com|ai|google)\/)/.test(document.getElementById(b.dataset.t)?.innerText || 'http:')) return;  // a link, not a request
    const a = document.createElement('a');
    a.className = 'go';
    a.href = app[1];
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = `העתקה ופתיחה ב-${app[0]} ↗`;
    a.onclick = () => { navigator.clipboard?.writeText(document.getElementById(b.dataset.t).innerText).catch(() => {}); };
    b.after(a);
  });

  // the end: send it to a friend, and where the next one comes from
  const end = document.createElement('div');
  end.className = 'end';
  end.innerHTML = '<b>עזר לכם?</b><button type="button" class="share">שלחו את המדריך למישהו שזה יעזור לו</button>'
    + '<a class="ig" href="https://www.instagram.com/promptime.il/" target="_blank" rel="noopener">'
    + 'עוד טריק כזה כל ערב באינסטגרם: <span dir="ltr">@promptime.il</span></a>';
  more.before(end);
  const share = end.querySelector('.share');
  share.onclick = async () => {
    if (navigator.share) { try { await navigator.share({ title, url: location.href }); } catch {} return; }
    try { await navigator.clipboard.writeText(location.href); share.textContent = 'הקישור הועתק ✓ עכשיו הדביקו אותו בהודעה'; }
    catch { share.textContent = location.href; }
  };
})();
