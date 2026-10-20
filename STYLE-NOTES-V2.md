# V2 stylesheet deployment note

The screenshot reported an incomplete CSS presentation (unformatted header and navigation, no hero layout). The preview branch currently inlines the complete contents of `assets/site-v2.css` into public HTML files, so styles load together with each page even if the separate CSS asset is delayed or cached incorrectly. The **editable source of truth** remains `assets/site-v2.css`.

To update styles, after editing the CSS, refresh all the corresponding `<style data-brothers-v2="inline-fallback">...</style>` snapshots from the source file before release. This duplication is an interim reliability workaround, not the preferred long-term setup. Diagnose the asset delivery issue and switch back to a single versioned stylesheet after browser network inspection. 

Do not merge to production until desktop and mobile QA is complete.
