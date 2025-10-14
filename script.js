const SUPABASE_URL = 'https://kqaqnhbdqnflbpjhrazq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXFuaGJkcW5mbGJwamhyYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTIyMTksImV4cCI6MjA3NTY4ODIxOX0.5tAfWDw2gnkrgICmOr0ZQ8EiPG3aLMQ5TxuCuBUI5sU';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let projects = [];
let featuredProjects = [];
let selectedProjectId = null;
let editProjectId = null;
let editFeaturedProjectId = null;
let currentImageFile = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing app...');
  initializeApp();
});

// Initialize the application
async function initializeApp() {
  showLoading();
  await loadProjects();
  await initializeFeaturedProjects();
  updateStatusCounts();
  initializeProjectsTableScroll();
  setupEventListeners();
  setupSectionSwitching();
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
  const tableBody = document.getElementById('projectsTableBody');
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
  document.getElementById('searchInput').addEventListener('input', function(e) {
    filterProjects(e.target.value);
  });
  
  // Add note functionality
  document.getElementById('addNoteBtn').addEventListener('click', addNote);
  
  // Enter key for adding notes
  document.getElementById('noteTextarea').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addNote();
    }
  });
  
  // Edit and Remove buttons (delegated)
  document.getElementById('projectsTableContainer').addEventListener('click', function(e) {
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
    openBtn.addEventListener('click', function(e) {
      console.log('Add Project button clicked');
      e.preventDefault();
      e.stopPropagation();
      openProjectModal();
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeProjectModal();
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeProjectModal();
    });
  }
  
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleProjectSubmit(e);
    });
  }
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
      document.getElementById('notesContent').innerHTML = '<div class="note-item"><p>Select a project to view notes</p></div>';
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
  const notesContent = document.getElementById('notesContent');
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
  const noteTextarea = document.getElementById('noteTextarea');
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

// Featured Projects functionality
async function initializeFeaturedProjects() {
  await loadFeaturedProjects();
  setupFeaturedProjectsEventListeners();
}

// Load featured projects from Supabase
async function loadFeaturedProjects() {
  try {
    const { data, error } = await supabaseClient
      .from('featured_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    featuredProjects = data || [];
    renderFeaturedProjects();
  } catch (error) {
    console.error('Error loading featured projects:', error);
  }
}

// Render featured projects
function renderFeaturedProjects() {
  const container = document.getElementById('featured-projects-container');
  container.innerHTML = '';

  if (featuredProjects.length === 0) {
    container.innerHTML = `
      <div class="no-projects">
        <i class="fas fa-image" style="font-size: 48px; color: #bdc3c7; margin-bottom: 10px;"></i>
        <p style="color: #7f8c8d; text-align: center;">No featured projects yet. Click "Add Project" to get started.</p>
      </div>
    `;
    return;
  }

  featuredProjects.forEach((project, index) => {
    const projectElement = createFeaturedProjectElement(project, index);
    container.appendChild(projectElement);
  });

  initializeFeaturedProjectsScroll();
}

// Create featured project element
function createFeaturedProjectElement(project, index) {
  const div = document.createElement('div');
  div.className = 'featured-project-item';
  div.setAttribute('data-project-id', project.id);
  
  const imageUrl = project.image_url || '';
  const hasImage = imageUrl && imageUrl !== '';
  
  div.innerHTML = `
    <div class="featured-project-image">
      ${hasImage ? 
        `<img src="${imageUrl}" alt="${project.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
         <div class="placeholder" style="display: none;"><i class="fas fa-image"></i></div>` :
        `<div class="placeholder"><i class="fas fa-image"></i></div>`
      }
    </div>
    <div class="featured-project-info">
      <h4>${project.title || 'Untitled Project'}</h4>
      <div class="featured-project-details">
        <div class="featured-project-url">
          <a href="${project.url}" target="_blank" rel="noopener noreferrer">
            ${project.url}
          </a>
        </div>
        <div class="featured-project-size">${project.size || 'No size specified'}</div>
      </div>
    </div>
    <div class="featured-project-actions">
      <button class="btn btn-edit btn-sm" data-project-id="${project.id}">Edit</button>
      <button class="btn btn-remove btn-sm" data-project-id="${project.id}">Remove</button>
    </div>
  `;
  
  return div;
}

// Setup featured projects event listeners
function setupFeaturedProjectsEventListeners() {
  // Add project button
  document.getElementById('add-featured-project').addEventListener('click', openFeaturedProjectModal);
  
  // Modal event listeners
  document.getElementById('featuredProjectOverlay').addEventListener('click', closeFeaturedProjectModal);
  document.getElementById('featured-project-cancel').addEventListener('click', closeFeaturedProjectModal);
  document.getElementById('featured-project-form').addEventListener('submit', handleFeaturedProjectSubmit);
  
  // Image upload
  document.getElementById('upload-trigger').addEventListener('click', () => {
    document.getElementById('project-image').click();
  });
  
  document.getElementById('project-image').addEventListener('change', handleImageUpload);
  document.getElementById('imagePreview').addEventListener('click', () => {
    document.getElementById('project-image').click();
  });
  
  // Edit and Remove buttons (delegated)
  document.getElementById('featured-projects-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-edit')) {
      e.stopPropagation();
      editFeaturedProject(e.target.getAttribute('data-project-id'));
    } else if (e.target.classList.contains('btn-remove')) {
      e.stopPropagation();
      removeFeaturedProject(e.target.getAttribute('data-project-id'));
    }
  });
}

