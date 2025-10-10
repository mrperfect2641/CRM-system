const projectNotes = {
      1: [
        { text: "Initial project planning completed", date: "05/10/2025" }
      ],
      2: [
        { text: "Design phase in progress", date: "05/10/2025" }
      ],
      3: [
        { text: "Waiting for client feedback", date: "05/10/2025" }
      ],
      4: [
        { text: "E-commerce platform development in progress", date: "06/15/2025" }
      ],
      5: [
        { text: "Waiting for client approval on design", date: "07/01/2025" }
      ],
      6: [
        { text: "CRM system successfully deployed", date: "04/20/2025" }
      ],
      7: [
        { text: "Dashboard design in progress", date: "08/10/2025" }
      ],
      8: [
        { text: "API integration pending third-party response", date: "09/05/2025" }
      ],
      9: [
        { text: "Social media campaign completed successfully", date: "10/12/2025" }
      ],
      10: [
        { text: "Brand identity design in final stages", date: "11/20/2025" }
      ]
    };

    let projects = [
      { id: 1, name: "Perfect Solution Website", client: "Anurag Yadav", startDate: "05/10/2025", status: "completed" },
      { id: 2, name: "Perfect Solution Website", client: "Anurag Yadav", startDate: "05/10/2025", status: "in-process" },
      { id: 3, name: "Perfect Solution Website", client: "Anurag Yadav", startDate: "05/10/2025", status: "waiting" },
      { id: 4, name: "E-commerce Platform", client: "John Smith", startDate: "06/15/2025", status: "in-process" },
      { id: 5, name: "Mobile App Development", client: "Sarah Johnson", startDate: "07/01/2025", status: "waiting" },
      { id: 6, name: "CRM System", client: "Mike Wilson", startDate: "04/20/2025", status: "completed" },
      { id: 7, name: "Dashboard Design", client: "Emily Brown", startDate: "08/10/2025", status: "in-process" },
      { id: 8, name: "API Integration", client: "David Lee", startDate: "09/05/2025", status: "waiting" },
      { id: 9, name: "Social Media Campaign", client: "Lisa Anderson", startDate: "10/12/2025", status: "completed" },
      { id: 10, name: "Brand Identity Design", client: "Robert Taylor", startDate: "11/20/2025", status: "in-process" }
    ];

    // Current selected project
    let selectedProjectId = null;
    let editProjectId = null;

    // DOM Content Loaded
    document.addEventListener('DOMContentLoaded', function() {
      initializeProjectsTable();
      updateStatusCounts();
      initializeProjectsTableScroll();
      setupEventListeners();
    });

    // Initialize projects table
    function initializeProjectsTable() {
      const tableBody = document.querySelector('#projectsTableContainer tbody');
      tableBody.innerHTML = '';
      
      projects.forEach(project => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-project-id', project.id);
        tr.innerHTML = `
          <td>${project.id}</td>
          <td>${project.name}</td>
          <td>${project.client}</td>
          <td>${project.startDate}</td>
          <td><span class="status ${project.status}">${getStatusText(project.status)}</span></td>
          <td class="actions">
            <button class="btn btn-edit" data-project-id="${project.id}">Edit</button>
            <button class="btn btn-remove" data-project-id="${project.id}">Remove</button>
          </td>
        `;
        tableBody.appendChild(tr);
      });
      
      // Add click events to rows
      document.querySelectorAll('.projects-table-container tbody tr').forEach(row => {
        row.addEventListener('click', function() {
          selectProject(this.getAttribute('data-project-id'));
        });
      });
    }

    // Setup event listeners
    function setupEventListeners() {
      // Search functionality
      document.querySelector('.search-box input').addEventListener('input', function(e) {
        filterProjects(e.target.value);
      });
      
      // Add note functionality
      document.querySelector('.notes-input button').addEventListener('click', addNote);
      
      // Enter key for adding notes
      document.querySelector('.notes-input textarea').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          addNote();
        }
      });
      
      // Navigation menu
      document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
          document.querySelectorAll('.nav-item').forEach(i => {
            i.classList.remove('active');
          });
          this.classList.add('active');
        });
      });
      
      // Edit and Remove buttons (delegated)
      document.querySelector('#projectsTableContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
          e.stopPropagation();
          editProject(e.target.getAttribute('data-project-id'));
        } else if (e.target.classList.contains('btn-remove')) {
          e.stopPropagation();
          removeProject(e.target.getAttribute('data-project-id'));
        }
      });
      
      // Project Modal Event Listeners
      const openBtn = document.getElementById('open-project-btn');
      const overlay = document.getElementById('pjOverlay');
      const cancelBtn = document.getElementById('project-cancel-btn');
      const form = document.getElementById('project-form');
      
      if (openBtn) {
        openBtn.addEventListener('click', function() {
          openProjectModal();
        });
      }
      
      if (overlay) {
        overlay.addEventListener('click', closeProjectModal);
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', closeProjectModal);
      }
      
      if (form) {
        form.addEventListener('submit', handleProjectSubmit);
      }
    }

    // Project functions
    function openProjectModal(projectId = null) {
      const modal = document.getElementById('project-modal');
      const form = document.getElementById('project-form');
      const title = document.getElementById('pjTitle');
      
      if (projectId) {
        // Edit mode
        editProjectId = projectId;
        const project = projects.find(p => p.id == projectId);
        title.textContent = 'Edit Project';
        document.getElementById('pj-name').value = project.name;
        document.getElementById('pj-client').value = project.client;
        document.getElementById('pj-start').value = formatDateForInput(project.startDate);
        document.getElementById('pj-status').value = project.status;
      } else {
        // Add mode
        editProjectId = null;
        title.textContent = 'New Project';
        form.reset();
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pj-start').value = today;
      }
      
      modal.classList.remove('hidden');
    }

    function closeProjectModal() {
      const modal = document.getElementById('project-modal');
      modal.classList.add('hidden');
      editProjectId = null;
    }

    function handleProjectSubmit(e) {
      e.preventDefault();
      
      const name = document.getElementById('pj-name').value.trim();
      const client = document.getElementById('pj-client').value.trim();
      const start = document.getElementById('pj-start').value;
      const status = document.getElementById('pj-status').value;
      
      if (!name || !client || !start) {
        alert('Please fill all fields');
        return;
      }
      
      if (editProjectId) {
        // Update existing project
        const projectIndex = projects.findIndex(p => p.id == editProjectId);
        if (projectIndex !== -1) {
          projects[projectIndex] = {
            ...projects[projectIndex],
            name,
            client,
            startDate: formatDateFromInput(start),
            status: status.toLowerCase()
          };
        }
      } else {
        // Add new project
        const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        const newProject = {
          id: newId,
          name,
          client,
          startDate: formatDateFromInput(start),
          status: status.toLowerCase()
        };
        projects.push(newProject);
        
        // Initialize empty notes for new project
        if (!projectNotes[newId]) {
          projectNotes[newId] = [];
        }
      }
      
      initializeProjectsTable();
      updateStatusCounts();
      closeProjectModal();
    }

    function editProject(projectId) {
      openProjectModal(projectId);
    }

    function removeProject(projectId) {
      if (confirm('Are you sure you want to remove this project?')) {
        projects = projects.filter(p => p.id != projectId);
        initializeProjectsTable();
        updateStatusCounts();
        
        // Clear notes if selected project was removed
        if (selectedProjectId == projectId) {
          selectedProjectId = null;
          document.querySelector('.notes-content').innerHTML = '<div class="note-item"><p>Select a project to view notes</p></div>';
        }
      }
    }

    function selectProject(projectId) {
      // Remove active class from all rows
      document.querySelectorAll('.projects-table-container tbody tr').forEach(r => {
        r.classList.remove('active');
      });
      
      // Add active class to clicked row
      const selectedRow = document.querySelector(`tr[data-project-id="${projectId}"]`);
      if (selectedRow) {
        selectedRow.classList.add('active');
      }
      
      selectedProjectId = projectId;
      displayNotes(projectId);
    }

    // Notes functions
    function displayNotes(projectId) {
      const notesContent = document.querySelector('.notes-content');
      const notes = projectNotes[projectId] || [];
      
      notesContent.innerHTML = '';
      
      if (notes.length === 0) {
        notesContent.innerHTML = '<div class="note-item"><p>No notes available for this project</p></div>';
        return;
      }
      
      notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
          <p>${note.text}</p>
          <div class="note-date">${note.date}</div>
        `;
        notesContent.appendChild(noteItem);
      });
    }

    function addNote() {
      const noteTextarea = document.querySelector('.notes-input textarea');
      const noteText = noteTextarea.value.trim();
      
      if (noteText && selectedProjectId) {
        if (!projectNotes[selectedProjectId]) {
          projectNotes[selectedProjectId] = [];
        }
        
        const currentDate = new Date().toLocaleDateString();
        projectNotes[selectedProjectId].push({
          text: noteText,
          date: currentDate
        });
        
        displayNotes(selectedProjectId);
        noteTextarea.value = '';
      } else if (!selectedProjectId) {
        alert('Please select a project first');
      }
    }

    // Filter and search
    function filterProjects(searchTerm) {
      const term = searchTerm.toLowerCase();
      const rows = document.querySelectorAll('.projects-table-container tbody tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(term)) {
          row.style.display = 'table-row';
        } else {
          row.style.display = 'none';
        }
      });
      
      updateStatusCounts();
    }

    // Status counts
    function updateStatusCounts() {
      const rows = document.querySelectorAll('.projects-table-container tbody tr');
      let allCount = 0;
      let pendingCount = 0;
      let waitingCount = 0;
      let completedCount = 0;
      
      rows.forEach(row => {
        if (row.style.display !== 'none' && row.offsetParent !== null) {
          allCount++;
          const statusElement = row.querySelector('.status');
          if (statusElement) {
            const status = statusElement.textContent.trim().toLowerCase();
            if (status === 'completed') {
              completedCount++;
            } else if (status === 'in process') {
              pendingCount++;
            } else if (status === 'waiting') {
              waitingCount++;
            }
          }
        }
      });
      
      document.querySelector('.all-projects .count').textContent = allCount;
      document.querySelector('.pending .count').textContent = pendingCount;
      document.querySelector('.waiting .count').textContent = waitingCount;
      document.querySelector('.completed .count').textContent = completedCount;
    }

    // Table scroll functionality
    function initializeProjectsTableScroll() {
      const tableContainer = document.getElementById('projectsTableContainer');
      const showMoreIndicator = document.getElementById('showMoreIndicator');
      const rows = tableContainer.querySelectorAll('tbody tr');
      
      if (rows.length > 5) {
        tableContainer.classList.add('has-more-rows');
        showMoreIndicator.style.display = 'block';
        
        tableContainer.addEventListener('scroll', function() {
          const scrollTop = tableContainer.scrollTop;
          const scrollHeight = tableContainer.scrollHeight;
          const clientHeight = tableContainer.clientHeight;
          
          if (scrollTop + clientHeight >= scrollHeight - 10) {
            showMoreIndicator.style.display = 'none';
          } else {
            showMoreIndicator.style.display = 'block';
          }
        });
        
        showMoreIndicator.addEventListener('click', function() {
          tableContainer.scrollBy({ top: 100, behavior: 'smooth' });
        });
      } else {
        showMoreIndicator.style.display = 'none';
      }
    }

    // Utility functions
    function getStatusText(status) {
      const statusMap = {
        'completed': 'Completed',
        'in-process': 'In Process',
        'waiting': 'Waiting',
        'planned': 'Planned'
      };
      return statusMap[status] || status;
    }

    function formatDateForInput(dateString) {
      const [month, day, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    function formatDateFromInput(dateString) {
      const date = new Date(dateString);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    }