// scripts/admin-badge.js

document.addEventListener('DOMContentLoaded', () => {
  if (!api.isAdmin()) return;

  const sinoEAvatar = document.querySelector('.sino-e-avatar');
  if (!sinoEAvatar) return;

  sinoEAvatar.style.width = 'auto';
  sinoEAvatar.style.gap = '14px';

  const link = document.createElement('a');
  link.href = '/paginas/admin.html';
  link.title = 'Painel Admin';
  link.style.cssText = 'display:flex;align-items:center;justify-content:center;width:28px;height:28px;text-decoration:none;flex-shrink:0;';

  const img = document.createElement('img');
  img.src = '/assets/img/admin-icon.svg';
  img.alt = 'Admin';
  img.style.cssText = 'width:24px;height:24px;filter:brightness(0) invert(1);';

  link.appendChild(img);
  sinoEAvatar.insertBefore(link, sinoEAvatar.firstChild);
});