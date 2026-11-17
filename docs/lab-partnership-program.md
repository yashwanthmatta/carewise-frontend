# Lab partnership program

A pack for approaching local and regional labs. **Status: draft.** No lab has been contacted, and no agreement exists. Nothing in this pack is sent without the owner's approval, and no lab is named as a partner until it has signed.

## FollowThrough Health in one paragraph

FollowThrough Health helps people and family caregivers understand lab reports. Every result is explained in plain words, next to the lab's own range, with questions to take to the doctor and a one-page brief. Today people upload reports they already have. We want to work with labs so that people can order tests, visit a lab, and get results with a summary signed by a licensed clinician and a plain-language explanation.

## What a partner lab gets
- New patients who arrive already prepared: they know what the test is for and how to get ready.
- Fewer "what does this mean?" calls. People get their results explained, with questions for their own doctor.
- Results reach the patient through a channel that keeps every value, unit, range and any later correction exactly as the lab reported them.
- A simple start: manual onboarding first, then an API.

## Proposed booking workflow
1. The person chooses a test on FollowThrough Health. They see the lab's own description, preparation instructions and price.
2. **Eligibility:** our rules check that the test and ordering pathway are allowed in their state, under the actual arrangement. Requests are denied unless a rule allows them.
3. **Clinician order:** for tests that need one, a licensed clinician reviews the request and approves, declines or asks for more information. Paying never approves a test.
4. **Payment:** taken only after approval.
5. **Booking:** we request a slot from the lab. It counts only when the lab confirms it, and the person gets the lab's booking reference.
6. **Visit:** the person visits the lab with the order.

## Proposed order and result integration
- **Orders:** sent to the lab by the method the lab supports: manual at first (secure portal or fax, if the lab requires it), then an API or HL7 v2 / FHIR.
- **Results:** returned by the lab's supported method.
  - We match each result to the order and the patient using the lab, the order id and the lab's patient reference. A mismatch is refused, never guessed.
  - Every revision is kept: a corrected result never overwrites the original.
- **Critical results:** handled by a process agreed in advance between the lab, the ordering clinician and us. It covers who calls, within what time, the coverage, the acknowledgement and the fallback. An app message is never the only way a person hears.

## Patient privacy
- Only the information needed to carry out the test is shared, with the person's consent.
- Health data is encrypted when stored. Access is limited to the patient, their authorised clinician and named staff. Access is audited.
- We expect to sign a BAA or equivalent where required, and we complete a security review before any real data flows.

## Responsibilities (to agree)

| | Lab | Ordering clinician (service) | FollowThrough Health |
|---|---|---|---|
| Test menu, specimen, preparation, price | ✓ | | Shows it as the lab gives it |
| Clinical order decision | | ✓ | Routes requests and keeps the audit trail |
| Collection and testing | ✓ | | |
| Result delivery | ✓ | | Imports and keeps provenance |
| Result review and signed summary | | ✓ | Shows the signed summary apart from AI text |
| Critical results | ✓ (notify) | ✓ (contact the patient) | Follows the agreed process; never the only channel |
| Patient support (app) | | | ✓ |

## Commercial models (for negotiation, nothing agreed)
- **Lab's list price:** the lab sets the price and we add a disclosed service fee.
- **Negotiated per-test prices:** with a monthly settlement.
- **Referral only:** the person pays the lab directly, and we provide the explanation and the follow-up.

## Technical integration checklist
- [ ] Partner identifiers, locations, hours and collection types, verified by a named person
- [ ] Test catalog import, with codes, specimens, preparation, turnaround and price
- [ ] Order submission method and test environment
- [ ] Appointment availability and booking confirmation
- [ ] Result delivery format (HL7 v2, FHIR or API) and a test feed with synthetic patients
- [ ] Amendments and corrections
- [ ] Authentication, webhook signing and an IP allow-list
- [ ] Support contacts and escalation path
- [ ] Critical-result process signed off

## Contracting and legal checklist (owner and counsel)
- [ ] The lab's CLIA certificate and state licences
- [ ] Direct-access testing and clinician-order rules in each launch state
- [ ] Ordering clinician contract, licensing and scope
- [ ] BAA or data-processing agreement
- [ ] Privacy policy and consent updates
- [ ] Pricing, refunds and cancellations
- [ ] Insurance and liability

## Outreach email (template, not sent)

> Subject: Explaining lab results for your patients — FollowThrough Health
>
> Hello [name],
>
> I'm [owner name], founder of FollowThrough Health. We help people and family caregivers understand their lab reports: every result in plain words, next to your lab's own range, with questions to take to their doctor.
>
> We are looking for one or two local labs to pilot test ordering with us. People would book through FollowThrough, a licensed clinician would review each order, and results would come back with a clinician-signed summary and our plain-language explanation. We would keep every value and correction exactly as you report it.
>
> Would you have 20 minutes in the next few weeks to see a short demo, built on made-up data, and tell us what would work for your lab?
>
> Thank you,
> [owner name]
> FollowThrough Health · followthroughhealth.com

## Demo for partners
- The Lab Testing page shows the planned flow and catalog: `lab-testing.html`.
- The results screen shows what a patient sees: grouped by body area, with counts and earlier readings, on made-up data. The "Try a sample report" button opens it.
- The backend's synthetic order flow, from eligibility to clinician decision to payment to a confirmed booking to results with revisions to a signed review, is in `carewise-production-backend/tests/api/test_lab_testing.py`.
