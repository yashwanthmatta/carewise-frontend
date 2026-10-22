# Builds the plain information pages (safety, FAQ, about, support, accessibility).
# Edit the text here, run: python3 scripts/build-info-pages.py, and commit the pages.
import html, os
import pathlib
OUT=str(pathlib.Path(__file__).resolve().parent.parent)
NAV='<nav class="pg-nav" aria-label="Site"><a href="/demo.html">Try the demo</a><a href="/safety.html">Safety</a><a href="/faq.html">FAQ</a><a href="/about.html">About</a><a href="/support.html">Support</a></nav>'
FOOT='<p class="sv-foot">FollowThrough Health explains reports for education. It does not diagnose and does not replace your doctor. In an emergency, call 911 or your local emergency number.<br /><a href="/legal/privacy.html">Privacy</a> · <a href="/legal/terms.html">Terms</a> · <a href="/legal/disclaimer.html">Disclaimer</a> · <a href="/legal/data-deletion.html">Delete my data</a> · <a href="/accessibility.html">Accessibility</a></p>'
CSS='''.pg-nav { display: flex; flex-wrap: wrap; gap: 6px 14px; font-size: 0.95rem; }
      .pg-nav a { color: var(--ink); text-decoration: none; padding: 6px 0; }
      .pg-nav a:hover, .pg-nav a:focus-visible { text-decoration: underline; }
      .sv-head { flex-wrap: wrap; gap: 10px; }
      .sv-card p { margin: 0 0 10px; } .sv-card p:last-child { margin-bottom: 0; }
      .sv-card ul { margin: 0 0 10px; }
      .pg-cta { display: inline-flex; align-items: center; min-height: 44px; padding: 10px 18px; border-radius: 999px; background: var(--ink); color: #fff; text-decoration: none; font-weight: 600; }
      details.pg-q { border-top: 1px solid var(--line); padding: 12px 0; }
      details.pg-q:first-of-type { border-top: 0; }
      details.pg-q summary { cursor: pointer; font-weight: 600; min-height: 28px; }
      details.pg-q p, details.pg-q ul { margin: 8px 0 0; }'''
def page(fname, title, desc, eyebrow, h1, lede, body):
    doc=f'''<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{html.escape(title)} | FollowThrough Health</title>
    <meta name="description" content="{html.escape(desc)}" />
    <link rel="canonical" href="https://followthroughhealth.com/{fname}" />
    <link rel="icon" href="assets/carewise-app-icon.svg" />
    <link rel="stylesheet" href="share.css?v=carewise-product-190" />
    <style>
      {CSS}
    </style>
  </head>
  <body>
    <main class="sv">
      <header class="sv-head"><a class="sv-brand" href="/"><img src="assets/carewise-logo.svg" alt="" width="28" height="28" /> FollowThrough Health</a>{NAV}</header>
      <section class="sv-card sv-hero">
        <p class="sv-eyebrow">{eyebrow}</p>
        <h1>{h1}</h1>
        <p class="sv-muted">{lede}</p>
      </section>
{body}
      {FOOT}
    </main>
  </body>
</html>
'''
    open(os.path.join(OUT,fname),'w').write(doc)

def card(h2, inner): return f'      <section class="sv-card">\n        <h2>{h2}</h2>\n        {inner}\n      </section>\n'
def qa(q, a): return f'<details class="pg-q"><summary>{q}</summary>{a}</details>'

