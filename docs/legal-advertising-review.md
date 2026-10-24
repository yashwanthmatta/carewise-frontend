# FollowThrough Health: legal and advertising risk register

**Not legal advice.** Written by the legal and advertising review agent, which is not a lawyer.
It is a checklist to discuss with qualified counsel, a licensed clinician and the account owners.
Nothing here declares any approval or compliance. No legal, clinical, regulatory, vendor or
platform approval has been given for anything below.

| | |
|---|---|
| Review date | 2026-10-23 |
| Website code reviewed | `carewise-frontend` main at `8d6e756` (PR #106) |
| App code reviewed | `carewise-mobile-app` main at `a1a0ce3` (PR #44) |
| API code reviewed | `carewise-production-backend` main at `07f9aa2` (PR #43) |
| Rules versions | Frozen clinical-review candidate `2026-10-20.2` (tag present, unchanged); live `2026-10-20.5` (`EXPLANATION_RULES_VERSION` in `script.js`) |
| Live site | **Not reachable from the review environment** (network policy). The repo's own production monitor reports the live site matches `main` (`docs/PROJECT-STATUS.md`, 2026-10-23 01:15 UTC). Findings are from source, not a live crawl. |
| Not reviewed | Render, Stripe, Twilio and Cloudflare dashboards; environment variables; vendor contracts; real emails sent; app store consoles |

Status key: **BLOCK** = potentially unsafe, materially misleading or unsupported; fix or pull before
promoting. **REVIEW** = needs clinical, legal or compliance confirmation. **ACCEPTABLE WITH
EVIDENCE** = matches verified code or documents; keep the evidence on file.

---

## 1. Top 10 findings

| # | ID | Status | Finding |
|---|---|---|---|
| 1 | LA-01 | BLOCK | Plus ($7) and Family ($12) are sold for features every free account already gets. Plan enforcement is off. |
| 2 | LA-02 | BLOCK | The security page says "health details" are field-encrypted. Saved result summaries, lab-trend values and care-plan content are not. |
| 3 | LA-03 | BLOCK | Subscription checkout has no explicit renewal consent or terms link. The Terms still say billing "must be confirmed". Deleting an account does not cancel billing. |
| 4 | LA-04 | REVIEW | Patient-facing urgency labels ("contact your doctor today", "Nothing urgent stands out") may be a device function under FDA's January 2026 CDS and general wellness guidance. |
| 5 | LA-05 | Fixed in this PR | DocBridge called its drafts "AI drafts", but they are rule-based and made on the device. |
| 6 | LA-06 | Partly fixed | DocBridge public copy allowed "de-identified" labs, but the owner's onboarding guide says synthetic only. Marketing copy is fixed here; legal pages are pending counsel. |
| 7 | LA-07 | BLOCK (for store submission) | The app store listing and privacy answers contradict the product ("Upload a health report", server-side AI explanations). The support URL is the deletion page. |
| 8 | LA-08 | REVIEW | Reminder calls: the prerecorded message gives no callback number, consent is attested by the caregiver, and the message says "time for your medicine" to whoever answers. |
| 9 | LA-09 | REVIEW | "Your edits can improve future drafts" (DocBridge stores every original/edited pair) next to "never used to train AI models". |
| 10 | LA-10 | REVIEW | No privacy or security contact channel. No Washington consumer health data policy link. Draft-sounding policy text. "It is not a medical device". |

---

## 2. Risk register

Owner key: **Founder** (product and account owner), **Counsel** (healthcare/privacy attorney),
**Clinician** (licensed clinical reviewer), **Eng** (engineering agent), **Vendor**.

| ID | Category | Severity | Source location | Description | Guidance | Evidence | Proposed correction | Owner | Review status | Remaining approvals |
|---|---|---|---|---|---|---|---|---|---|---|
| LA-01 | Subscriptions / FTC | High | `index.html` pricing (`#pricing`, `#billing-title`); `faq.html` "What does it cost?" | Plus lists "Personal plan from your results, Reminders, Trends over the years". Those are free to every account, because `entitlement_enforcement` is off. Charging for what is free is a deception risk. | FTC Act §5; ROSCA (15 U.S.C. §8403); state auto-renewal laws | Backend `app/services/entitlements.py` ("Nothing is locked until the owner turns on entitlement_enforcement"); `docs/PROJECT-STATUS.md` blocker 3 note | Until plan contents are decided and enforced: hide "Choose Plus/Family", or relabel them "Supporter plan: same features, helps fund FollowThrough Health". Owner decides; pricing is not changed by this agent. | Founder | Open | Counsel on wording; Founder on plan contents |
| LA-02 | Privacy representation | High | `legal/security.html` "Encryption" line | The page says "Report text, health details, shared summaries and DocBridge lab data are encrypted in the database with a separate field key." `ReportAnalysis.summary_json`, `LabTrend.value` and care-plan content are plain database fields (disk-encrypted by Render only). | FTC Act §5 (privacy and security misrepresentation); FTC HBNR | Backend `app/models/carewise.py` (no `encrypted_` field on ReportAnalysis or LabTrend value); `docs/SECURITY-REVIEW.md` M1 | Proposed text (pending counsel, §6): "Saved report files and text, health profile details, medicines, reminders, shared summaries and DocBridge lab data are encrypted with a separate field key. Saved result summaries and trend values are protected by our host's disk encryption; adding our own field encryption is planned." Or finish the M1 migration first. | Counsel, Eng | Open, legal-page change pending counsel | Counsel; Security reviewer for M1 |
| LA-03 | Subscriptions | High | Backend `app/api/routes/subscriptions.py` checkout payload; `legal/terms.html` "Subscriptions"; `legal/data-deletion.html` | Stripe Checkout is created with `mode=subscription` and no `consent_collection[terms_of_service]` or renewal `custom_text`. The Terms still say billing "must be confirmed before public launch". There is no refund policy. Deleting an account "does not cancel a store or card subscription by itself". | ROSCA; California Automatic Renewal Law (Bus. & Prof. Code §17600 et seq., amended effective July 1, 2025); FTC click-to-cancel rule vacated (8th Cir., July 8, 2025), so ROSCA and state laws govern | Code read 2026-10-23 | Before live charges: Terms subscription section and refund policy (counsel); Stripe `consent_collection` with a terms link; renewal text beside the button (site copy already says "renew automatically every month"); confirmation email with how to cancel; cancel the Stripe subscription automatically when an account is deleted (engineering). | Counsel, Eng, Founder | Partly fixed: renewal notice at checkout in backend branch `claude/agent-legal`; consent box, Terms, refund policy and cancel-on-delete open | Counsel; Founder (Stripe account admin) |
| LA-04 | FDA / clinical | High | `script.js` urgency rules (frozen); app `App.tsx:95-104`, `src/helpAnswers.ts`, `src/doctorShare.ts` | The product classifies urgency for patients and caregivers, and can say "Nothing urgent stands out. Keep this for your next checkup." Patient-facing software usually can't use the CDS exclusion, which assumes a healthcare professional reviews the basis. Reassurance wording carries false-negative risk. | FDA "Clinical Decision Support Software" final guidance (Jan 2026, docket FDA-2017-D-6569); "General Wellness: Policy for Low Risk Devices" (Jan 6, 2026); FD&C Act §520(o)(1)(E) | `docs/compliance-readiness.md` §1 flags the same question | **Do not change frozen rules in an ad review.** Ask counsel whether the intended-use statement plus the current urgency behavior is a device function. Ask the clinician whether "Nothing urgent stands out" is acceptable wording. Marketing must not lead with urgency triage until then (see the ad library). | Counsel, Clinician | Open | FDA regulatory counsel; Clinician |
| LA-05 | AI claims | Medium | `index.html` DocBridge list and editor; `docbridge.js` status messages | Called the DocBridge draft an "AI draft", but drafts come from `analyzeReportTextLocally` (rules, on the device; `model_version: docbridge-rules-v1`). Mislabelling rules as AI misstates the method and confuses AI-disclosure duties. | FTC Act §5 (Operation AI Comply, Sept 2024: no AI exemption from deception law) | `docbridge.js` `DRAFT_VERSION` and draft code paths | **Fixed in this PR:** "AI draft" → "automatic draft" (7 strings). The demo video (`assets/video/doctor-demo.*`) still shows the old label; re-record it. | Eng, Founder | Fixed (copy); video open | None for copy |
| LA-06 | HIPAA / pilot | High | `index.html` DocBridge (landing fine print, pilot note, email intake, checkbox, Q&A setting); `faq.html`; `docbridge.js`; `legal/privacy.html:53`; `legal/security.html:44` | Public copy allowed "de-identified or sample labs". `docs/pilot-clinic-onboarding.md` says synthetic labs only, and the Lab date field takes a full date (a Safe Harbor identifier). A clinic acting on the site copy could send real, poorly de-identified PHI before any BAA exists. | HIPAA Privacy Rule de-identification, 45 CFR 164.514(b); business associate rules, 45 CFR 164.502(e), 164.504(e) | Owner's onboarding guide lines 6–13; `index.html` `db-lab-date` is `type="date"` | **Fixed in this PR (marketing and UI copy):** "synthetic sample labs only". **Pending counsel:** the same change in `legal/privacy.html` and `legal/security.html` (§6). Engineering, at BAA stage: year-only lab date, header redaction for PDFs. | Counsel, Eng | Partly fixed | Counsel for legal pages |
| LA-07 | App store | High (blocks submission) | `carewise-mobile-app/src/storeListingDraft.md`, `src/storePrivacyAnswersDraft.md`, `legal/app-store-disclosures.html` | The listing says "Upload a health report" and "wellness suggestions". The privacy answers say an "AI provider may process report text/files server-side to generate simple explanations". Explanations are actually rule-based on the device, and AI is used only for the help chat. Help-chat questions (Anthropic) and reminder phone numbers (Twilio) are missing. The support URL is the deletion page. "Care plan" and "patient app" keywords overstate scope. | Apple App Review Guidelines 1.4.1, 2.3, 5.1.1(i), 5.1.3; Google Play Health Content and Services, Health apps declaration, Data safety | Files read 2026-10-23; Apple guidelines read directly 2026-10-23 | Replacement text in §5.4, applied to the mobile drafts in mobile branch `claude/agent-legal` (pending counsel). | Eng, Founder, Counsel | Drafts fixed in mobile PR; pending counsel | Counsel; Founder (store accounts) |
| LA-08 | TCPA / reminders | Medium | Backend `app/services/reminder_calls.py` scripts; `index.html` reminder consent box | Prerecorded calls identify FollowThrough Health but give no callback number. Consent is ticked by the caregiver for the called person; the first call asks for consent but is itself prerecorded. "It is time for your medicine" reveals health information to whoever answers. Call times use the caregiver's browser time zone (`reminders.js`). | TCPA 47 U.S.C. §227(b); 47 CFR 64.1200(a)(1), (b)(1)–(2); FCC revocation rule 64.1200(a)(10) (10 business days; "revoke-all" part waived to Jan 31, 2027, DA 26-12) | Code read 2026-10-23 | Add a callback number to every script (engineering; the number must be staffed or answered). Ask counsel about caregiver-attested consent and the consent call. Optional script: "It is time for your reminder." Let the caregiver set the called person's time zone. | Counsel, Eng | Partly fixed: callback line in backend branch `claude/agent-legal` (said when `CAREWISE_REMINDER_CALLBACK_NUMBER` is set); time zone picker in website and mobile `claude/agent-legal` branches (2026-10-24); consent questions open | Counsel; Founder sets the number |
| LA-09 | Data use / BAA | Medium | `index.html` DocBridge editor note "so your edits can improve future drafts"; backend `app/services/draft_edits.py` | Every clinician save or approve stores the original and edited text pair. With real PHI, using it to improve drafts needs BAA terms permitting it, and may conflict with "health information is never used to train AI models" if a model is ever trained on it. | HIPAA BA permitted uses, 45 CFR 164.504(e)(2); FTC §5 | Code read | Keep the pilot synthetic. Before BAAs: counsel defines product-improvement rights in the BAA and decides whether this note stays. Pending counsel, so not changed here. | Counsel, Founder | Open | Counsel |
| LA-10 | Privacy / state law | Medium | `legal/privacy.html` (whole), `legal/security.html` "Report a security concern", `legal/disclaimer.html:19`, `legal/terms.html` | No email or form for privacy, security or deletion requests (only the feedback box). No Consumer Health Data Privacy Policy linked from the homepage. Draft language ("is designed to store", "should be reviewed by qualified professionals before public healthcare use", "MVP"). "It is not a medical device" is a legal conclusion. Terms use "continued use means acceptance" and have no refund, age or liability terms. | Washington My Health My Data Act (RCW 19.373; homepage link to consumer health data privacy policy, consent for collection and sharing, private right of action); Nevada SB 370; Connecticut CTDPA health-data consent; California CMIA (Civ. Code §56.10, §56.06); FTC HBNR | Pages read 2026-10-23 | Counsel drafts a consumer health data policy, Terms and a refund policy. Founder sets up privacy@ and security@ addresses. Proposed disclaimer line: "not intended to diagnose, treat, cure or prevent any disease" (pending counsel). | Counsel, Founder | Open | Counsel |
| LA-11 | Messaging / PHI | Low now, High at BAA stage | `index.html` DocBridge "Send in one tap. Email, WhatsApp or text the private link" | Fine with synthetic data. With real patients, sending result links over consumer messaging needs the clinic's own HIPAA analysis (patient preference, minimum necessary). | HIPAA Privacy Rule 45 CFR 164.522(b), 164.530(c) | Copy read | Keep it. At BAA stage, add guidance for clinics; counsel reviews. | Counsel | Open (deferred) | Counsel |
| LA-12 | Claim | Low | `index.html` DocBridge "Draft in seconds" | Time claim. Drafts are produced locally by rules right after text extraction. | FTC substantiation | `docbridge.js` local path | ACCEPTABLE WITH EVIDENCE: keep a timing measurement (median and 95th percentile on the sample labs). | Eng | Evidence needed | None |
| LA-13 | Privacy claim | Medium | `index.html` hero and upload ("Read on this device. Nothing is uploaded."), `safety.html`, `legal/security.html` | Verified: OCR runs on the device (Tesseract, `script.js`). Server OCR (OpenAI) runs only for photos saved to an account, which the copy already covers ("unless you save it"). | FTC §5; HBNR | `script.js` Tesseract loader; `docs/compliance-readiness.md` data-flow table | ACCEPTABLE WITH EVIDENCE. Any change that sends report content off the device must update this copy first. | Eng | Accepted with evidence | None |
| LA-14 | Privacy claim | Medium | `index.html` "We never sell your data or use it for ads."; privacy "No Training, No Selling" | Verified: no third-party scripts, pixels or SDKs in the website or app; usage events are named counters only (`product/events` increments a daily count; no user ID or IP stored in the counter). One ad pixel would break this claim and could be an HBNR "breach". | FTC §5; HBNR 16 CFR 318 (unauthorized disclosure is a breach); WA MHMDA "sell" and "share" | Frontend grep for external `<script src>` (none); app `package.json` (no analytics SDK); backend `app/api/routes/product.py` | ACCEPTABLE WITH EVIDENCE. Keep the claims check and a "no pixels" rule (ad library §2). | Founder, Eng | Accepted with evidence | Vendor terms (LA-16) |
| LA-15 | Security / disclosure | Medium | Backend `app/services/telemetry.py` | If `CAREWISE_OTEL_EXPORTER_OTLP_ENDPOINT` is set, request traces (paths, client IPs) go to an undisclosed processor over `insecure=True` (unencrypted gRPC). `render.yaml` sets it empty; the dashboard value can't be verified here. | FTC §5; HBNR | Code read | Founder confirms the variable is empty. If tracing is ever wanted: TLS exporter, scrub IPs and paths, list the vendor in the privacy policy. | Founder, Eng | Unverified | None |
| LA-16 | Vendor | High | `legal/privacy.html` "Anthropic may keep them for a limited time under its own data terms"; "No Training" claim | There are no written AI-provider retention or no-training terms on file. | FTC §5; BAA prerequisites | `docs/PROJECT-STATUS.md` blocker 5 | Founder saves Anthropic's commercial terms and retention setting with the date checked. Same for OpenAI, Twilio, Stripe, AWS, Cloudflare and Render. | Founder | Open | Vendor |
| LA-17 | Claim | Low | `index.html` pricing ("Explain any lab or scan report") | Absolute coverage claim; the reader supports a set list of tests. | FTC substantiation | Supported list in `faq.html` | **Fixed in this PR:** "Explain common lab and scan reports" (3 places). | Eng | Fixed | None |
| LA-18 | Claim | Low | `index.html` feature row ("Every result compared with the range on the report.") | Results with no printed range are compared with a common guide, so "every … the range on the report" is not always true. | FTC substantiation | `docs/compliance-readiness.md` §5 | **Fixed in this PR:** "Each result compared with the range your lab printed, when it prints one." | Eng | Fixed | None |
| LA-19 | Claim | Low | `index.html` record eyebrow ("Lifetime health record") | Implies data kept forever; the record is saved on the device. | FTC §5 | — | **Fixed in this PR:** "Long-term health record". | Eng | Fixed | None |
| LA-20 | Spanish | Medium | Site-wide Spanish; `safety.html` says "The Spanish wording is a draft" | Spanish ads would promote wording that hasn't been reviewed. | FTC §5 applies in any language | `safety.html`, `faq.html` | Hold Spanish ads until a qualified medical translator and the clinician review them (ad library marks them REVIEW). | Clinician, Founder | Open | Clinician; translator |
| LA-21 | Security posture | High | Infrastructure | The production database accepts connections from any address (`0.0.0.0/0`). This undercuts the security page's general assurances and raises breach-notification exposure. | FTC §5 (reasonable security); HBNR | `docs/PROJECT-STATUS.md` blocker 2 | Founder restricts database access. No marketing of "secure" claims until done. | Founder | Open | Account admin |
| LA-22 | Accessibility | Low | `accessibility.html`; DocBridge demo video | The statement is honest (WCAG 2.1 AA goal, no independent audit yet). The demo video has no text description or captions file. | ADA Title III (courts split on websites); ACA §1557 rule for clinics receiving federal funds (WCAG 2.1 AA; deadlines in 2026–2027) | Page read | Add a short text transcript under the video. Run an independent audit before selling DocBridge to clinics that take Medicare or Medicaid. | Eng, Founder | Open | None |
| LA-23 | Email | Low | Early-access and doctor-waitlist sign-ups | No marketing-email sender found in code. Any future campaign needs an unsubscribe link and a postal address. | CAN-SPAM Act, 15 U.S.C. §7704 | Backend `email_delivery.py` sends account emails only | Add to the campaign checklist (ad library §2). | Founder | Open (future) | None |

---

## 3. Verified defects (code or documents prove the statement is inaccurate)

- **LA-01** Paid plans unlock nothing (`entitlements.py`).
- **LA-02** The security page overstates field encryption (`models/carewise.py`, SECURITY-REVIEW M1).
- **LA-05** "AI draft" for rule-based drafts. Fixed in this PR.
- **LA-06** Public DocBridge copy vs the synthetic-only onboarding rule. Marketing copy fixed in this PR; legal pages pending counsel.
- **LA-07** The store listing and privacy answers contradict product behavior.
- **LA-08** No callback number in prerecorded reminder calls.
- **Security page vendor table** lists Render, Anthropic, Stripe, Twilio and GitHub, but not AWS S3, OpenAI, Cloudflare or the email provider, which the privacy policy names. Proposed rows are in §6, pending counsel.

## 4. Potential compliance risks (need interpretation)

LA-03, LA-04, LA-09, LA-10, LA-11, LA-15, LA-16, LA-20, LA-21, LA-22, LA-23.

## 5. Questions, approvals and replacement text

### 5.1 Legal questions for counsel

1. **FDA:** Under the January 2026 CDS and general wellness guidance, is patient-facing labelling of results as outside the printed range, plus "contact your doctor today" for critical values, a device function? Does the draft intended-use statement (`docs/compliance-readiness.md` §1) keep it out? Can the disclaimer say "not a medical device"?
2. **FTC HBNR:** Are we a vendor of personal health records (account record, reports, trends, reminders)? Confirm the breach plan: individuals within 60 calendar days, the FTC, and the media at 500+ residents of a state.
3. **Paid plans (LA-01):** May we keep selling Plus and Family while nothing is gated, if relabelled as a supporter plan? What wording?
4. **Auto-renewal (LA-03):** What checkout consent, confirmation email and refund terms are needed for ROSCA and California's ARL? Must account deletion cancel billing?
5. **TCPA (LA-08):** Is caregiver-attested consent plus a press-1 confirmation call enough for prerecorded calls to a cell phone? Is the first call allowed? Is a callback number required in every call?
6. **HIPAA:** When does DocBridge make us a business associate? Review the BAA template, including product-improvement rights for stored draft edits (LA-09). Which vendors need downstream BAAs?
7. **State health-data laws:** Do Washington's MHMDA and Nevada's SB 370 apply? Draft the consumer health data policy and consent flow. Does California's CMIA treat us as a provider of health care?
8. **Privacy representations (LA-02, LA-13, LA-14):** Approve the corrected security-page text.
9. **AI disclosure:** Do California AB 3030 or other state AI laws apply to the consumer help chat or DocBridge patient Q&A (AI answers not read by a clinician before sending)?
10. **Advertising:** Approve the claim list in `docs/advertising-library.md` §1, and the proof required for each.
11. **Influencers and referrals:** Approve the disclosure language, and say whether referral rewards are allowed for a health product.
12. **Trademark:** Is "FollowThrough Health" and "DocBridge" clear to use and register? (A USPTO Law School Clinic Certification Program clinic can help.)

### 5.2 Advertising policy questions (platform account admins)

1. **Meta:** Will a caregiver ad ("for families helping a parent with lab results") pass the Personal Attributes policy? It must not say "your mother's kidney results". Check before spending.
2. **Google Ads:** Healthcare and medicines policy, and the "Health in personalized advertising" policy. Confirm that no remarketing or Customer Match is used; contextual and keyword targeting only.
3. **TikTok:** Check the North America Healthcare and Pharmaceuticals entry rules for a lab-explanation app (not a medical institution), plus 18+ targeting.
4. **LinkedIn:** LinkedIn may restrict any health ad. Confirm whether DocBridge evaluation ads to clinicians need review.
5. **Apple Search Ads:** Only after App Store approval; metadata must match the corrected listing.

### 5.3 Items for clinician review (none are changed by this agent)

1. "Nothing urgent stands out. Keep this for your next checkup." (app `App.tsx:98`, `helpAnswers.ts:26`, `doctorShare.ts:11`): is this acceptable reassurance?
2. The urgency tiers and the "possible danger level" thresholds (the frozen `.2` pack and the `.3`–`.5` changes).
3. The Spanish explanation wording.
4. Food and activity suggestions from lab values (for example, people with kidney disease and potassium).
5. Every clinical statement used in ads (ad library "Clinician approval" column).

### 5.4 Proposed replacement text for the app store drafts (pending counsel)

- **Subtitle:** "Lab reports explained in plain words"
- **Short description:** "Read a lab report in plain words, see results outside your lab's range, and bring questions to your doctor."
- **Full description, first paragraph:** "FollowThrough Health explains blood test reports and the written part of scan reports in plain words. Add a PDF, a photo or the numbers. The report is read on your phone. Each result is compared with the range your lab printed, and you get questions to ask your doctor and a one-page doctor brief. It is for education. It does not diagnose, name medicines or doses, or replace your doctor. In an emergency, call 911."
- **Remove:** "Upload a health report", "wellness suggestions", "care plan", "patient app".
- **Support URL:** `https://followthroughhealth.com/support.html`
- **Privacy answers:** remove "AI provider may process report text/files server-side to generate simple explanations". Add: help-chat questions sent to Anthropic when the person uses chat (not stored by us); reminder phone numbers and first names shared with Twilio; photo text sent to OpenAI only for photos saved to an account, if server OCR is on.

## 6. Proposed legal-page edits (pending counsel approval, not applied)

These change published legal commitments, so they are not in the PR.

- **`legal/security.html` Encryption:** replace with the LA-02 text.
- **`legal/security.html` services table:** add these rows.
  - **AWS S3:** stores report files people save to their account. Sees encrypted files.
  - **OpenAI:** reads photo text only for photos saved to an account, when server photo reading is on. Sees that photo.
  - **Cloudflare:** runs the web address and receives DocBridge clinic intake emails. Sees web traffic and clinic intake emails.
  - **Email provider:** sends sign-in, password and reminder emails. Sees email addresses and email text, never medicine names.
- **`legal/privacy.html:53` and `legal/security.html:44`:** "de-identified or sample labs" → "synthetic sample labs only".
- **`legal/privacy.html:61`:** "is designed to store" → "stores".
- **`legal/privacy.html:63`:** delete "should be reviewed by qualified professionals before public healthcare use".
- **`legal/privacy.html` and `legal/security.html`:** add a privacy and security contact email.
- **`legal/disclaimer.html:19`:** "It is not a medical device" → "It is not intended to diagnose, treat, cure or prevent any disease."
- **`legal/security.html` Notify step:** name the deadline: "no later than 60 calendar days after we discover a breach, and we notify the FTC as the Health Breach Notification Rule requires."

## 7. Human approvals needed

| Approval | Who | For |
|---|---|---|
| Legal | Healthcare and privacy attorney | LA-02, 03, 04, 06 (legal pages), 08, 09, 10, 11; §5.1; §6; ad claim list |
| FDA regulatory | Regulatory counsel or consultant | LA-04; intended use; app store medical category |
| Clinical | Licensed clinician | §5.3; every clinical line in ads; Spanish |
| Vendor | Anthropic, OpenAI, Twilio, AWS, Cloudflare, Render, Stripe | LA-16; BAAs at DocBridge stage |
| Account admin | Founder | Stripe consent settings, Render database access (LA-21), OTEL variable (LA-15), app store consoles, ad accounts |
| Business | Founder | LA-01 plan contents and pricing |

## 8. Sources (checked 2026-10-23)

Apple's guidelines page was read directly. ftc.gov, fda.gov, transparency.meta.com and
support.google.com could not be opened from the review environment, so those points come from
search results that cite the official page. Confirm against the official page before relying on them.

- FDA, Clinical Decision Support Software (final, Jan 2026): https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- FDA, General Wellness: Policy for Low Risk Devices (Jan 6, 2026): https://www.fda.gov/regulatory-information/search-fda-guidance-documents/general-wellness-policy-low-risk-devices
- FTC, Health Breach Notification Rule (16 CFR Part 318) and business guidance: https://www.ftc.gov/legal-library/browse/rules/health-breach-notification-rule
- FTC, Consumer Reviews and Testimonials Rule (16 CFR Part 465, effective Oct 21, 2024): https://www.ftc.gov/system/files/ftc_gov/pdf/r311003consumerreviewstestimonialsfinalrulefrn.pdf
- FTC, Endorsement Guides (16 CFR Part 255): https://www.ftc.gov/legal-library/browse/rules/guides-concerning-use-endorsements-testimonials-advertising
- FTC, Health Products Compliance Guidance (2022): https://www.ftc.gov/business-guidance/resources/health-products-compliance-guidance
- Eighth Circuit vacatur of the click-to-cancel rule, Custom Communications v. FTC, No. 24-3137 (July 8, 2025): summary at https://www.fenwick.com/insights/publications/eighth-circuit-vacates-ftcs-click-to-cancel-rule
- HHS, HIPAA de-identification guidance: https://www.hhs.gov/hipaa/for-professionals/special-topics/de-identification/index.html
- FCC, TCPA rules 47 CFR 64.1200: https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-64/subpart-L/section-64.1200 ; revocation waiver order DA 26-12 (Jan 6, 2026): https://docs.fcc.gov/public/attachments/DA-26-12A1.pdf
- Washington AG, My Health My Data Act FAQ: https://www.atg.wa.gov/washington-my-health-my-data-act
- Apple App Review Guidelines (1.4.1, 2.3, 3.1.2, 5.1.1, 5.1.3), read directly: https://developer.apple.com/app-store/review/guidelines/
- Google Play, Health Content and Services policy: https://support.google.com/googleplay/android-developer/answer/16679511 ; Health apps declaration: https://support.google.com/googleplay/android-developer/answer/14738291
- Google Ads, Health in personalized advertising: https://support.google.com/adspolicy/answer/16701855 ; Healthcare and medicines: https://support.google.com/adspolicy/answer/176031
- Meta, Personal Attributes (Privacy Violations and Personal Attributes): https://transparency.meta.com/policies/ad-standards/objectionable-content/privacy-violations-personal-attributes/ ; Health and Wellness: https://transparency.meta.com/policies/ad-standards/restricted-goods-services/health-wellness
- TikTok, Healthcare and Pharmaceuticals ad policy: https://ads.tiktok.com/help/article/tiktok-ads-policy-healthcare-pharmaceuticals ; North America handbook: https://ads.tiktok.com/help/article/ad-policy-handbook-north-america
- LinkedIn Advertising Policies: https://www.linkedin.com/legal/ads-policy

## 9. Continuous review procedure

At the start of each authorized session: fetch all three repos; diff public copy and new
dependencies since the commit in the header; run `node scripts/claims_audit.mjs`; re-check the
platform policy pages above for upcoming campaigns; update this register (status, evidence, date).

**There is no continuous monitoring today.** The claims check runs in CI on every push and pull
request (`frontend-ci.yml`). For ongoing checks, the owner can add a scheduled job: a weekly
`claims_audit.mjs` run, plus a monthly reminder to re-read the platform policies. Until one is
deployed, nothing watches policy changes automatically.
