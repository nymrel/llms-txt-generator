# Security policy

## Supported version

Security fixes target the current `main` branch. This source repository does not itself prove what is deployed at nymrel.com.

## Reporting a vulnerability

Email `contact@nymrel.com` with the affected path, reproduction steps, impact, and any suggested mitigation. Please do not open a public issue for an unpatched vulnerability or include real customer site maps, checkout data, or credentials in a report.

## Security boundary

llms.txt Generator assembles and validates site-map text in the browser. Entered values are saved automatically in browser local storage so a draft survives reloads. Product values must not be attached to analytics or other network requests. The hosted page also loads aggregate Vercel Web Analytics.

The Pro kit includes both raw Organization JSON-LD and an HTML script-block artifact. Literal `<` characters are escaped only in the HTML artifact as `\u003c`, preserving parsed JSON values while preventing user-controlled text from terminating the enclosing script block early.

Checkout verification and paid artifact delivery are separate server-backed boundaries. Verification must fail closed when its verifier is unavailable.

There is no public bug-bounty promise. We will acknowledge actionable reports and coordinate remediation proportionate to the issue.
