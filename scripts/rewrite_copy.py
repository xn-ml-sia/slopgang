"""slopgang copy over the templates (imported by extract-templates.py).
Replaces the template's designer framing, Noa references, locations (Berlin), logo and footer."""
import re

SPIRAL_D = open(__import__('pathlib').Path(__file__).resolve().parent.parent / 'public' / 'logo-spiral.svg').read()
_m = re.findall(r'<path[^>]*\sd="([^"]+)"', SPIRAL_D)
SPIRAL_PATH = max(_m, key=len)
SPIRAL = f'<svg aria-hidden=true width=24 height=24 viewBox="0 0 36 36" class=shrink-0><path fill=currentColor d="{SPIRAL_PATH}"></path></svg>'

FOOTER_BIO = 'slopgang is a group of creative coders in Berlin. We build things that make you feel calmer and quieter.'
TODO = 'To add (Mal)'

def words(text):
    return ' '.join(f'<span aria-hidden=true class=kit-rise-w><span style=--i:{i}>{w}</span></span>' for i, w in enumerate(text.split()))

def flap(text):
    return ''.join(f'<span aria-hidden=true style=--i:{i}><span>{c}</span><span>{c}</span></span>'
                   for i, c in enumerate(text.replace(' ', '\u00a0')))

def set_split(body, old, new):
    pat = re.escape(f'<span class=sr-only>{old}</span>') + r'(?:\s*<span aria-hidden=true class=kit-rise-w><span style=--i:\d+>[^<]*</span></span>)+'
    body, n = re.subn(pat, lambda m: f'<span class=sr-only>{new}</span>' + words(new), body)
    return body, n

def set_flap(body, old, new):
    pat = r'--n:\d+>' + re.escape(f'<span class=sr-only>{old}</span>') + r'(?:<span aria-hidden=true style=--i:\d+><span>[^<]*</span><span>[^<]*</span></span>)+'
    return re.subn(pat, lambda m: f'--n:{len(new)}><span class=sr-only>{new}</span>' + flap(new), body)

def link(href, label, arrow, external=False):
    ext = ' target=_blank rel=noreferrer' if external else ''
    return (f'<li><a href="{href}"{ext} class="kit-hover inline-flex items-center gap-[var(--s-h)] whitespace-nowrap t-body outline-none s-focus:ring-focus">'
            f'<span class=kit-draw>{label}</span>' + (f'<span class="inline-flex text-[color:var(--ink-2)]">{arrow}</span>' if arrow else '') + '</a>')

def col(title, items, arrow):
    lis = ''.join(link(h, l, arrow, h.startswith('http')) for h, l in items)
    return (f'<div class="flex min-w-0 flex-col gap-[var(--s2)]"><p class="t-caption text-[color:var(--ink-2)]">{title}'
            f'<ul class="flex flex-col gap-[var(--s1)]">{lis}</ul></div>')

def footer(body):
    f = body.find('<footer')
    if f < 0:
        return body, 0
    arrow = re.search(r'<span aria-hidden=true class=kit-slide data-dir=ne>.*?</svg></span>', body[f:], re.S).group(0)
    a = body.find('<div class="flex max-w-[40ch] flex-col gap-[var(--s3)]">', f)
    b = body.find('</nav></div>', a) + len('</nav>')
    left = ('<div class="flex max-w-[40ch] flex-col gap-[var(--s3)]">'
            f'<p class="t-lead text-[color:var(--ink-2)]">{FOOTER_BIO}</p>'
            '<div class="flex flex-col gap-[var(--s1)] t-body">'
            f'<span class=text-[color:var(--ink-2)]>Contact: {TODO}</span>'
            '<span class="tabular-nums text-[color:var(--ink-2)]">Berlin</span></div></div>')
    nav = ('<nav aria-label=Site class="grid grid-cols-2 gap-[var(--s4)]">'
           + col('Projects', [('/strange-fruit', 'Strange Fruit'), ('/project/ikebana', 'Ikebana'), ('/project/pet-cemetery', 'Pet Cemetery'), ('/project/glitch-the-system', 'Glitch the System'), ('/project/ausgang', 'Ausgang'), ('/project/100-objects', '100 Objects')], '')
           + col('More', [('/about', 'About'), ('/strange-fruit/about', 'Strange Fruit About'), ('https://x.com/slopgang2020', 'X @slopgang2020'), ('{{join_href}}', 'Join')], '')
           + '</nav>')
    body = body[:a] + left + nav + body[b:]
    body, n = re.subn(r'© 2026 Noa Lindgren · CVR 41 22 80 19 · Set in Geist Mono on an 8 px grid · <a href=#/colophon[^>]*>Colophon</a>',
                      '© 2026 slopgang · Berlin · Set in Geist Mono on an 8 px grid', body)
    return body, 1 + n

