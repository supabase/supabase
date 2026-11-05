const cases = [
  {
    id: 'northstar',
    name: 'Northstar supply chain review',
    type: 'Vendor review',
    status: 'In progress',
    updated: '2h ago',
    description: 'Reviewing reported shipment delays across a fictional vendor network.',
    icon: '▦',
  },
  {
    id: 'copperline',
    name: 'Copperline billing variance',
    type: 'Financial review',
    status: 'Needs review',
    updated: '5h ago',
    description: 'Comparing sample invoices with a fictional delivery schedule.',
    icon: '▤',
  },
  {
    id: 'blueharbor',
    name: 'Blue Harbor route update',
    type: 'Operations review',
    status: 'In progress',
    updated: '1d ago',
    description: 'Mapping a fictional route change against submitted shipping records.',
    icon: '⌖',
  },
  {
    id: 'evergreen',
    name: 'Evergreen contract timeline',
    type: 'Document review',
    status: 'Complete',
    updated: '2d ago',
    description: 'Organizing fictional contract dates and supporting documents.',
    icon: '▧',
  },
  {
    id: 'silverpine',
    name: 'Silverpine supplier check',
    type: 'Vendor review',
    status: 'Needs review',
    updated: '3d ago',
    description: 'Tracking open questions for a fictional supplier profile.',
    icon: '▦',
  },
  {
    id: 'westward',
    name: 'Westward inventory notes',
    type: 'Operations review',
    status: 'In progress',
    updated: '4d ago',
    description: 'Reviewing a fictional inventory summary and related notes.',
    icon: '▤',
  },
]

const scenarioOutputs = {
  delay: {
    title: 'Temporary delay remains plausible',
    body: 'Compare the submitted status report with a second, independent shipment record. A matching timestamp would support this assumption; a conflicting timestamp would weaken it.',
  },
  record: {
    title: 'Incomplete records remain plausible',
    body: 'Check whether the manifest and invoice cover the same reporting period. A documented gap could explain the mismatch without establishing its cause.',
  },
  route: {
    title: 'A route change could explain the mismatch',
    body: 'Look for a dated route update in the case materials and compare it with the shipment timeline. Treat any connection as unverified until the records agree.',
  },
}

const caseList = document.querySelector('#case-list')
const noCases = document.querySelector('#no-cases')
const caseSearch = document.querySelector('#case-search')
const statusFilter = document.querySelector('#status-filter')
const selectedCaseTitle = document.querySelector('#selected-case-title')
const selectedCaseDescription = document.querySelector('#selected-case-description')
const caseStatus = document.querySelector('#case-status')
const caseCount = document.querySelector('#active-case-count')
const createCaseDialog = document.querySelector('#create-case-dialog')
const messageDialog = document.querySelector('#message-dialog')
let selectedCaseId = 'northstar'
let showAllCases = false
let newestFirst = true

function renderCases() {
  const searchTerm = caseSearch.value.trim().toLowerCase()
  const status = statusFilter.value
  const visibleCases = cases.filter((item) => {
    const matchesText = `${item.name} ${item.type}`.toLowerCase().includes(searchTerm)
    const matchesStatus = status === 'all' || item.status === status
    return matchesText && matchesStatus
  })

  if (!newestFirst) visibleCases.reverse()
  const displayedCases = showAllCases ? visibleCases : visibleCases.slice(0, 5)

  caseList.replaceChildren(
    ...displayedCases.map((item) => {
      const button = document.createElement('button')
      button.className = `case-row${item.id === selectedCaseId ? ' selected' : ''}`
      button.type = 'button'
      button.dataset.caseId = item.id
      button.setAttribute('aria-pressed', String(item.id === selectedCaseId))

      const statusClass = item.status === 'Complete' ? 'complete' : item.status === 'Needs review' ? 'review' : 'progress'
      button.innerHTML = `
        <span class="case-type-icon" aria-hidden="true">${item.icon}</span>
        <span class="case-row-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="case-row-meta"><i class="mini-dot ${statusClass}"></i>${escapeHtml(item.status)}</span>
        </span>
        <span class="case-updated">${escapeHtml(item.updated)}</span>
      `
      button.addEventListener('click', () => selectCase(item.id))
      return button
    })
  )

  noCases.hidden = displayedCases.length > 0
  caseList.hidden = displayedCases.length === 0
  document.querySelector('#show-all-cases').hidden = visibleCases.length <= 5
  document.querySelector('#show-all-cases').innerHTML = showAllCases
    ? 'Show fewer cases <span aria-hidden="true">↑</span>'
    : 'View all cases <span aria-hidden="true">→</span>'
}

