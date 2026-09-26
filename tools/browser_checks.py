#!/usr/bin/env python3
"""
Browser checks for StrayBachao, run in a real browser through Playwright.

  1. crawl     every page a visitor, a volunteer, a supporter and the admin can
               reach: nothing blank, no console errors, no failed requests
  2. contrast  every piece of text on those pages, light and dark, against WCAG AA
  3. phone     no page scrolls sideways at 390 px
  4. bangla    the language switch, then 1 to 3 again with the site in Bangla
  5. shots     screenshots of the main pages, desktop and phone

Run it against a freshly seeded database, with the API on :4000 and the
frontend on :5175:

  cd backend && npm run seed && npm run dev
  cd frontend && npm run dev -- --port 5175
  python tools/browser_checks.py

It uses the Edge that ships with Windows; set SB_BROWSER=chrome for Chrome.
Needs: pip install playwright
"""
import os, re, sys
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright

BASE    = os.environ.get("SB_BASE", "http://localhost:5175")
CHANNEL = os.environ.get("SB_BROWSER", "msedge")
OUT     = os.environ.get("SB_OUT", os.path.join(os.path.dirname(__file__), "out"))

PASS, FAIL = [], []


def check(name, ok, extra=""):
    (PASS if ok else FAIL).append(name)
    print(("  ok   " if ok else "  FAIL ") + name + ("  -> " + str(extra) if extra and not ok else ""))


def sign_in(context, email, password):
    page = context.new_page()
    page.goto(BASE + "/login")
    page.fill("#loginEmail", email)
    page.fill("#loginPassword", password)
    page.press("#loginPassword", "Enter")
    page.wait_for_url(lambda u: not u.endswith("/login"))
    page.close()


def settle(page):
    page.wait_for_load_state("networkidle")
    # skeletons are swapped for content once the API answers
    page.wait_for_timeout(250)


# ------------------------------------------------------------------ crawl

SKIP = re.compile(r"^mailto:|^https?://(?!localhost)|#")


def crawl(context, start, limit=60):
    """Follows every same-site link from start. Returns {path: errors}."""
    page = context.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("requestfailed", lambda r: errors.append("failed " + r.url))
    seen, queue, result, per_shape = set(), [start], {}, {}
    while queue and len(result) < limit:
        url = queue.pop(0)
        if url in seen:
            continue
        seen.add(url)
        # ten volunteer profiles are one page as far as the crawl is concerned
        shape = re.sub(r"/[0-9a-f]{24}|/SP-\d+", "/:id", urlparse(url).path)
        per_shape[shape] = per_shape.get(shape, 0) + 1
        if per_shape[shape] > 2:
            continue
        errors.clear()
        page.goto(url)
        settle(page)
        text = page.inner_text("main") if page.query_selector("main") else ""
        if len(text.strip()) < 40:
            errors.append("almost nothing on the page")
        result[url] = list(errors)
        for href in page.eval_on_selector_all("a[href]", "els => els.map(a => a.getAttribute('href'))"):
            if not href or SKIP.search(href) or href.startswith("/admin"):
                continue
            full = urljoin(url, href)
            if urlparse(full).netloc == urlparse(BASE).netloc and full not in seen:
                queue.append(full)
    page.close()
    return result


# --------------------------------------------------------------- contrast

CONTRAST_JS = r"""
() => {
  const parse = c => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    return {r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1};
  };
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = c => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (top, under) => ({r: top.r * top.a + under.r * (1 - top.a),
                                 g: top.g * top.a + under.g * (1 - top.a),
                                 b: top.b * top.a + under.b * (1 - top.a), a: 1});
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

  // every background this element could be sitting on; a gradient gives one per stop
  const backgrounds = el => {
    let stack = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage.includes('gradient')) {
        // a see-through stop (a glow laid over the card) is painted on top of
        // the solid stops underneath it, so test it mixed with each of them
        const stops = [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m => parse(m[0]));
        const solid = stops.filter(s => s.a >= 1), glass = stops.filter(s => s.a < 1);
        const under = solid.length ? solid : [{r: 255, g: 255, b: 255, a: 1}];
        const all = under.concat(...glass.map(g => under.map(u => over(g, u))));
        return all.map(s => stack.reduceRight((acc, layer) => over(layer, acc), s));
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a >= 1) break;
      }
    }
    let base = {r: 255, g: 255, b: 255, a: 1};
    if (!stack.length || stack[stack.length - 1].a < 1) stack.push(base);
    return [stack.reduceRight((acc, layer) => acc ? over(layer, acc) : layer, null)];
  };

  const bad = [];
  let checked = 0;
  for (const el of document.querySelectorAll('body *')) {
    const text = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!text) continue;
    const cs = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || box.width === 0 || box.height === 0) continue;
    if (el.closest('[aria-hidden="true"], .sr-only, [hidden], option, script, style')) continue;
    if (el.closest('button:disabled, input:disabled')) continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10);
    const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
    for (const bg of backgrounds(el)) {
      const r = ratio(fg.a < 1 ? over(fg, bg) : fg, bg);
      checked++;
      if (r < need) {
        bad.push({text: text.slice(0, 40), ratio: Math.round(r * 100) / 100, need,
                  cls: (el.className && el.className.baseVal === undefined ? el.className : '') || el.tagName});
        break;
      }
    }
  }
  return {checked, bad};
}
"""

def contrast(context, urls, theme):
    page = context.new_page()
    page.emulate_media(reduced_motion="reduce")
    page.add_init_script("try { localStorage.setItem('theme', '%s') } catch (e) {}" % theme)
    failures, total = [], 0
    for url in urls:
        page.goto(url)
        settle(page)
        res = page.evaluate(CONTRAST_JS)
        total += res["checked"]
        for b in res["bad"]:
            failures.append((urlparse(url).path, b))
    page.close()
    return total, failures