// Handle image upload
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  currentImageFile = file;
  const preview = document.getElementById('imagePreview');
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      preview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  }
}

// Open featured project modal
function openFeaturedProjectModal(projectId = null) {
  const modal = document.getElementById('featured-project-modal');
  const form = document.getElementById('featured-project-form');
  const title = document.getElementById('featuredProjectTitle');
  
  if (projectId) {
    // Edit mode
    editFeaturedProjectId = projectId;
    const project = featuredProjects.find(p => p.id == projectId);
    title.textContent = 'Edit Featured Project';
    document.getElementById('project-url').value = project.url || '';
    document.getElementById('project-size').value = project.size || '';
    document.getElementById('project-title').value = project.title || '';
    
    // Set image preview
    const preview = document.getElementById('imagePreview');
    if (project.image_url) {
      preview.innerHTML = `<img src="${project.image_url}" alt="Preview">`;
      preview.classList.add('has-image');
    } else {
      preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
      preview.classList.remove('has-image');
    }
  } else {
    // Add mode
    editFeaturedProjectId = null;
    title.textContent = 'Add Featured Project';
    form.reset();
    document.getElementById('imagePreview').innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
    document.getElementById('imagePreview').classList.remove('has-image');
    currentImageFile = null;
  }
  
  modal.classList.remove('hidden');
}

// Close featured project modal
function closeFeaturedProjectModal() {
  const modal = document.getElementById('featured-project-modal');
  modal.classList.add('hidden');
  editFeaturedProjectId = null;
  currentImageFile = null;
}

