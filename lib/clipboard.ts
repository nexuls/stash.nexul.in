/**
 * Clipboard writes that work outside a secure context.
 *
 * `navigator.clipboard` is only defined in a secure context, so a dev server
 * reached over a LAN address (`http://192.168.x.x:3000`) exposes no Clipboard
 * API at all and the call throws. A permissions policy can also deny the API on
 * an origin that does have it. The selection-based path keeps copying working in
 * both cases.
 *
 * Returns whether the text actually reached the clipboard, so a caller can show
 * a failure rather than appear to do nothing.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Denied by permissions policy; fall through to the selection path.
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    // Kept in the viewport but invisible: a textarea scrolled out of view is
    // not selectable in every browser.
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}
