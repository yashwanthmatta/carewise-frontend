# Comprehensive health platform: status

Started 17 Nov 2026, from the owner's directive to grow FollowThrough Health from report explanations into a health platform: lab testing with partner labs, clinician-reviewed results, biomarker tracking and follow-up.

**Statuses:**
- **CODE COMPLETE:** built.
- **TESTED WITH SYNTHETIC DATA:** automated tests pass on made-up data.
- **PARTNER INTEGRATED:** connected to a real lab partner.
- **CLINICALLY APPROVED:** reviewed by a qualified clinician.
- **PRODUCTION ENABLED:** live for real people.
- **BLOCKED:** waiting on something outside the code; the reason is named.

Nothing below is PARTNER INTEGRATED, CLINICALLY APPROVED or PRODUCTION ENABLED. Nothing is launched. Anything that exists only in code or as a demo is labelled that way.

## Tracker

| Area | Status | Where | What it needs next |
|---|---|---|---|
| Lab testing page (website) | CODE COMPLETE, TESTED WITH SYNTHETIC DATA | `lab-testing.html` (frontend #167) | It says "Planned · not available yet". No prices, no locations, no partner names, every test marked Planned. `lab-testing.mjs` checks all of this |
| Test catalog | CODE COMPLETE, TESTED WITH SYNTHETIC DATA | backend `app/services/lab_testing/catalog.py` (backend #60); the same draft is in `lab-testing.js` | A real partner's catalog: tests, panel contents, specimen, preparation, price, turnaround. **BLOCKED:** no lab partner |
| Partner onboarding and location model | CODE COMPLETE, TESTED WITH SYNTHETIC DATA | backend `partners.py` | A location is bookable only with a signed, verified partner. The admin portal and tables need the owner-approved migration. **BLOCKED:** migration approval, a partner |
| Location search | CODE COMPLETE (honest empty state), TESTED | `lab-testing.html` "Find testing near you" | Shows no locations. It offers a consented email through the existing early-access list. A map needs an approved provider. **BLOCKED:** a partner and a map provider |
| Eligibility rules | CODE COMPLETE, TESTED WITH SYNTHETIC DATA | backend `eligibility.py` | Denied by default. Real rules need legal review for each state (direct access, clinician order, licensing). **BLOCKED:** legal review |
| Ordering | CODE COMPLETE (state machine), TESTED WITH SYNTHETIC DATA | backend `orders.py` | Payment never approves an order, and only the assigned licensed clinician decides. Nothing is sent to a lab while `LIVE` is False. **BLOCKED:** an ordering clinician arrangement, a partner, legal review |
| Appointments | CODE COMPLETE (adapter interface, synthetic partner) | backend `partners.py`, `orders.py` | A booking counts only when the partner confirms it. Real times need a partner. **BLOCKED:** a partner |
| Payments for lab tests | Not started, on purpose | | No lab-test payments until a partner, prices and owner approval. The existing Stripe plans are unchanged |
| Result import | CODE COMPLETE, TESTED WITH SYNTHETIC DATA | backend `results.py` | Strict matching on patient and order. Every revision is kept. HL7/FHIR parsing depends on the partner's format. **BLOCKED:** a partner, a BAA and a security review |
| Clinician review | CODE COMPLETE, TESTED WITH SYNTHETIC DATA | backend `review.py` | AI drafts are never shown as reviewed. Signing needs a credential, a licence in the patient's state and access to the patient. **BLOCKED:** a contracted clinician service |
| Clinician notes page (patient) | CODE COMPLETE as a labelled example, TESTED | `lab-results-example.html` (frontend #168) | It has made-up results only, marked in the banner, on the signed summary and in the footer. The signed summary is visibly apart from the AI explanation, and a corrected result shows its first value. The real page waits for the clinician service. **BLOCKED:** a contracted clinician service |
| Critical results | Not built, on purpose | backend `docs/lab-testing-architecture.md` | Must be agreed with the lab and the clinical partner. App messages and the AI chat are never the only channel. **BLOCKED:** a partner |
| Biomarker dashboard | CODE COMPLETE, TESTED | frontend #167: the results summary, area counts and earlier-reading dots | Uses saved reports only, from the same person. No health score, no "improving" judgement |
| Follow-up plans | Partly existing | Reminders, doctor questions | Clinician-authored plans wait for the clinician service |
| AI Health Guide | Existing. Online answers BLOCKED | Help chat, backend #59 | **BLOCKED:** the Anthropic key in Render is rejected (E-001). It may name what a medicine is (owner-approved), never doses |
| Website redesign | In progress | Homepage, app screens, share, info and legal pages restyled (13–17 Nov) | Next: a homepage section for lab testing (clearly planned), a comparison and an FAQ in the same style |
| Mobile apps | Not started for lab testing | | Waits on mobile #52. Lab screens will sit behind the same not-live flag |
| Security | Existing controls; the new data needs review | backend `docs/SECURITY-REVIEW.md` | Lab data needs BAAs, partner API authentication, webhook signing and an independent review before any real data. Never claim HIPAA compliance from code alone |
| Legal approvals | Not started | | Lab ordering law per state, clinician scope, privacy policy updates, partner contracts. **Owner and counsel** |
| Partner agreements | None | `docs/lab-partnership-program.md` | Outreach is drafted. Nothing is sent without the owner |

## Capability comparison with Function Health

Function Health's facts come from its public pages, read on 17 Nov 2026: home, how it works, what we test, pricing and FAQ. They are what the pages state, not checked independently. This is a planning aid, not a claim of parity.

| Capability | Function Health (public pages) | FollowThrough today | Classification |
|---|---|---|---|
| Comprehensive lab testing | "160+ lab tests" a year; 100+ biomarkers at the first visit | None. People upload their own reports | NEW FEATURE TO BUILD · REQUIRES A LAB PARTNER |
| Lab locations | Quest, "2,000+ locations"; 48 states, not Rhode Island, Hawai'i or Puerto Rico | None | REQUIRES A LAB PARTNER |
| At-home collection | Home or office draws in select areas | None | REQUIRES A LAB PARTNER (mobile phlebotomy) |
| Appointment scheduling | Booked in the app | None (synthetic adapter only) | REQUIRES A LAB PARTNER |
| Clinician-reviewed results and notes | "Clinicians review every result"; clinician notes | DocBridge pilot (synthetic only); review code in backend #60 | PARTIALLY IMPLEMENTED · REQUIRES A LICENSED CLINICIAN |
| Critical result calls | A provider calls right away | None | REQUIRES A LICENSED CLINICIAN · REQUIRES A LAB PARTNER |
| Personalised action plan | Yes | Doctor questions and reminders; no clinician plan | PARTIALLY IMPLEMENTED · REQUIRES A LICENSED CLINICIAN |
| Biomarker tracking over time | Yes, retesting every 3–6 months | Yes, from saved reports; trends, earlier-reading dots | EXISTING IN FOLLOWTHROUGH |
| Health categories | 20+ categories, including cancer detection, toxins and biological age | Grouped by body area on each report | EXISTING (fewer categories). Cancer detection and biological age are not appropriate without clinical validation |
| AI explanations and chat | "Private AI Chat" | Plain-language explanations of every result; help chat | EXISTING (chat online answers blocked by E-001) |
| Medical education | Yes | Glossary, test explanations, FAQ | EXISTING |
| Membership | $365 a year (stated) | Free, Plus and Family plans exist; no lab tests | REQUIRES OWNER APPROVAL (no prices changed) |
| Family accounts | +$340 a year per adult (stated) | Reports kept per family member; Family plan | PARTIALLY IMPLEMENTED |
| Mobile app | Referred to as "the app" | Expo app in progress | PARTIALLY IMPLEMENTED |
| Report sharing | PDF download to share with a provider | Doctor brief, time-limited doctor link | EXISTING IN FOLLOWTHROUGH |
| Imaging (MRI, CT) | Members-only pricing | Explains written scan reports only | Not planned. REQUIRES OWNER APPROVAL |
| HSA/FSA | Stated as eligible | No | REQUIRES REGULATORY OR LEGAL REVIEW |
| Upload outside reports | Not described on these pages | Core feature: free, read on the device | FollowThrough strength |
| Physician-ordering arrangement | Not stated in the page text | None | REQUIRES A LICENSED CLINICIAN · REQUIRES REGULATORY OR LEGAL REVIEW |

## Next steps, in order

1. **Owner:**
   - set the Anthropic key in Render;
   - merge frontend #167 and backend #60;
   - choose two or three local labs to approach. The pack is in `docs/lab-partnership-program.md`.
2. ~~**Claude:** a patient "clinician notes" page with synthetic data.~~ Done 17 Nov as a labelled example (`lab-results-example.html`).
3. **Claude:** a homepage section for lab testing (clearly planned), plus the comparison and the FAQ in the reference style.
4. **Owner:** approve the first lab-testing tables (a production migration) once a partner pilot is agreed.
5. **Owner and counsel:**
   - legal review for the first launch state;
   - an ordering clinician arrangement;
   - BAAs;
   - privacy policy updates.
