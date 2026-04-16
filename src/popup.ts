import { AgroEcologyProject, POINT_CATEGORIES } from './types';

export function createPopupContent(project: AgroEcologyProject): string {
  const cat = POINT_CATEGORIES[project.category];
  const categoryBadge = `<span class="category-badge" style="background:${cat.color};color:${cat.textColor}">${cat.label}</span>`;

  const trainingTypeLabel: Record<string, string> = {
    S: 'Short (<7 days)',
    I: 'Intermediate (1 wk–6 mo)',
    L: 'Long (>6 mo)',
  };
  const trainingTypeDisplay = project.trainingType
    ? project.trainingType.split(' ').map(t => trainingTypeLabel[t] ?? t).join(', ')
    : '—';

  const attributes: [string, boolean, string?][] = [
    ['High on-farm diversity',          project.highOnFarmDiversity,          'Combination of high crop diversity and 60% or more intercropped'],
    ['Mixed farming',                   project.mixedFarming,                 'All of poultry, animals, crops and trees'],
    ['Seed bank (individual)',          project.seedBankIndividual],
    ['Seed bank (collective)',          project.seedBankCollective],
    ['Organised seed exchange',         project.organisedSeedExchange],
    ['Integrated landscape management', project.integratedLandscapeManagement, 'Combination of on-farm natural spaces and involvement in community landscape management'],
  ];

  const activeAttributes = attributes.filter(([, v]) => v).map(([label, , desc]) =>
    desc ? `${label}<span class="attr-info" data-tooltip="${desc}">ℹ</span>` : label
  );

  const services = [
    ['Input supply',           project.gsInputSupply],
    ['Mentorship/tech support', project.gsMentorshipTechSupport],
    ['Marketing services',     project.gsMarketingServices],
  ] as [string, boolean][];

  const activeServices = services.filter(([, v]) => v).map(([label]) => label);

  return `
    <div class="popup-content">
      <h3>${project.name}</h3>
      ${categoryBadge}
      <div class="popup-section">
        <strong>Location:</strong> ${project.nearestTown}, ${project.district}, ${project.province}
      </div>
      <div class="popup-section">
        <strong>Contact:</strong> ${project.contact}
        ${project.phone ? `<br>${project.phone}` : ''}
        ${project.email ? `<br><a href="mailto:${project.email}">${project.email}</a>` : ''}
      </div>
      <div class="popup-section popup-section--inline">
        <strong>Year started:</strong> ${project.yearStarted}
      </div>
      ${activeAttributes.length ? `
      <div class="popup-section">
        <strong>Attributes:</strong>
        <ul class="practices-list">
          ${activeAttributes.map(a => `<li class="attr-item">${a}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${project.onSiteTraining ? `
      <div class="popup-section popup-section--inline">
        <strong>On-site training:</strong> Yes
      </div>` : ''}
      ${project.structuredTrainingProgrammes ? `
      <div class="popup-section">
        <strong>Structured training:</strong> ${trainingTypeDisplay}
        ${project.trainingAccreditation ? ' · Accredited' : ''}
      </div>` : ''}
      ${activeServices.length ? `
      <div class="popup-section">
        <strong>Goods &amp; Services:</strong> ${activeServices.join(', ')}
      </div>` : ''}
    </div>
  `;
}