page('safety.html','Safety and trust','How FollowThrough Health keeps report explanations careful: what it does, what it never does, how it is tested, and its limits.','Safety and trust','How we keep explanations careful','FollowThrough Health helps you understand a report and get ready for your doctor. It is built to inform, never to decide for you. Here is exactly what that means.',
 card('What it does','<ul><li>Reads the numbers on your report and compares each one with the range <strong>your lab printed</strong>.</li><li>Says in plain words which results are outside that range, and how soon to ask your doctor about them.</li><li>Gives you questions to bring to the visit and a one-page doctor brief.</li></ul>')+
 card('What it never does','<ul><li>It does not diagnose, and never says a result is definitely fine or definitely serious.</li><li>It never names a medicine or a dose, and never suggests starting, stopping or changing one.</li><li>It does not look at scan images. It explains the radiologist\'s written words only.</li><li>If a report or a question mentions chest pain, trouble breathing, stroke signs, fainting, heavy bleeding or thoughts of self-harm, it tells you to call your emergency number first.</li></ul>')+
 card('How we test it','<p>We test in three separate ways, and only the last one is about clinical safety.</p><ul><li><strong>Automated checks on every change.</strong> Thousands of made-up reports in US, UK, European and Indian formats, with different units, decimal commas, tables, misread numbers and unusual layouts, plus fixed safety cases such as emergency symptoms and levels labs often treat as urgent. A change ships only if these pass.</li><li><strong>Our own test sets.</strong> Made-up reports with known answers that we use to find and fix reading mistakes.</li><li><strong>Independent clinical review: not done yet.</strong> 160 made-up cases and the rules behind them are prepared for a licensed clinician to review. Until that is finished, nothing here has been clinically validated.</li></ul><p>Passing more automated tests does not make the explanations clinically safe. It means the reader does what we designed it to do on reports like the ones we tested. Real reports can still be misread.</p>')+
 card('Its limits','<ul><li>Photos can be misread. The app shows what it read so you can check it against the original.</li><li>Ranges differ by lab, age and sex. Your doctor knows your history; the app does not.</li><li>The Spanish wording is a draft that is still being reviewed.</li><li>The explanations have not yet been reviewed by a clinical advisory board. We will say so here when they have.</li></ul>')+
 card('Your data','<p>Reports are read on your own phone or computer. Nothing is uploaded unless you save it to an account, share a doctor link, or ask the help chat. The help chat sends your question to our AI provider, Anthropic, to write the answer. Our server does not save your question or the answer; Anthropic may keep them for a limited time under its own data terms. We never sell your data or use it for ads. Read the <a href="/legal/privacy.html">privacy policy</a> or <a href="/legal/data-deletion.html">delete your data</a> at any time.</p>'))

page('faq.html','Questions and answers','Answers about FollowThrough Health: which reports it reads, cost, privacy, accuracy, family members and deleting your data.','FAQ','Questions people ask','Short answers. If yours is not here, see <a href="/support.html">Support</a>.',
 '      <section class="sv-card">\n        '+''.join([
 qa('Which reports can it read?','<p>Blood tests (blood count, sugar, cholesterol, kidney, liver, thyroid, vitamins, iron and more) and the written part of CT, MRI and X-ray reports. Add a PDF, a photo, or type the numbers. It reads US, UK, European and Indian formats and units.</p>'),
 qa('Is it a doctor or a diagnosis?','<p>No. It explains the report in plain words and helps you prepare for your doctor. It does not diagnose, treat or replace medical care.</p>'),
 qa('What does it cost?','<p>Explaining reports, the doctor brief and the health record are free. Plus is $7 a month (personal plan, reminders, trends). Family is $12 a month for up to 5 people\'s profiles in one account; sharing access with siblings and caregivers is planned but not available yet. Cancel any time.</p>'),
 qa('Do I need an account?','<p>No. Reports are explained on your device without one. Create a free account only to keep reports across devices or share a link with your doctor.</p>'),
 qa('Is my report uploaded?','<p>Not unless you choose to save or share it. See <a href="/safety.html">Safety and trust</a> for exactly what leaves your device.</p>'),
 qa('How accurate is it?','<p>We test it on thousands of made-up reports in many formats and units, including misread numbers and unusual layouts. That shows the reader works as designed on those reports; it is not a clinical study, and the independent clinical review is still to come. Real reports can still be misread, especially photos, so the app shows what it read for you to check against the original. Always talk to your doctor.</p>'),
 qa('Can I use it for my mom or dad?','<p>Yes. That is who it is built for. Choose whose report it is, keep a record for each family member, and bring the doctor brief to their visit.</p>'),
 qa('Which languages?','<p>English and Spanish. The Spanish wording is a draft still being reviewed.</p>'),
 qa('How do I delete my data?','<p>Profile, then "Delete my account". It deletes everything saved to your account straight away. <a href="/legal/data-deletion.html">Full steps</a>.</p>'),
 qa('I am a doctor. Can my clinic use it?','<p>DocBridge lets a clinician approve a plain-English explanation for each patient. It is in a pilot with sample or de-identified labs. <a href="/#for-doctors">Learn more</a>.</p>'),
 ])+'\n      </section>\n')