function selectCase(caseId) {
  const selectedCase = cases.find((item) => item.id === caseId)
  if (!selectedCase) return

  selectedCaseId = caseId
  selectedCaseTitle.textContent = selectedCase.name
  selectedCaseDescription.textContent = selectedCase.description
  caseStatus.textContent = selectedCase.status.toUpperCase()
  caseCount.textContent = String(cases.length).padStart(2, '0')
  document.querySelector('.status-dot').style.background =
    selectedCase.status === 'Complete' ? '#4a9a70' : selectedCase.status === 'Needs review' ? '#cf7c61' : '#d4ae5e'
  renderCases()
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

function showMessage(title, body) {
  document.querySelector('#message-title').textContent = title
  document.querySelector('#message-body').textContent = body
  messageDialog.showModal()
}

caseSearch.addEventListener('input', renderCases)
statusFilter.addEventListener('change', renderCases)

document.querySelector('#show-all-cases').addEventListener('click', () => {
  showAllCases = !showAllCases
  renderCases()
})

document.querySelector('#sort-cases').addEventListener('click', (event) => {
  newestFirst = !newestFirst
  event.currentTarget.innerHTML = newestFirst
    ? '<span aria-hidden="true">↕</span> Recently updated'
    : '<span aria-hidden="true">↕</span> Oldest updated'
  renderCases()
})

document.querySelectorAll('.case-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.case-tab').forEach((item) => {
      const isActive = item === tab
      item.classList.toggle('active', isActive)
      item.setAttribute('aria-selected', String(isActive))
    })

    document.querySelectorAll('[data-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== tab.dataset.tab
    })
  })
})

document.querySelectorAll('.graph-node').forEach((node) => {
  node.addEventListener('click', () => {
    document.querySelectorAll('.graph-node').forEach((item) => item.classList.remove('selected'))
    node.classList.add('selected')
    showMessage(
      node.dataset.entity,
      'This fictional entity is linked to case materials shown on the relationship map. Add and verify evidence before drawing conclusions.'
    )
  })
})

document.querySelectorAll('[data-nav]').forEach((item) => {
  item.addEventListener('click', () => {
    if (item.dataset.nav === 'cases') return
    const sectionNames = {
      evidence: 'Evidence library',
      scenarios: 'Scenario planner',
      team: 'Team',
      settings: 'Settings',
    }
    showMessage(
      sectionNames[item.dataset.nav] || 'Workspace',
      'This prototype focuses on the case workspace. Connect your Supabase project to add persistent team data and access controls.'
    )
  })
})

document.querySelector('#create-case-button').addEventListener('click', () => {
  document.querySelector('#create-case-form').reset()
  createCaseDialog.showModal()
  document.querySelector('#new-case-name').focus()
})

document.querySelector('#create-case-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const nameInput = document.querySelector('#new-case-name')
  const descriptionInput = document.querySelector('#new-case-description')
  const name = nameInput.value.trim()
  if (!name) {
    nameInput.setCustomValidity('Enter a case name.')
    nameInput.reportValidity()
    nameInput.addEventListener('input', () => nameInput.setCustomValidity(''), { once: true })
    return
  }

  const newCase = {
    id: `case-${Date.now()}`,
    name,
    type: 'New case',
    status: 'In progress',
    updated: 'Just now',
    description: descriptionInput.value.trim() || 'Add a research question and evidence to begin this case.',
    icon: '▦',
  }
  cases.unshift(newCase)
  caseCount.textContent = String(cases.length).padStart(2, '0')
  statusFilter.value = 'all'
  caseSearch.value = ''
  showAllCases = false
  createCaseDialog.close()
  selectCase(newCase.id)
})

document.querySelector('#close-create-case').addEventListener('click', () => createCaseDialog.close())
document.querySelector('#cancel-create-case').addEventListener('click', () => createCaseDialog.close())

document.querySelector('#add-evidence-button').addEventListener('click', () => {
  showMessage(
    'Add evidence',
    'Evidence uploads are not connected in this UI prototype. A production version should store files in a private Supabase Storage bucket with case-level access policies.'
  )
})

document.querySelector('#run-scenario').addEventListener('click', () => {
  const output = scenarioOutputs[document.querySelector('#scenario-select').value]
  const result = document.querySelector('#scenario-result')
  result.innerHTML = `
    <div class="result-icon" aria-hidden="true">✳</div>
    <div>
      <strong>${escapeHtml(output.title)}</strong>
      <p>${escapeHtml(output.body)}</p>
    </div>
  `
})

let zoom = 100
function updateZoom() {
  document.querySelector('#zoom-level').textContent = `${zoom}%`
  document.querySelector('.graph-content').style.transform = `scale(${zoom / 100})`
}

document.querySelector('#zoom-in').addEventListener('click', () => {
  zoom = Math.min(140, zoom + 10)
  updateZoom()
})

document.querySelector('#zoom-out').addEventListener('click', () => {
  zoom = Math.max(70, zoom - 10)
  updateZoom()
})

document.querySelector('#fit-graph').addEventListener('click', () => {
  zoom = 100
  updateZoom()
})

document.querySelector('.notification-button').addEventListener('click', () => {
  showMessage('No new notifications', 'You are up to date with activity in this demo workspace.')
})

document.querySelector('.profile-button').addEventListener('click', () => {
  showMessage('Jordan Davis', 'Signed in to the Northwind Research demo workspace.')
})

document.querySelector('.more-button').addEventListener('click', () => {
  showMessage('Case actions', 'Case export and sharing are not enabled in this prototype.')
})

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((navItem) => navItem.classList.remove('active'))
    item.classList.add('active')
  })
})

document.addEventListener('keydown', (event) => {
  const activeElement = document.activeElement
  const isEditing = activeElement instanceof HTMLElement && activeElement.matches('input, textarea, select')
  if (event.key === '/' && !isEditing) {
    event.preventDefault()
    caseSearch.focus()
  }
})

renderCases()
