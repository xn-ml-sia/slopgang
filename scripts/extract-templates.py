#!/usr/bin/env python3
"""Extract Mal's four reference pages into src/templates/*.{html,css} + public/tpl/ assets.
Usage: python3 scripts/extract-templates.py <ref1> <ref2> <ref3> <ref4>
The reference files are not committed. Output contains {{token}} slots filled from src/data/pages/*.ts.
"""
import base64, hashlib, html, re, sys, urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_T = ROOT / 'src' / 'templates'; OUT_T.mkdir(parents=True, exist_ok=True)
OUT_A = ROOT / 'public' / 'tpl'; OUT_A.mkdir(parents=True, exist_ok=True)
EXT = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg',
       'font/woff2': 'woff2', 'font/woff': 'woff', 'application/font-woff2': 'woff2'}
DATA = re.compile(r'data:([a-z]+/[a-z0-9.+-]+)((?:;[a-z0-9=-]+)*?)(;base64)?,([^"\')\s>]+)', re.I)

def save(m):
    mime, b64, payload = m.group(1).lower(), m.group(3), m.group(4)
    if mime not in EXT:
        return m.group(0)
    raw = base64.b64decode(payload + '=' * (-len(payload) % 4)) if b64 else urllib.parse.unquote(payload).encode()
    name = hashlib.sha1(raw).hexdigest()[:12] + '.' + EXT[mime]
    (OUT_A / name).write_bytes(raw)
    return '/tpl/' + name

LINKS = {
    '#/': '/', '#/work': '/', '#/lab': '/', '#/about': '/about', '#/notes': '/strange-fruit',
    '#/contact': '{{join_href}}', '#/work/murmur': '/project/ikebana', '#/work/atlas': '/project/glitch-the-system',
}

def flap(text, extra_cls='', step=''):
    parts = []
    for i, ch in enumerate(text):
        c = '&nbsp;' if ch == ' ' else html.escape(ch)
        parts.append(f'<span aria-hidden=true style=--i:{i}><span>{c}</span><span>{c}</span></span>')
    return ''.join(parts)

def common(body):
    body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<noscript.*?</noscript>', '', body, flags=re.S)
    def link(m):
        h = m.group(1)
        return 'href=' + ('"' + LINKS[h] + '"' if h in LINKS else ('"/about#' + h.split('#')[2] + '"' if h.startswith('#/about#') else h))
    body = re.sub(r'href=(#/[^\s>]*)', link, body)
    # brand: header label + aria-labels + footer wordmark
    body = body.replace('aria-label="Noa Lindgren, home"', 'aria-label="slopgang, home"')
    body = re.sub(r'(<span class="kit-flap \[--step:calc\(var\(--stagger\)\*6\)\]" style=--n:)12><span class=sr-only>Noa Lindgren</span>.*?(</span></a>)',
                  lambda m: m.group(1) + '8><span class=sr-only>slopgang</span>' + flap('slopgang') + m.group(2), body, count=1, flags=re.S)
    body = body.replace('</svg>Noa Lindgren</span>', '</svg>{{brand}}</span>', 1)
    return body

def kit_rise_title(body, title_attr_id, token):
    # replace an h1/h2 split-word title by a single token word block
    pat = re.compile(r'(<h1 id=' + title_attr_id + r'[^>]*>)(.*?)(</h1>)', re.S)
    return pat.sub(lambda m: m.group(1) + '<span class=sr-only>{{' + token + '}}</span><span aria-hidden=true class=kit-rise-w><span style=--i:0>{{' + token + '}}</span></span>' + m.group(3), body, count=1)

def home(body):
    body = kit_rise_title(body, 'top-title', 'hero_title')
    body = body.replace('Small tools from between projects. Each one started as a question I could not answer by looking at a static frame. They all work; take them apart.', '{{hero_lead}}', 1)
    cards = ['dither', 'easing', 'scale', 'grid', 'departures', 'moire']
    for i, slug in enumerate(cards[:4], 1):
        a = body.find(f'href=#/lab/{slug} class="kit-hover group')
        assert a > 0, slug
        end = body.find('</a>', a)
        seg = body[a:end]
        seg = seg.replace(f'href=#/lab/{slug}', f'href="{{{{card{i}_href}}}}"', 1)
        seg = re.sub(r'(<span class="kit-draw t-heading">)[^<]*(</span>)', r'\1{{card%d_title}}\2' % i, seg, count=1)
        seg = re.sub(r'(<span class="t-body text-\[color:var\(--ink-2\)\]">)[^<]*(</span>)$', r'\1{{card%d_summary}}\2' % i, seg + '', count=1) if seg.endswith('</span>') else seg
        if i == 1:  # Strange Fruit keeps a plate image as its thumbnail
            seg = re.sub(r'(group-hover:border-\[var\(--ink\)\]">)(.*)(</div><span class="flex items-baseline)',
                         lambda m: m.group(1) + '{{card1_visual}}' + m.group(3), seg, count=1, flags=re.S)
        body = body[:a] + seg + body[end:]
    return body

def case(body):
    body = kit_rise_title(body, 'case-title', 'title')
    body = re.sub(r'(<p class="max-w-\[40ch\] t-lead">)[^<]*(</p>)', r'\1{{summary}}\2', body, count=1)
    return body

def build(src, name, fn):
    s = Path(src).read_text()
    css = []
    for attrs, txt in re.findall(r'<style([^>]*)>(.*?)</style>', s, flags=re.S):
        if 'text/tailwindcss' in attrs:
            continue  # not applied by browsers; the saved page renders without it
        css.append(txt)
    css = DATA.sub(save, '\n'.join(css))
    css = 'body{margin:0}\n' + css
    body = re.search(r'<body[^>]*>(.*?)(?:</body>|$)', s, flags=re.S).group(1)
    body = DATA.sub(save, body)
    body = fn(common(body)).replace('<div id=root>', '<div class=tpl-root>', 1)
    head = '<!-- PLACEHOLDER: template content from Mal\'s reference page. {{tokens}} come from src/data/pages. -->\n'
    (OUT_T / f'{name}.html').write_text(head + body)
    (OUT_T / f'{name}.css').write_text('/* PLACEHOLDER: template styles from Mal\'s reference page. */\n' + css)
    print(name, len(body), 'tokens', sorted(set(re.findall(r'\{\{(\w+)\}\}', body))))

r1, r2, r3, r4 = sys.argv[1:5]
build(r1, 'home', home)
build(r2, 'case-ios', case)
build(r3, 'case-web', case)
build(r4, 'about', lambda b: b)
