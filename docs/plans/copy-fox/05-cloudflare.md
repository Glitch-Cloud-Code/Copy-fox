# Cloudflare hosting

GOAL: Give Copy-fox a hosted address without the user's name or ChatGPT branding.
IN SCOPE: Upload the existing static site to Cloudflare Pages, verify the deployment, and update hosting documentation.
OUT OF SCOPE: Application changes, custom domains, automatic GitHub deployments, and removal of the previous Site.
DONE WHEN: The new Pages address serves the current app and its assets, the fox renders, controls work, and the repository documents the address and update process.
CONSTRAINTS: Use the free Pages service and preserve the current app and previous deployment. Do not store credentials in source.
EVIDENCE: Cloudflare deployment confirmation, live browser checks, served asset comparison, and documentation diff.

ARCHITECTURE: Direct Upload serves the existing dist directory. No build or runtime service is required.
DESIGN: Preserve the interface. Verify the displayed fox and a style change at the new address.
CODING: Package dist with index.html at the archive root. Change only hosting documentation.
MANAGEMENT: Accept after the new address and live app have evidence.
CONVERGENCE: Use a direct static upload. Updates require another upload. Keep GitHub as the public source repository.

## Completion review

ARCHITECT: ACCEPT. All 20 served files return HTTP 200 and match local SHA-256 hashes. No application or dependency changes.
DESIGNER: ACCEPT. The live fox renders, rotation changes the frame, Reset restores the view, and Blocks displays the protected output. A full-page browser screenshot records the result.
CODER: ACCEPT. Static checks pass. Cloudflare confirms deployment success at https://copy-fox.pages.dev. The ZIP contains all 20 files with index.html at the root.
MANAGER: ACCEPT. The new address omits the user's name and ChatGPT branding. Live checks and documentation cover every acceptance criterion.

Evidence: ignored test-results/cloudflare-assets.json and test-results/cloudflare-live.jpg. Cloudflare was deployed from application revision 67e3b58ba89edc94293c5ba94c71224f9217069b. Subsequent documentation changes do not affect the deployed dist files.

Production deployment: 2a3842e2-5cf2-414d-bc69-049c9980b986. Cloudflare also provides the immutable deployment address https://2a3842e2.copy-fox.pages.dev.

Deferred: automatic GitHub deployment and actual Android/Telegram client validation remain outside this hosting change.