page('about.html','About','FollowThrough Health helps families understand a parent\'s lab report and follow through with their doctor.','About','Helping families follow through','Most people get lab results as a page of numbers, alone, days before they can ask anyone. FollowThrough Health turns that page into plain words, the right questions, and a reminder of what comes next.',
 card('Why we built it','<p>Caregivers often sit between a parent\'s doctor and a stack of reports. They need to know what matters, how soon to ask, and what to bring to the visit. We built FollowThrough Health for that moment: understand the report, know what to ask, and remember the next step.</p>')+
 card('What we believe','<ul><li><strong>Plain words.</strong> Every result explained the way you would explain it to family.</li><li><strong>Your doctor decides.</strong> We prepare you for the conversation; we never replace it.</li><li><strong>Private by default.</strong> Reports are read on your device, and we never sell data.</li><li><strong>Honest limits.</strong> We say what we test and what we have not proven yet. See <a href="/safety.html">Safety and trust</a>.</li></ul>')+
 card('Where we are','<p>FollowThrough Health is an early-stage product. The website is free to use, with phone apps on the way. We are looking for families and clinicians to help shape it.</p><p><a class="pg-cta" href="/demo.html">Try it with a sample report</a></p>'))

page('support.html','Support','Get help with FollowThrough Health: reading a report, your account, deleting data, reminders and contacting the team.','Support','How can we help?','Most things can be done in a minute yourself. If not, you can reach the team below.',
 card('Common tasks','<ul><li><strong>Try it first:</strong> the <a href="/demo.html">demo</a> walks you through a made-up report.</li><li><strong>Forgot your password:</strong> Profile, then "Log out, verify email, reset password or delete account", then "Request reset".</li><li><strong>Delete your account and data:</strong> Profile, then "Delete my account". <a href="/legal/data-deletion.html">Full steps</a>.</li><li><strong>Stop reminder calls:</strong> press 9 during a call, or edit the reminder and untick "Phone them at these times".</li><li><strong>Turn off a doctor link:</strong> Profile, then "Doctor links", then "Turn off" next to the link.</li><li><strong>Cancel a paid plan:</strong> Profile, then "Manage or cancel plan".</li></ul>')+
 card('Contact the team','<p>Use the "Was this helpful?" box under any result and add your question. Leave out names and health details. If you want a reply, add the email address on your account.</p><p>For medical questions, please ask your own doctor. In an emergency, call 911 or your local emergency number.</p>')+
 card('Privacy and complaints','<p>For privacy requests or a complaint, use the same box and start your message with "Privacy" or "Complaint". We answer privacy requests as the law requires. Read the <a href="/legal/privacy.html">privacy policy</a>.</p>'))

page('accessibility.html','Accessibility','FollowThrough Health accessibility statement: our goal, what we test, known limits and how to report a problem.','Accessibility','Accessibility statement','We want FollowThrough Health to work for everyone, including older parents and the people who help them.',
 card('Our goal','<p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA.</p>')+
 card('What we do now','<ul><li>Pages are tested on phone widths from 320 pixels up, with no sideways scrolling.</li><li>Buttons and links are large enough to tap, and forms have labels.</li><li>The guided demo works with the keyboard (arrow keys, and Esc to close).</li><li>Explanations are written in short, plain sentences, and are available in English and Spanish.</li></ul>')+
 card('Known limits','<ul><li>We have not yet had an independent accessibility audit.</li><li>Some charts and the doctor brief preview may be hard to use with a screen reader.</li></ul>')+
 card('Tell us about a problem','<p>Use the "Was this helpful?" box under any result and start your message with "Accessibility". Tell us the page and what went wrong. See <a href="/support.html">Support</a>.</p>'))
print('ok')
