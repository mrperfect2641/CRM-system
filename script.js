const SUPABASE_URL = 'https://kqaqnhbdqnflbpjhrazq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXFuaGJkcW5mbGJwamhyYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTIyMTksImV4cCI6MjA3NTY4ODIxOX0.5tAfWDw2gnkrgICmOr0ZQ8EiPG3aLMQ5TxuCuBUI5sU';

    // Initialize Supabase client
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Global variables
    let projects = [];
    let selectedProjectId = null;
    let editProjectId = null;

    // DOM Content Loaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM loaded, initializing app...');
      initializeApp();
    });

    // Initialize the application
    async function initializeApp() {
      showLoading();
      await loadProjects();
      updateStatusCounts();
      initializeProjectsTableScroll();
      setupEventListeners();
      hideLoading();
    }

    // Show/hide loading spinner
    function showLoading() {
      document.getElementById('loading').style.display = 'block';
    }

    function hideLoading() {
      document.getElementById('loading').style.display = 'none';
    }

    // Load projects from Supabase
    async function loadProjects() {
      try {
        console.log('Loading projects from Supabase...');
        const { data, error } = await supabaseClient
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Projects loaded:', data);
        projects = data || [];
        initializeProjectsTable();
      } catch (error) {
        console.error('Error loading projects:', error);
        alert('Error loading projects: ' + error.message);
      }
    }

    // Load notes for a project from Supabase
    async function loadNotes(projectId) {
      try {
        const { data, error } = await supabaseClient
          .from('project_notes')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
      } catch (error) {
        console.error('Error loading notes:', error);
        return [];
      }
    }

    // Initialize projects table
    function initializeProjectsTable() {
      const tableBody = document.querySelector('#projectsTableContainer tbody');
      tableBody.innerHTML = '';
      
      if (projects.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: #999; padding: 40px;">
              No projects found. Click "Add Project" to create your first project.
            </td>
          </tr>
        `;
        return;
      }
      
      // projects.forEach(project => {
      //   const tr = document.createElement('tr');
      //   tr.setAttribute('data-project-id', project.id);
      //   tr.innerHTML = `
      //     <td>${project.id}</td>
      //     <td>${project.name}</td>
      //     <td>${project.client}</td>
      //     <td>${formatDisplayDate(project.start_date)}</td>
      //     <td><span class="status ${project.status}">${getStatusText(project.status)}</span></td>
      //     <td class="actions">
      //       <button class="btn btn-edit" data-project-id="${project.id}">Edit</button>
      //       <button class="btn btn-remove" data-project-id="${project.id}">Remove</button>
      //     </td>
      //   `;
      //   tableBody.appendChild(tr);
      // });
      // ======================================================= fix the numbering issue=========================
      projects.forEach((project, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-project-id', project.id);
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${project.name}</td>
          <td>${project.client}</td>
          <td>${formatDisplayDate(project.start_date)}</td>
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
      console.log('Setting up event listeners...');
      
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
      
      console.log('Modal elements:', { openBtn, overlay, cancelBtn, form });
      
      if (openBtn) {
        openBtn.addEventListener('click', function(e) {
          console.log('Add Project button clicked');
          e.preventDefault();
          e.stopPropagation();
          openProjectModal();
        });
      } else {
        console.error('Add Project button not found!');
      }
      
      if (overlay) {
        overlay.addEventListener('click', function(e) {
          console.log('Overlay clicked');
          e.preventDefault();
          e.stopPropagation();
          closeProjectModal();
        });
      }
      
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
          console.log('Cancel button clicked');
          e.preventDefault();
          e.stopPropagation();
          closeProjectModal();
        });
      }
      
      if (form) {
        form.addEventListener('submit', function(e) {
          console.log('Form submitted');
          e.preventDefault();
          e.stopPropagation();
          handleProjectSubmit(e);
        });
      }
      
      console.log('Event listeners setup complete');
    }

    // Project functions
    function openProjectModal(projectId = null) {
      console.log('Opening project modal for:', projectId);
      const modal = document.getElementById('project-modal');
      const form = document.getElementById('project-form');
      const title = document.getElementById('pjTitle');
      
      if (!modal) {
        console.error('Modal element not found!');
        return;
      }
      
      if (projectId) {
        // Edit mode
        editProjectId = projectId;
        const project = projects.find(p => p.id == projectId);
        title.textContent = 'Edit Project';
        document.getElementById('pj-name').value = project.name;
        document.getElementById('pj-client').value = project.client;
        document.getElementById('pj-start').value = project.start_date;
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
      console.log('Modal should be visible now');
    }

    function closeProjectModal() {
      console.log('Closing project modal');
      const modal = document.getElementById('project-modal');
      if (modal) {
        modal.classList.add('hidden');
      }
      editProjectId = null;
    }

    async function handleProjectSubmit(e) {
      console.log('Handling project submit...');
      e.preventDefault();
      
      const name = document.getElementById('pj-name').value.trim();
      const client = document.getElementById('pj-client').value.trim();
      const start = document.getElementById('pj-start').value;
      const status = document.getElementById('pj-status').value;
      
      if (!name || !client || !start) {
        alert('Please fill all fields');
        return;
      }
      
      console.log('Submitting project:', { name, client, start, status });
      showLoading();
      
      try {
        if (editProjectId) {
          // Update existing project
          console.log('Updating project:', editProjectId);
          const { error } = await supabaseClient
            .from('projects')
            .update({
              name: name,
              client: client,
              start_date: start,
              status: status,
              updated_at: new Date().toISOString()
            })
            .eq('id', editProjectId);

          if (error) throw error;
        } else {
          // Add new project
          console.log('Creating new project');
          const { data, error } = await supabaseClient
            .from('projects')
            .insert([
              {
                name: name,
                client: client,
                start_date: start,
                status: status
              }
            ])
            .select();

          if (error) throw error;
          console.log('Project created:', data);
        }
        
        // Reload projects
        await loadProjects();
        updateStatusCounts();
        closeProjectModal();
      } catch (error) {
        console.error('Error saving project:', error);
        alert('Error saving project: ' + error.message);
      } finally {
        hideLoading();
      }
    }

    function editProject(projectId) {
      console.log('Editing project:', projectId);
      openProjectModal(projectId);
    }

    async function removeProject(projectId) {
      if (!confirm('Are you sure you want to remove this project?')) {
        return;
      }
      
      console.log('Removing project:', projectId);
      showLoading();
      
      try {
        // First, delete all notes associated with this project
        const { error: notesError } = await supabaseClient
          .from('project_notes')
          .delete()
          .eq('project_id', projectId);

        if (notesError) throw notesError;

        // Then delete the project
        const { error: projectError } = await supabaseClient
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (projectError) throw projectError;

        // Reload projects
        await loadProjects();
        updateStatusCounts();
        
        // Clear notes if selected project was removed
        if (selectedProjectId == projectId) {
          selectedProjectId = null;
          document.querySelector('.notes-content').innerHTML = '<div class="note-item"><p>Select a project to view notes</p></div>';
        }
      } catch (error) {
        console.error('Error removing project:', error);
        alert('Error removing project: ' + error.message);
      } finally {
        hideLoading();
      }
    }

    async function selectProject(projectId) {
      console.log('Selecting project:', projectId);
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
      await displayNotes(projectId);
    }

    // Notes functions
    async function displayNotes(projectId) {
      const notesContent = document.querySelector('.notes-content');
      notesContent.innerHTML = '<div class="note-item"><p>Loading notes...</p></div>';
      
      const notes = await loadNotes(projectId);
      
      notesContent.innerHTML = '';
      
      if (notes.length === 0) {
        notesContent.innerHTML = '<div class="note-item"><p>No notes available for this project</p></div>';
        return;
      }
      
      notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
          <p>${note.note_text}</p>
          <div class="note-date">${formatDisplayDate(note.created_at)}</div>
        `;
        notesContent.appendChild(noteItem);
      });
    }

    async function addNote() {
      const noteTextarea = document.querySelector('.notes-input textarea');
      const noteText = noteTextarea.value.trim();
      
      if (noteText && selectedProjectId) {
        showLoading();
        
        try {
          const { error } = await supabaseClient
            .from('project_notes')
            .insert([
              {
                project_id: selectedProjectId,
                note_text: noteText
              }
            ]);

          if (error) throw error;

          await displayNotes(selectedProjectId);
          noteTextarea.value = '';
        } catch (error) {
          console.error('Error adding note:', error);
          alert('Error adding note: ' + error.message);
        } finally {
          hideLoading();
        }
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

    function formatDisplayDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }

    // Section switching functionality
    function setupSectionSwitching() {
      const navItems = document.querySelectorAll('.nav-item[data-section]');
      
      navItems.forEach(item => {
        item.addEventListener('click', function() {
          const targetSection = this.getAttribute('data-section');
          switchSection(targetSection);
        });
      });
    }

    function switchSection(sectionName) {
      // Hide all sections
      document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
      });
      
      // Remove active class from all nav items
      document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.classList.remove('active');
      });
      
      // Show target section and activate nav item
      const targetSection = document.getElementById(`${sectionName}-section`);
      const targetNavItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
      
      if (targetSection && targetNavItem) {
        targetSection.classList.remove('hidden');
        targetNavItem.classList.add('active');
      }
    }

    // Update the initializeApp function to include section switching
    async function initializeApp() {
      showLoading();
      await loadProjects();
      updateStatusCounts();
      initializeProjectsTableScroll();
      setupEventListeners();
      setupSectionSwitching(); // Add this line
      hideLoading();
    }