ABOUT = [
    ('I’m Noa Lindgren, a product and interaction designer in Copenhagen. I grew up in Malmö, studied interaction design at the Royal Danish Academy, and spent five years designing newsroom and archive tools before going independent in 2019.',
     'slopgang is a group of creative coders in Berlin. We are an AI GmbH, and we build apps for friends and family.'),
    ('I work as the only designer alongside a client’s engineers, usually for six to eighteen months: long enough to ship, measure and fix. I like problems where a mistake costs someone something real: money at a till, a train, a night’s sleep.',
     'We want each thing we build to make you feel calmer and quieter. Anyone can join us with their time and skills.'),
    ('Noa Lindgren, printed in ink', 'A tree, dithered to 1 bit'),
    ('>Copenhagen, Nordvest<', '>Berlin<'),
    ('>Independent since<', '>Company<'), ('>2019<', '>AI GmbH<'),
    ('>Languages<', '>Projects<'), ('>Swedish, Danish, English; Norwegian for reading<', '>Strange Fruit, Ikebana, Pet Cemetery, Glitch the System, Ausgang, 100 Objects<'),
    ('>Now<', '>Join<'), ('>Finishing ferry ticketing for Øresundslinjen. Open to new members.<', '>Bring your time and your skills. Pick a project.<'),
    ('href=#/cv', 'href="/"'), ('Curriculum vitae', 'See the projects'),
    ('Not rules: the questions I keep asking until a design answers them.', 'Not rules. These are the questions we ask about each thing we build.'),
    ('An interface should be calm when nothing is happening and exact when something is.', 'A thing should be calm when nothing happens, and clear when something does.'),
    ('>One number first<', '>One thing first<'),
    ('Find the thing people came for and put it where their eyes land. Everything else can wait a step.', 'Show the one thing people came for. The rest can wait.'),
    ('>Measure the real thing<', '>Less on the screen<'),
    ('Stopwatches on platforms, counts from the log, a phone held one-handed on a bus.', 'Remove what does not help. Then look again.'),
    ('Animate a change of state, never decoration. With motion off, nothing should be lost.', 'Animate a change, not decoration. With motion off, you lose nothing.'),
    ('>Leave it better documented<', '>Made for people we know<'),
    ('Every project ends with the system written down, so the next person does not need me.', 'We build for friends and family. That keeps each app small and personal.'),
    # history rows become our four projects
    ('>2019–now<', '>' + TODO + '<'), ('>Independent<', '>Strange Fruit<'),
    ('>Product and interaction design for banks, mapping, transport, health and culture.<', '>The plates archive. A color cloud of slop specimens.<'),
    ('>2016–2019<', '>' + TODO + '<'), ('>Polar Post<', '>Ikebana<'),
    ('>Senior product designer, then design lead for the newsroom tools.<', '>Make one ikebana concept a day.<'),
    ('>2014–2016<', '>' + TODO + '<'), ('>Arkiv<', '>Pet Cemetery<'),
    ('>Interaction designer on search for a national photographic archive.<', '>Keep memories of your pet in photos or video.<'),
    ('>2011–2014<', '>' + TODO + '<'), ('>Royal Danish Academy<', '>Glitch the System<'),
    ('>MA in Interaction Design. Thesis on interfaces for public machines.<', '>Make propaganda posters.<'),
    ('Tell me what it is and who it is for. I reply within two working days, usually with questions.', 'Pick a project and tell us what you can do.'),
    ('url(/tpl/f0f63d00c430.png)', 'url(/tpl/tree-dither.png)'),
    ('>Make propaganda posters.</span></ol>', '>Make propaganda posters.</span>' + '<li class="grid gap-x-[var(--s3)] gap-y-[var(--s-h)] border-b-[length:var(--bw)] border-[var(--line)] border-solid py-[var(--s2)] @[720px]:grid-cols-[calc(var(--u)*16)_minmax(0,1fr)_minmax(0,1fr)] @[720px]:items-baseline"><span class="t-caption text-[color:var(--ink-2)]">To add (Mal)</span><span class=t-heading>Ausgang</span><span class="t-body text-[color:var(--ink-2)]">Talk to Buddha and get advice on your day.</span>' + '<li class="grid gap-x-[var(--s3)] gap-y-[var(--s-h)] border-b-[length:var(--bw)] border-[var(--line)] border-solid py-[var(--s2)] @[720px]:grid-cols-[calc(var(--u)*16)_minmax(0,1fr)_minmax(0,1fr)] @[720px]:items-baseline"><span class="t-caption text-[color:var(--ink-2)]">To add (Mal)</span><span class=t-heading>100 Objects</span><span class="t-body text-[color:var(--ink-2)]">Track the things that you own.</span>' + '</ol>'),
]
ABOUT_SPLIT = [('Speaking and teaching', 'Speaker'),
               ('I make complicated things feel calm.', 'We build calm, quiet things.'),
               ('Twelve years, briefly', 'Six projects, briefly'),
               ('Have something that should feel like an instrument?', 'Do you want to build quiet things with us?')]