// Handle featured project form submission
async function handleFeaturedProjectSubmit(e) {
  e.preventDefault();
  
  const url = document.getElementById('project-url').value.trim();
  const size = document.getElementById('project-size').value.trim();
  const title = document.getElementById('project-title').value.trim();
  
  if (!url || !size || !title) {
    alert('Please fill all fields');
    return;
  }
  
  showLoading();
  
  try {
    let imageUrl = '';
    
    // Upload image if a new one was selected
    if (currentImageFile) {
      const fileName = `${Date.now()}-${currentImageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('project-images')
        .upload(fileName, currentImageFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('project-images')
        .getPublicUrl(fileName);
        
      imageUrl = urlData.publicUrl;
    }
    
    if (editFeaturedProjectId) {
      // Update existing project
      const updateData = {
        url: url,
        size: size,
        title: title,
        updated_at: new Date().toISOString()
      };
      
      // Only update image if a new one was uploaded
      if (currentImageFile) {
        updateData.image_url = imageUrl;
      }
      
      const { error } = await supabaseClient
        .from('featured_projects')
        .update(updateData)
        .eq('id', editFeaturedProjectId);

      if (error) throw error;
    } else {
      // Add new project
      const { error } = await supabaseClient
        .from('featured_projects')
        .insert([{
          url: url,
          size: size,
          title: title,
          image_url: imageUrl
        }]);

      if (error) throw error;
    }
    
    // Reload featured projects
    await loadFeaturedProjects();
    closeFeaturedProjectModal();
  } catch (error) {
    console.error('Error saving featured project:', error);
    alert('Error saving project: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Edit featured project
function editFeaturedProject(projectId) {
  openFeaturedProjectModal(projectId);
}

// Remove featured project
async function removeFeaturedProject(projectId) {
  if (!confirm('Are you sure you want to remove this featured project?')) {
    return;
  }
  
  showLoading();
  
  try {
    const { error } = await supabaseClient
      .from('featured_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    // Reload featured projects
    await loadFeaturedProjects();
  } catch (error) {
    console.error('Error removing featured project:', error);
    alert('Error removing project: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Initialize scroll functionality for featured projects
function initializeFeaturedProjectsScroll() {
  const container = document.getElementById('featured-projects-container');
  const showMoreIndicator = document.getElementById('featured-projects-more');
  const projects = container.querySelectorAll('.featured-project-item');
  
  if (projects.length > 3) {
    showMoreIndicator.style.display = 'block';
    
    container.addEventListener('scroll', function() {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        showMoreIndicator.style.display = 'none';
      } else {
        showMoreIndicator.style.display = 'block';
      }
    });
    
    showMoreIndicator.addEventListener('click', function() {
      container.scrollBy({ top: 100, behavior: 'smooth' });
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
    'waiting': 'Pending',
    'planned': 'To Start'
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

// Portfolio Images functionality
let portfolioImages = [];
let editPortfolioImageId = null;
let currentPortfolioImageFile = null;

// Initialize portfolio images
async function initializePortfolioImages() {
  await loadPortfolioImages();
  setupPortfolioImagesEventListeners();
}

// Load portfolio images from Supabase
async function loadPortfolioImages() {
  try {
    const { data, error } = await supabaseClient
      .from('portfolio_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    portfolioImages = data || [];
    renderPortfolioImages();
  } catch (error) {
    console.error('Error loading portfolio images:', error);
  }
}

// Render portfolio images
function renderPortfolioImages() {
  const container = document.getElementById('portfolio-images-container');
  container.innerHTML = '';

  if (portfolioImages.length === 0) {
    container.innerHTML = `
      <div class="no-images">
        <i class="fas fa-image" style="font-size: 48px; color: #bdc3c7; margin-bottom: 10px;"></i>
        <p style="color: #7f8c8d; text-align: center;">No portfolio images yet. Click "Add Image" to get started.</p>
      </div>
    `;
    return;
  }

  portfolioImages.forEach((image, index) => {
    const imageElement = createPortfolioImageElement(image, index);
    container.appendChild(imageElement);
  });

  initializePortfolioImagesScroll();
}

// Create portfolio image element
function createPortfolioImageElement(image, index) {
  const div = document.createElement('div');
  div.className = 'portfolio-image-item';
  div.setAttribute('data-image-id', image.id);
  
  const imageUrl = image.image_url || '';
  const hasImage = imageUrl && imageUrl !== '';
  
  div.innerHTML = `
    <div class="portfolio-image-preview">
      ${hasImage ? 
        `<img src="${imageUrl}" alt="${image.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
         <div class="placeholder" style="display: none;"><i class="fas fa-image"></i></div>` :
        `<div class="placeholder"><i class="fas fa-image"></i></div>`
      }
    </div>
    <div class="portfolio-image-info">
      <h4>${image.title || 'Untitled Image'}</h4>
      <div class="portfolio-image-details">
        <div class="portfolio-image-url">
          <a href="${image.url}" target="_blank" rel="noopener noreferrer">
            ${image.url}
          </a>
        </div>
        <div class="portfolio-image-size">${image.size || 'No size specified'}</div>
      </div>
    </div>
    <div class="portfolio-image-actions">
      <button class="btn btn-edit btn-sm" data-image-id="${image.id}">Edit</button>
      <button class="btn btn-remove btn-sm" data-image-id="${image.id}">Remove</button>
    </div>
  `;
  
  return div;
}

// Setup portfolio images event listeners
function setupPortfolioImagesEventListeners() {
  // Add image button
  const addImageBtn = document.getElementById('add-portfolio-image');
  if (addImageBtn) {
    addImageBtn.addEventListener('click', openPortfolioImageModal);
  }
  
  // Modal event listeners
  const overlay = document.getElementById('portfolioImageOverlay');
  const cancelBtn = document.getElementById('portfolio-image-cancel');
  const form = document.getElementById('portfolio-image-form');
  
  if (overlay) {
    overlay.addEventListener('click', closePortfolioImageModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closePortfolioImageModal);
  }
  
  if (form) {
    form.addEventListener('submit', handlePortfolioImageSubmit);
  }
  
  // Image upload
  const uploadTrigger = document.getElementById('portfolio-upload-trigger');
  const imageInput = document.getElementById('portfolio-image-input');
  const imagePreview = document.getElementById('portfolioImagePreview');
  
  if (uploadTrigger) {
    uploadTrigger.addEventListener('click', () => {
      if (imageInput) imageInput.click();
    });
  }
  
  if (imageInput) {
    imageInput.addEventListener('change', handlePortfolioImageUpload);
  }
  
  if (imagePreview) {
    imagePreview.addEventListener('click', () => {
      if (imageInput) imageInput.click();
    });
  }
  
  // Edit and Remove buttons (delegated)
  const container = document.getElementById('portfolio-images-container');
  if (container) {
    container.addEventListener('click', function(e) {
      if (e.target.classList.contains('btn-edit')) {
        e.stopPropagation();
        editPortfolioImage(e.target.getAttribute('data-image-id'));
      } else if (e.target.classList.contains('btn-remove')) {
        e.stopPropagation();
        removePortfolioImage(e.target.getAttribute('data-image-id'));
      }
    });
  }
}

// Handle portfolio image upload
function handlePortfolioImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  currentPortfolioImageFile = file;
  const preview = document.getElementById('portfolioImagePreview');
  
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function(e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      preview.classList.add('has-image');
    };
    reader.readAsDataURL(file);
  }
}

// Open portfolio image modal
function openPortfolioImageModal(imageId = null) {
  console.log('Opening portfolio image modal for:', imageId);
  const modal = document.getElementById('portfolio-image-modal');
  const form = document.getElementById('portfolio-image-form');
  const title = document.getElementById('portfolioImageTitle');
  
  if (!modal) {
    console.error('Portfolio image modal element not found!');
    return;
  }
  
  if (imageId) {
    // Edit mode
    editPortfolioImageId = imageId;
    const image = portfolioImages.find(img => img.id == imageId);
    title.textContent = 'Edit Portfolio Image';
    document.getElementById('portfolio-image-url').value = image.url || '';
    document.getElementById('portfolio-image-size').value = image.size || '';
    document.getElementById('portfolio-image-title').value = image.title || '';
    
    // Set image preview
    const preview = document.getElementById('portfolioImagePreview');
    if (image.image_url) {
      preview.innerHTML = `<img src="${image.image_url}" alt="Preview">`;
      preview.classList.add('has-image');
    } else {
      preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
      preview.classList.remove('has-image');
    }
  } else {
    // Add mode
    editPortfolioImageId = null;
    title.textContent = 'Add Portfolio Image';
    if (form) form.reset();
    const preview = document.getElementById('portfolioImagePreview');
    if (preview) {
      preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
      preview.classList.remove('has-image');
    }
    currentPortfolioImageFile = null;
  }
  
  modal.classList.remove('hidden');
  console.log('Portfolio image modal should be visible now');
}

// Close portfolio image modal
function closePortfolioImageModal() {
  console.log('Closing portfolio image modal');
  const modal = document.getElementById('portfolio-image-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  editPortfolioImageId = null;
  currentPortfolioImageFile = null;
}

// Handle portfolio image form submission
async function handlePortfolioImageSubmit(e) {
  e.preventDefault();
  console.log('Handling portfolio image submit...');
  
  const url = document.getElementById('portfolio-image-url').value.trim();
  const size = document.getElementById('portfolio-image-size').value.trim();
  const title = document.getElementById('portfolio-image-title').value.trim();
  
  if (!url || !size || !title) {
    alert('Please fill all fields');
    return;
  }
  
  showLoading();
  
  try {
    let imageUrl = '';
    
    // Upload image if a new one was selected
    if (currentPortfolioImageFile) {
      const fileName = `${Date.now()}-${currentPortfolioImageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('portfolio-images')
        .upload(fileName, currentPortfolioImageFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabaseClient.storage
        .from('portfolio-images')
        .getPublicUrl(fileName);
        
      imageUrl = urlData.publicUrl;
    }
    
    if (editPortfolioImageId) {
      // Update existing image
      const updateData = {
        url: url,
        size: size,
        title: title,
        updated_at: new Date().toISOString()
      };
      
      // Only update image if a new one was uploaded
      if (currentPortfolioImageFile) {
        updateData.image_url = imageUrl;
      }
      
      const { error } = await supabaseClient
        .from('portfolio_images')
        .update(updateData)
        .eq('id', editPortfolioImageId);

      if (error) throw error;
    } else {
      // Add new image
      const { error } = await supabaseClient
        .from('portfolio_images')
        .insert([{
          url: url,
          size: size,
          title: title,
          image_url: imageUrl
        }]);

      if (error) throw error;
    }
    
    // Reload portfolio images
    await loadPortfolioImages();
    closePortfolioImageModal();
  } catch (error) {
    console.error('Error saving portfolio image:', error);
    alert('Error saving image: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Edit portfolio image
function editPortfolioImage(imageId) {
  openPortfolioImageModal(imageId);
}

// Remove portfolio image
async function removePortfolioImage(imageId) {
  if (!confirm('Are you sure you want to remove this portfolio image?')) {
    return;
  }
  
  showLoading();
  
  try {
    const { error } = await supabaseClient
      .from('portfolio_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;

    // Reload portfolio images
    await loadPortfolioImages();
  } catch (error) {
    console.error('Error removing portfolio image:', error);
    alert('Error removing image: ' + error.message);
  } finally {
    hideLoading();
  }
}

// Initialize scroll functionality for portfolio images
function initializePortfolioImagesScroll() {
  const container = document.getElementById('portfolio-images-container');
  const showMoreIndicator = document.getElementById('portfolio-images-more');
  
  if (!container || !showMoreIndicator) return;
  
  const images = container.querySelectorAll('.portfolio-image-item');
  
  if (images.length > 3) {
    showMoreIndicator.style.display = 'block';
    
    container.addEventListener('scroll', function() {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      
      if (scrollTop + clientHeight >= scrollHeight - 10) {
        showMoreIndicator.style.display = 'none';
      } else {
        showMoreIndicator.style.display = 'block';
      }
    });
    
    showMoreIndicator.addEventListener('click', function() {
      container.scrollBy({ top: 100, behavior: 'smooth' });
    });
  } else {
    showMoreIndicator.style.display = 'none';
  }
}

// Update initializeApp function to include portfolio images
async function initializeApp() {
  showLoading();
  await loadProjects();
  await initializePortfolioImages(); // Changed from initializeFeaturedProjects
  updateStatusCounts();
  initializeProjectsTableScroll();
  setupEventListeners();
  setupSectionSwitching();
  hideLoading();
}