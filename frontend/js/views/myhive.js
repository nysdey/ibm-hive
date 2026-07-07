/**
 * myhive.js — My Hive: personal network
 *
 * Coming soon — placeholder view.
 */

export async function renderMyHive(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;flex:1;min-height:0;background:#000">
      <div style="padding:32px 40px 20px;border-bottom:1px solid rgba(255,255,255,0.07);flex-shrink:0">
        <div style="font-size:22px;font-weight:300;color:#f4f4f4;letter-spacing:-0.2px;margin-bottom:6px">My Hive</div>
        <div style="font-size:13px;color:#525252">Your personal network — people you work with, learn from, and stay connected to.</div>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;color:#2a2a2a;font-size:14px">
        Coming soon
      </div>
    </div>
  `;
}
