// ─────────────────────────────────────────────────────────────
// scanInPage runs INSIDE the browser (via page.evaluate). It walks a
// page's interactive elements and captures a resilient locator for
// each — the seed of the "builder": point MendKit at a page and it
// drafts multi-signal locators you can drop straight into a flow.
//
// Self-contained: no imports, no closure over module scope.
// ─────────────────────────────────────────────────────────────

export interface ScannedLocator {
  css: string;
  text: string;
  role: string;
  name: string;
  testId: string;
  tag: string;
}

export function scanInPage(): ScannedLocator[] {
  const norm = (s: string | null | undefined): string =>
    (s || '').trim().replace(/\s+/g, ' ');

  const roleMap: Record<string, string> = {
    button: 'button',
    a: 'link',
    input: 'textbox',
    textarea: 'textbox',
    select: 'combobox',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
  };

  const escId = (id: string): string =>
    window.CSS && CSS.escape ? CSS.escape(id) : id;

  const accessibleName = (el: Element): string => {
    const id = el.getAttribute('id');
    const label = id
      ? document.querySelector('label[for="' + escId(id) + '"]')
      : null;
    const wrapping = el.closest('label');
    return norm(
      el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        (label ? label.textContent : '') ||
        (wrapping ? wrapping.textContent : '') ||
        el.getAttribute('name') ||
        el.getAttribute('title') ||
        '',
    );
  };

  const stablePath = (el: Element): string => {
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
      let sel = node.tagName.toLowerCase();
      const parent: Element | null = node.parentElement;
      if (parent) {
        const current = node;
        const sibs = Array.from(parent.children).filter(
          (c) => c.tagName === current.tagName,
        );
        if (sibs.length > 1) {
          sel += ':nth-of-type(' + (sibs.indexOf(current) + 1) + ')';
        }
      }
      parts.unshift(sel);
      node = node.parentElement;
    }
    return parts.join(' > ');
  };

  const visible = (el: Element): boolean => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none'
    );
  };

  const out: ScannedLocator[] = [];
  const seen = new Set<string>();
  const els = Array.from(
    document.querySelectorAll(
      'button, a[href], input:not([type="hidden"]), select, textarea, h1, h2, h3',
    ),
  );

  for (const el of els) {
    if (!visible(el)) continue;
    const tag = el.tagName.toLowerCase();
    const id = el.getAttribute('id');
    const testId = el.getAttribute('data-testid') || '';

    let css: string;
    if (id && document.querySelectorAll('#' + escId(id)).length === 1) {
      css = '#' + escId(id);
    } else if (testId) {
      css = '[data-testid="' + testId + '"]';
    } else {
      css = stablePath(el);
    }
    if (seen.has(css)) continue;
    seen.add(css);

    out.push({
      css,
      text: norm(el.textContent).slice(0, 70),
      role: roleMap[tag] || '',
      name: accessibleName(el),
      testId,
      tag,
    });
    if (out.length >= 40) break;
  }
  return out;
}
