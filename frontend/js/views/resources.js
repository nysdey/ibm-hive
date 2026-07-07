/**
 * resources.js — Resources view stub
 * Personal go-to links, playbooks, and key contacts.
 */

export async function renderResources(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Resources</div>
      <div class="page-sub">Your go-to links, playbooks, and key contacts</div>
    </div>
    <div class="content">
      <div class="resources-empty">
        <div class="resources-empty-icon">⬡</div>
        <div class="resources-empty-title">Build your resource hive</div>
        <div class="resources-empty-sub">Add links, playbooks, and contacts that matter to your work.</div>
        <button class="btn-primary" style="margin-top:20px">+ Add resource</button>
      </div>
    </div>
  `;
}