CASE = [('I should have tested with eyes closed from the start.', 'we should have tested with eyes closed from the start.'),
        ('Noa took things out', 'slopgang took things out')]

def header(body, page):
    h0 = body.find('<header'); h1 = body.find('</header>', h0)
    h = body[h0:h1]
    cls = re.search(r'<li><a href="[^"]*" class="([^"]*)"', h).group(1)
    about = f'<a href="/about" class="{cls}"' + (' aria-current=page' if page == 'about' else '') + '>About</a>'
    # no link list next to the logo; About sits at the far right, after the clock
    a = h.find('<div class="relative hidden @[1040px]:flex">'); b = h.find('</ul></div>', a) + len('</ul></div>')
    h = h[:a] + h[b:]
    c = h.find('<button type=button aria-pressed=false aria-label=Inspect'); d = h.find('</div></nav>', c)
    h = h[:c] + about + h[d:]
    return body[:h0] + h + body[h1:]

def drop_div(body, start_marker):
    a = body.find(start_marker)
    if a < 0:
        return body, 0
    i, depth = a, 0
    for m in re.finditer(r'<(/?)div\b', body[a:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            end = body.find('>', a + m.start()) + 1
            return body[:a] + body[end:], 1
    return body, 0

def cleanup(body):
    # the saved page hid the native scrollbar for its custom rail; we keep the normal scrollbar
    body = re.sub(r'<style class=sf-hidden>html,body\{scrollbar-width:none\}.*?</style>', '', body, flags=re.S)
    body, _ = drop_div(body, '<div aria-hidden=true class="fixed inset-y-0 end-0 z-50 w-[var(--s2)]')
    # no Inspect feature
    body = re.sub(r'<span class="hidden @\[720px\]:inline">Press <kbd[^>]*>I</kbd> to inspect any page</span>', '', body)
    return body

def rewrite(body, page, log):
    miss = []
    body = cleanup(body)
    # Mal: drop the client quote + credits block ("Noa took things out...") wherever it appears
    # Mal: also drop every 'In their words' quote section
    for marker in ('Noa took things out', '>In their words<'):
        while (i := body.find(marker)) > 0:
            a = body.rfind('<section', 0, i); e = body.find('</section>', i) + len('</section>')
            body = body[:a] + body[e:]
    body = header(body, page)
    # logo
    j = body.find('{{brand}}</span>')
    k = body.rfind('<svg', 0, j)
    body = body[:k] + SPIRAL + body[j:]
    body, n = footer(body); n or miss.append('footer')
    body = body.replace('Booking projects from January 2027', 'Open to new members')
    if page == 'about':
        for a, b in ABOUT:
            if a in body: body = body.replace(a, b, 1)
            else: miss.append(a[:40])
        for a, b in ABOUT_SPLIT:
            body, n = set_split(body, a, b); n or miss.append(a)
        body, n = set_flap(body, 'Start a project', 'Join a project'); n or miss.append('flap')
        body = body.replace('studio@noalindgren.dk', 'Contact: ' + TODO)
    if page.startswith('case'):
        body = re.sub(r'<section id=next aria-label="Next project".*?</section>', '', body, count=1, flags=re.S)
        body = re.sub(r'href=#/work/(northbound|kiln)', 'href="{{next_href}}"', body)
        body = body.replace('>All work<', '>All projects<')
        for a, b in CASE:
            if a in body: body = body.replace(a, b)
        body, _ = set_split(body, 'What I would keep, and change', 'What we would keep, and change')
        body = body.replace('What I would keep, and change', 'What we would keep, and change')
    body = body.replace('Copenhagen', 'Berlin')
    body = body.replace('Noa Lindgren', 'slopgang').replace('noalindgren', 'slopgang').replace('noa-lindgren', 'slopgang').replace('Noa', 'slopgang')
    log(page, 'missed:', miss)
    return drop_footer_bar(body)


def drop_footer_bar(body):
    # Mal: no copyright bar and no 'Back to top' in the footer; the bar holds only those, so drop it whole
    return re.sub(r'<div class="[^"]*"><span>© [^<]*</span><span[^>]*><button type=button[^>]*><span class=kit-draw>Back to top</span>.*?</button></span></div>(?=</div></footer>)', '', body, flags=re.S)