def too_wide(context, urls):
    page = context.new_page()
    page.set_viewport_size({"width": 390, "height": 844})
    wide = {}
    for url in urls:
        page.goto(url)
        settle(page)
        w = page.evaluate("document.documentElement.scrollWidth")
        if w > 390:
            culprit = page.evaluate("""() => [...document.querySelectorAll('body *')]
              .filter(e => e.getBoundingClientRect().right > 391)
              .slice(-1).map(e => e.tagName + '.' + String(e.className).slice(0, 60))[0]""")
            wide[urlparse(url).path] = (w, culprit)
    page.close()
    return wide


ADMIN_PAGES = ["/admindashboard", "/adminproducts", "/adminorders", "/adminvolunteers", "/adminrevenue"]


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel=CHANNEL)

        print("\n=== crawl ===")
        visitor = browser.new_context()
        volunteer = browser.new_context()
        sign_in(volunteer, "nabila@straybachao.com", "Volunteer@123")
        supporter = browser.new_context()
        sign_in(supporter, "mehedi@straybachao.com", "Donor@1234")
        admin = browser.new_context()
        sign_in(admin, "admin@straybachao.com", "Admin@1234")

        crawled = {
            "visitor": crawl(visitor, BASE + "/"),
            "volunteer": crawl(volunteer, BASE + "/"),
            "supporter": crawl(supporter, BASE + "/"),
            "admin": {},
        }
        page = admin.new_page()
        errs = []
        page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errs.append(str(e)))
        for path in ADMIN_PAGES:
            errs.clear()
            page.goto(BASE + path)
            settle(page)
            crawled["admin"][BASE + path] = list(errs)
        page.close()

        for who, pages in crawled.items():
            noisy = {urlparse(u).path: e for u, e in pages.items() if e}
            check("%s: %d pages load without errors" % (who, len(pages)), pages and not noisy, noisy)

        page = visitor.new_page()
        page.goto(BASE + "/admindashboard")
        settle(page)
        check("a visitor asking for the admin panel is sent to sign in", page.url.endswith("/login"), page.url)
        page.goto(BASE + "/no-such-page")
        settle(page)
        check("an unknown address shows the not found page", "trail goes cold" in page.inner_text("main"))
        page.close()

        print("\n=== contrast, WCAG AA ===")
        groups = [(visitor, list(crawled["visitor"])), (volunteer, list(crawled["volunteer"])),
                  (supporter, list(crawled["supporter"])), (admin, list(crawled["admin"]))]
        visitor_login = [BASE + "/login"]
        for theme in ("light", "dark"):
            total, fails = 0, []
            for ctx, urls in groups + [(visitor, visitor_login)]:
                t, f = contrast(ctx, urls, theme)
                total += t
                fails += f
            check("%s theme: %d text checks all pass AA" % (theme, total), not fails, fails[:12])

        print("\n=== 390 px ===")
        for who, ctx in (("visitor", visitor), ("volunteer", volunteer), ("supporter", supporter), ("admin", admin)):
            wide = too_wide(ctx, list(crawled[who]) + ([BASE + "/login"] if who == "visitor" else []))
            check("%s: no page scrolls sideways at 390 px" % who, not wide, wide)

        print("\n=== বাংলা ===")
        page = visitor.new_page()
        page.goto(BASE + "/")
        settle(page)
        page.click("button[aria-label='বাংলায় দেখুন']")
        page.wait_for_timeout(200)
        check("the language button switches the page to Bangla",
              page.evaluate("document.documentElement.lang") == "bn" and "একটু যত্ন" in page.inner_text("h1"))
        page.evaluate("localStorage.setItem('lang', 'en')")
        page.close()

        for who, email, password in (("visitor", None, None), ("volunteer", "nabila@straybachao.com", "Volunteer@123")):
            ctx = browser.new_context()
            ctx.add_init_script("try { localStorage.setItem('lang', 'bn') } catch (e) {}")
            if email:
                sign_in(ctx, email, password)
            pages = crawl(ctx, BASE + "/")
            noisy = {urlparse(u).path: e for u, e in pages.items() if e}
            check("Bangla, %s: %d pages load without errors" % (who, len(pages)), pages and not noisy, noisy)
            for theme in ("light", "dark"):
                total, fails = contrast(ctx, list(pages), theme)
                check("Bangla, %s, %s theme: %d text checks pass AA" % (who, theme, total), not fails, fails[:8])
            wide = too_wide(ctx, list(pages))
            check("Bangla, %s: no page scrolls sideways at 390 px" % who, not wide, wide)
            ctx.close()

        print("\n=== screenshots ===")
        shots = [("landing", visitor, "/"), ("login", visitor, "/login"), ("desk", volunteer, "/"),
                 ("rescues", volunteer, "/rescues"), ("teams", volunteer, "/teams"), ("shop", supporter, "/products"),
                 ("volunteer-profile", supporter, "/volunteers"), ("admin", admin, "/admindashboard")]
        for name, ctx, path in shots:
            for label, size in (("desktop", {"width": 1366, "height": 860}), ("phone", {"width": 390, "height": 844})):
                page = ctx.new_page()
                page.set_viewport_size(size)
                page.emulate_media(reduced_motion="reduce")
                page.add_init_script("try { localStorage.setItem('theme', 'light') } catch (e) {}")
                page.goto(BASE + path)
                settle(page)
                page.screenshot(path=os.path.join(OUT, "%s-%s.png" % (name, label)), full_page=(label == "desktop" and name == "landing"))
                page.close()
        check("screenshots written to " + OUT, True)

        browser.close()

    print("\n%d passed, %d failed" % (len(PASS), len(FAIL)))
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
