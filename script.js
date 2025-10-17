// =============================================
// CRM DASHBOARD - MAIN JAVASCRIPT FILE
// =============================================
// This file contains all the JavaScript functionality
// for the CRM Dashboard including:
// - Supabase integration
// - Project management
// - Portfolio images
// - Skills management
// - Updates functionality
// =============================================

// ===== SUPABASE CONFIGURATION =====
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://kqaqnhbdqnflbpjhrazq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXFuaGJkcW5mbGJwamhyYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTIyMTksImV4cCI6MjA3NTY4ODIxOX0.5tAfWDw2gnkrgICmOr0ZQ8EiPG3aLMQ5TxuCuBUI5sU';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL VARIABLES =====
// Store application data
let projects = [];          // All freelance projects
let portfolioImages = [];   // Portfolio images data
let skills = [];           // Skills and technologies
let updates = [];          // Recent updates

// Track currently selected/edited items
let selectedProjectId = null;      // Currently selected project for notes
let editProjectId = null;          // Project being edited
let editPortfolioImageId = null;   // Portfolio image being edited
let editSkillId = null;            // Skill being edited
let editUpdateId = null;           // Update being edited
let currentPortfolioImageFile = null; // File object for image upload

// ===== INITIALIZATION =====

/**
 * DOM Content Loaded Event Listener
 * Initializes the application when the DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing CRM Dashboard...');
    initializeApp();
});

/**
 * Main Application Initialization Function
 * Loads all data and sets up the application
 */
async function initializeApp() {
    showLoading();
    
    // Load all data sections in parallel for better performance
    await Promise.all([
        loadProjects(),
        initializePortfolioImages(),
        initializeSkills(),
        initializeUpdates()
    ]);
    
    // Update UI components
    updateStatusCounts();
    initializeProjectsTableScroll();
    setupEventListeners();
    setupSectionSwitching();
    
    hideLoading();
    console.log('CRM Dashboard initialized successfully');
}

// ===== LOADING FUNCTIONS =====

/**
 * Show Loading Spinner
 * Displays the loading overlay during API calls
 */
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

/**
 * Hide Loading Spinner
 * Hides the loading overlay when operations complete
 */
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// ===== FREELANCE PROJECTS FUNCTIONS =====

/**
 * Load Projects from Supabase
 * Fetches all projects from the database and updates the UI
 */
async function loadProjects() {
    try {
        console.log('Loading projects from Supabase...');
        const { data, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error loading projects:', error);
            throw error;
        }

        console.log(`Loaded ${data?.length || 0} projects`);
        projects = data || [];
        initializeProjectsTable();
        
    } catch (error) {
        console.error('Error loading projects:', error);
        alert('Error loading projects: ' + error.message);
    }
}

/**
 * Initialize Projects Table
 * Populates the projects table with data
 */
function initializeProjectsTable() {
    const tableBody = document.getElementById('projectsTableBody');
    tableBody.innerHTML = '';
    
    // Show empty state if no projects
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
    
    // Populate table with project data
    projects.forEach((project, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-project-id', project.id);
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(project.name)}</td>
            <td>${escapeHtml(project.client)}</td>
            <td>${formatDisplayDate(project.start_date)}</td> <!-- This will now show DD/MM/YYYY -->
            <td><span class="status ${project.status}">${getStatusText(project.status)}</span></td>
            <td class="actions">
                <button class="btn btn-edit" data-project-id="${project.id}">Edit</button>
                <button class="btn btn-remove" data-project-id="${project.id}">Remove</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    // Add click events to project rows
    setupProjectRowClickEvents();
}

/**
 * Setup Project Row Click Events
 * Adds event listeners to project table rows for selection
 */
function setupProjectRowClickEvents() {
    document.querySelectorAll('.projects-table-container tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            selectProject(this.getAttribute('data-project-id'));
        });
    });
}

// ===== PORTFOLIO IMAGES FUNCTIONS =====

/**
 * Initialize Portfolio Images
 * Loads portfolio images and sets up event listeners
 */
async function initializePortfolioImages() {
    await loadPortfolioImages();
    setupPortfolioImagesEventListeners();
}

/**
 * Load Portfolio Images from Supabase
 * Fetches all portfolio images from the database
 */
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

/**
 * Render Portfolio Images to DOM
 * Displays portfolio images in the container
 */
function renderPortfolioImages() {
    const container = document.getElementById('portfolioImagesContainer');
    if (!container) return;
    
    container.innerHTML = '';

    // Show empty state if no images
    if (portfolioImages.length === 0) {
        container.innerHTML = `
            <div class="no-images">
                <i class="fas fa-image" style="font-size: 48px; color: #bdc3c7; margin-bottom: 10px;"></i>
                <p style="color: #7f8c8d; text-align: center;">No portfolio images yet. Click "Add Image" to get started.</p>
            </div>
        `;
        return;
    }

    // Create and append image elements
    portfolioImages.forEach((image) => {
        const imageElement = createPortfolioImageElement(image);
        container.appendChild(imageElement);
    });

    initializePortfolioImagesScroll();
}

/**
 * Create Portfolio Image Element
 * Generates HTML for a single portfolio image item
 */
function createPortfolioImageElement(image) {
    const div = document.createElement('div');
    div.className = 'portfolio-image-item';
    div.setAttribute('data-image-id', image.id);
    
    const imageUrl = image.image_url || '';
    const hasImage = imageUrl && imageUrl !== '';
    
    div.innerHTML = `
        <div class="portfolio-image-preview">
            ${hasImage ? 
                `<img src="${imageUrl}" alt="${escapeHtml(image.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" loading="lazy">
                 <div class="placeholder" style="display: none;"><i class="fas fa-image"></i></div>` :
                `<div class="placeholder"><i class="fas fa-image"></i></div>`
            }
        </div>
        <div class="portfolio-image-info">
            <h4>${escapeHtml(image.title || 'Untitled Image')}</h4>
            <div class="portfolio-image-details">
                <div class="portfolio-image-url">
                    <a href="${image.url}" target="_blank" rel="noopener noreferrer">
                        ${image.url}
                    </a>
                </div>
                <div class="portfolio-image-size">${escapeHtml(image.size || 'No size specified')}</div>
            </div>
        </div>
        <div class="portfolio-image-actions">
            <button class="btn btn-edit btn-sm" data-image-id="${image.id}">Edit</button>
            <button class="btn btn-remove btn-sm" data-image-id="${image.id}">Remove</button>
        </div>
    `;
    
    return div;
}

// ===== EVENT LISTENERS SETUP =====

/**
 * Setup All Event Listeners
 * Configures event listeners for the entire application
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    setupSearchFunctionality();
    setupNotesFunctionality();
    setupProjectModalEvents();
    setupSkillsEventListeners();
    setupUpdatesEventListeners();
}

/**
 * Setup Search Functionality
 * Enables real-time project searching
 */
function setupSearchFunctionality() {
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterProjects(e.target.value);
    });
}

/**
 * Setup Notes Functionality
 * Configures note adding and keyboard shortcuts
 */
function setupNotesFunctionality() {
    // Add note button click
    document.getElementById('addNoteBtn').addEventListener('click', addNote);
    
    // Enter key for adding notes
    document.getElementById('noteTextarea').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNote();
        }
    });
    
    // Edit and Remove buttons for projects (delegated)
    document.getElementById('projectsTableContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            e.stopPropagation();
            editProject(e.target.getAttribute('data-project-id'));
        } else if (e.target.classList.contains('btn-remove')) {
            e.stopPropagation();
            removeProject(e.target.getAttribute('data-project-id'));
        }
    });
}

/**
 * Setup Project Modal Events
 * Configures event listeners for project modal
 */
function setupProjectModalEvents() {
    const openBtn = document.getElementById('open-project-btn');
    const overlay = document.getElementById('pjOverlay');
    const cancelBtn = document.getElementById('project-cancel-btn');
    const form = document.getElementById('project-form');
    
    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
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

/**
 * Setup Portfolio Images Event Listeners
 * Configures event listeners for portfolio images functionality
 */
function setupPortfolioImagesEventListeners() {
    console.log('Setting up portfolio images event listeners...');
    
    // Add image button
    const addImageBtn = document.getElementById('addPortfolioImageBtn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openPortfolioImageModal();
        });
    }
    
    // Modal event listeners
    const overlay = document.getElementById('portfolioImageOverlay');
    const cancelBtn = document.getElementById('portfolioImageCancel');
    const form = document.getElementById('portfolio-image-form');
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePortfolioImageModal();
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePortfolioImageModal();
        });
    }
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handlePortfolioImageSubmit(e);
        });
    }
    
    // Image upload functionality
    setupImageUploadEvents();
    
    // Edit and Remove buttons for portfolio images (delegated)
    const container = document.getElementById('portfolioImagesContainer');
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

/**
 * Setup Image Upload Events
 * Configures file upload functionality for portfolio images
 */
function setupImageUploadEvents() {
    const uploadTrigger = document.getElementById('portfolioUploadTrigger');
    const imageInput = document.getElementById('portfolioImageInput');
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
}

// ===== SECTION SWITCHING =====

/**
 * Setup Section Switching
 * Enables navigation between different sections
 */
function setupSectionSwitching() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            switchSection(targetSection);
        });
    });
}

/**
 * Switch Between Sections
 * Hides all sections and shows the target section
 */
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

// ===== PROJECT MODAL FUNCTIONS =====

/**
 * Open Project Modal
 * Opens the modal for adding or editing projects
 */
function openProjectModal(projectId = null) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('pjTitle');
    
    if (!modal) return;
    
    if (projectId) {
        // Edit mode
        editProjectId = projectId;
        const project = projects.find(p => p.id == projectId);
        
        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('pj-name').value = project.name;
            document.getElementById('pj-client').value = project.client;
            document.getElementById('pj-start').value = project.start_date; // Already in YYYY-MM-DD format for input
            document.getElementById('pj-status').value = project.status;
        }
    } else {
        // Add mode
        editProjectId = null;
        title.textContent = 'New Project';
        form.reset();
        // Set today's date as default in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pj-start').value = today;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close Project Modal
 * Closes the project modal and resets state
 */
function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editProjectId = null;
}

/**
 * Handle Project Form Submission
 * Processes project form data for create/update operations
 */
async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('pj-name').value.trim();
    const client = document.getElementById('pj-client').value.trim();
    const start = document.getElementById('pj-start').value;
    const status = document.getElementById('pj-status').value;
    
    if (!name || !client || !start) {
        alert('Please fill all fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editProjectId) {
            // Update existing project
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
            const { error } = await supabaseClient
                .from('projects')
                .insert([{
                    name: name,
                    client: client,
                    start_date: start,
                    status: status
                }]);

            if (error) throw error;
        }
        
        // Reload projects and update UI
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

// ===== PORTFOLIO IMAGE MODAL FUNCTIONS =====

/**
 * Handle Portfolio Image Upload
 * Processes image file upload and shows preview
 */
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

/**
 * Open Portfolio Image Modal
 * Opens modal for adding or editing portfolio images
 */
function openPortfolioImageModal(imageId = null) {
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
        document.getElementById('portfolioImageUrl').value = image.url || '';
        document.getElementById('portfolioImageSize').value = image.size || '';
        document.getElementById('portfolioImageTitleInput').value = image.title || '';
        
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
}

/**
 * Close Portfolio Image Modal
 * Closes the portfolio image modal and resets state
 */
function closePortfolioImageModal() {
    const modal = document.getElementById('portfolio-image-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editPortfolioImageId = null;
    currentPortfolioImageFile = null;
}

/**
 * Handle Portfolio Image Form Submission
 * Processes portfolio image form data for create/update operations
 */
async function handlePortfolioImageSubmit(e) {
    e.preventDefault();
    
    const url = document.getElementById('portfolioImageUrl').value.trim();
    const size = document.getElementById('portfolioImageSize').value.trim();
    const title = document.getElementById('portfolioImageTitleInput').value.trim();
    
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

// ===== CRUD OPERATIONS =====

/**
 * Edit Project
 * Opens project modal in edit mode
 */
function editProject(projectId) {
    openProjectModal(projectId);
}

/**
 * Remove Project
 * Deletes a project and its associated notes
 */
async function removeProject(projectId) {
    if (!confirm('Are you sure you want to remove this project?')) {
        return;
    }
    
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

        // Reload projects and update UI
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

/**
 * Edit Portfolio Image
 * Opens portfolio image modal in edit mode
 */
function editPortfolioImage(imageId) {
    openPortfolioImageModal(imageId);
}

/**
 * Remove Portfolio Image
 * Deletes a portfolio image
 */
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

// ===== NOTES FUNCTIONALITY =====

/**
 * Select Project and Display Notes
 * Shows notes for the selected project
 */
async function selectProject(projectId) {
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

/**
 * Load Notes for a Project
 * Fetches notes for a specific project from Supabase
 */
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

/**
 * Display Notes for Selected Project
 * Renders notes in the notes container
 */
async function displayNotes(projectId) {
    const notesContent = document.getElementById('notesContent');
    notesContent.innerHTML = '<div class="note-item"><p>Loading notes...</p></div>';
    
    const notes = await loadNotes(projectId);
    
    notesContent.innerHTML = '';
    
    if (notes.length === 0) {
        notesContent.innerHTML = '<div class="note-item"><p>No notes available for this project</p></div>';
        return;
    }
    
    // Create and append note elements
    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
            <p>${escapeHtml(note.note_text)}</p>
            <div class="note-date">${formatDisplayDate(note.created_at)}</div> <!-- This will now show DD/MM/YYYY -->
        `;
        notesContent.appendChild(noteItem);
    });
}

/**
 * Add Note to Project
 * Creates a new note for the selected project
 */
async function addNote() {
    const noteTextarea = document.getElementById('noteTextarea');
    const noteText = noteTextarea.value.trim();
    
    if (noteText && selectedProjectId) {
        showLoading();
        
        try {
            const { error } = await supabaseClient
                .from('project_notes')
                .insert([{
                    project_id: selectedProjectId,
                    note_text: noteText
                }]);

            if (error) throw error;

            // Refresh notes display and clear textarea
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

// ===== DATE FORMATTING UTILITIES =====

/**
 * Format Date for Display (DD/MM/YYYY)
 * Converts ISO date string to DD/MM/YYYY format for display
 */
function formatDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        
        // Format as DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'Invalid Date';
    }
}

/**
 * Format Date for Updates Display (DD/MM/YYYY)
 * Special function for updates section
 */
function formatUpdatesDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        
        // Format as DD/MM/YYYY
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formatting updates date:', error, dateString);
        return 'Invalid Date';
    }
}

/**
 * Format Time for Display
 * Converts 24-hour time to 12-hour format with AM/PM
 */
function formatDisplayTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Filter Projects Based on Search Term
 * Filters the projects table in real-time
 */
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

/**
 * Update Status Counts
 * Updates the counter in status boxes based on filtered results
 */
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
                } else if (status === 'pending') {
                    waitingCount++;
                }
            }
        }
    });
    
    // Update counter displays
    document.querySelector('.all-projects .count').textContent = allCount;
    document.querySelector('.pending .count').textContent = pendingCount;
    document.querySelector('.waiting .count').textContent = waitingCount;
    document.querySelector('.completed .count').textContent = completedCount;
}

/**
 * Initialize Projects Table Scroll Functionality
 * Adds scroll indicators for tables with many rows
 */
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

/**
 * Initialize Portfolio Images Scroll Functionality
 * Adds scroll indicators for image containers with many items
 */
function initializePortfolioImagesScroll() {
    const container = document.getElementById('portfolioImagesContainer');
    const showMoreIndicator = document.getElementById('portfolioImagesMore');
    
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

/**
 * Get Status Text from Status Value
 * Converts status codes to human-readable text
 */
function getStatusText(status) {
    const statusMap = {
        'completed': 'Completed',
        'in-process': 'In Process',
        'waiting': 'Pending',
        'planned': 'To Start'
    };
    return statusMap[status] || status;
}

/**
 * Escape HTML Special Characters
 * Prevents XSS attacks by escaping HTML in user input
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ===== SKILLS FUNCTIONALITY =====

/**
 * Initialize Skills
 * Loads skills and sets up event listeners
 */
async function initializeSkills() {
    await loadSkills();
    setupSkillsEventListeners();
}

/**
 * Load Skills from Supabase
 * Fetches all skills from the database
 */
async function loadSkills() {
    try {
        const { data, error } = await supabaseClient
            .from('skills')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        skills = data || [];
        renderSkills();
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

/**
 * Render Skills to DOM
 * Displays skills in grid layout
 */
function renderSkills() {
    const container = document.getElementById('skillsListContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (skills.length === 0) {
        container.innerHTML = `
            <div class="no-skills">
                <i class="fas fa-code"></i>
                <p>No skills added yet. Click "Add Skill" to get started.</p>
            </div>
        `;
        return;
    }

    skills.forEach((skill) => {
        const skillElement = createSkillElement(skill);
        container.appendChild(skillElement);
    });

    initializeSkillsScroll();
}

/**
 * Create Skill Element
 * Generates HTML for a single skill item
 */
function createSkillElement(skill) {
    const div = document.createElement('div');
    div.className = 'skill-grid-item';
    div.setAttribute('data-skill-id', skill.id);
    
    div.innerHTML = `
        <div class="skill-grid-name">${escapeHtml(skill.name)}</div>
        <div class="skill-grid-actions">
            <button class="btn btn-edit btn-sm" data-skill-id="${skill.id}">Edit</button>
            <button class="btn btn-remove btn-sm" data-skill-id="${skill.id}">Remove</button>
        </div>
    `;
    
    return div;
}

/**
 * Setup Skills Event Listeners
 * Configures event listeners for skills functionality
 */
function setupSkillsEventListeners() {
    // Add skill button
    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSkillModal();
        });
    }
    
    // Modal event listeners
    const overlay = document.getElementById('skillOverlay');
    const cancelBtn = document.getElementById('skill-cancel-btn');
    const form = document.getElementById('skill-form');
    
    if (overlay) {
        overlay.addEventListener('click', closeSkillModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeSkillModal);
    }
    
    if (form) {
        form.addEventListener('submit', handleSkillSubmit);
    }
    
    // Edit and Remove buttons (delegated)
    const container = document.getElementById('skillsListContainer');
    if (container) {
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                e.stopPropagation();
                editSkill(e.target.getAttribute('data-skill-id'));
            } else if (e.target.classList.contains('btn-remove')) {
                e.stopPropagation();
                removeSkill(e.target.getAttribute('data-skill-id'));
            }
        });
    }
}

/**
 * Open Skill Modal
 * Opens modal for adding or editing skills
 */
function openSkillModal(skillId = null) {
    const modal = document.getElementById('skill-modal');
    const form = document.getElementById('skill-form');
    const title = document.getElementById('skillTitle');
    
    if (!modal) return;
    
    if (skillId) {
        // Edit mode
        editSkillId = skillId;
        const skill = skills.find(s => s.id == skillId);
        title.textContent = 'Edit Skill';
        document.getElementById('skill-name').value = skill.name || '';
    } else {
        // Add mode
        editSkillId = null;
        title.textContent = 'Add Skill';
        if (form) form.reset();
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close Skill Modal
 * Closes the skill modal and resets state
 */
function closeSkillModal() {
    const modal = document.getElementById('skill-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editSkillId = null;
}

/**
 * Handle Skill Form Submission
 * Processes skill form data for create/update operations
 */
async function handleSkillSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('skill-name').value.trim();
    
    if (!name) {
        alert('Please enter a skill name');
        return;
    }
    
    showLoading();
    
    try {
        if (editSkillId) {
            // Update existing skill
            const { error } = await supabaseClient
                .from('skills')
                .update({
                    name: name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editSkillId);

            if (error) throw error;
        } else {
            // Add new skill
            const { error } = await supabaseClient
                .from('skills')
                .insert([{
                    name: name
                }]);

            if (error) throw error;
        }
        
        // Reload skills
        await loadSkills();
        closeSkillModal();
        
    } catch (error) {
        console.error('Error saving skill:', error);
        alert('Error saving skill: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Edit Skill
 * Opens skill modal in edit mode
 */
function editSkill(skillId) {
    openSkillModal(skillId);
}

/**
 * Remove Skill
 * Deletes a skill
 */
async function removeSkill(skillId) {
    if (!confirm('Are you sure you want to remove this skill?')) {
        return;
    }
    
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('skills')
            .delete()
            .eq('id', skillId);

        if (error) throw error;

        // Reload skills
        await loadSkills();
        
    } catch (error) {
        console.error('Error removing skill:', error);
        alert('Error removing skill: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Initialize Skills Scroll Functionality
 * Adds scroll indicators for skills containers with many items
 */
function initializeSkillsScroll() {
    const container = document.getElementById('skillsListContainer');
    const showMoreIndicator = document.getElementById('skillsMoreIndicator');
    
    if (!container || !showMoreIndicator) return;
    
    const skillItems = container.querySelectorAll('.skill-grid-item');
    
    if (skillItems.length > 6) {
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

// ===== UPDATES FUNCTIONALITY =====

/**
 * Initialize Updates
 * Loads updates and sets up event listeners
 */
async function initializeUpdates() {
    await loadUpdates();
    setupUpdatesEventListeners();
}

/**
 * Load Updates from Supabase
 * Fetches all updates from the database
 */
async function loadUpdates() {
    try {
        const { data, error } = await supabaseClient
            .from('updates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading updates from Supabase:', error);
            // Fallback to sample data if table doesn't exist
            updates = getSampleUpdates();
            renderUpdates();
            return;
        }

        updates = data || [];
        renderUpdates();
    } catch (error) {
        console.error('Error loading updates:', error);
        // Fallback to sample data
        updates = getSampleUpdates();
        renderUpdates();
    }
}

/**
 * Get Sample Updates (Fallback)
 * Provides sample data when Supabase table doesn't exist
 */
function getSampleUpdates() {
    return [
        {
            id: '1',
            title: "Project Design Updated",
            date: new Date().toISOString().split('T')[0],
            time: "14:30",
            icon: "fas fa-edit",
            type: "update"
        },
        {
            id: '2',
            title: "Client Feedback Received",
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            time: "11:45",
            icon: "fas fa-check-circle",
            type: "feedback"
        },
        {
            id: '3',
            title: "Final Delivery Sent",
            date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
            time: "16:20",
            icon: "fas fa-upload",
            type: "delivery"
        }
    ];
}

/**
 * Render Updates to DOM
 * Displays updates in the updates container
 */
function renderUpdates() {
    const container = document.getElementById('updatesContainer');
    if (!container) return;
    
    container.innerHTML = '';

    if (updates.length === 0) {
        container.innerHTML = `
            <div class="no-updates">
                <i class="fas fa-bell-slash"></i>
                <p>No recent updates available. Click "Add Update" to get started.</p>
            </div>
        `;
        return;
    }

    updates.forEach((update) => {
        const updateElement = createUpdateElement(update);
        container.appendChild(updateElement);
    });

    setupUpdatesScroll();
}

/**
 * Create Update Element
 * Generates HTML for a single update item
 */
function createUpdateElement(update) {
    const div = document.createElement('div');
    div.className = 'update-item';
    div.setAttribute('data-update-id', update.id);
    
    // Format date and time for display - using DD/MM/YYYY format
    const displayDate = formatUpdatesDisplayDate(update.date); // Changed to use new function
    const displayTime = formatDisplayTime(update.time);
    
    div.innerHTML = `
        <div class="update-icon">
            <i class="${update.icon}"></i>
        </div>
        <div class="update-content">
            <h4 class="update-title">${escapeHtml(update.title)}</h4>
            <div class="update-details">
                <span class="update-date">${displayDate}</span> <!-- This will now show DD/MM/YYYY -->
                <span class="update-time">${displayTime}</span>
            </div>
        </div>
        <div class="update-actions">
            <button class="update-action-btn update-edit-btn" data-update-id="${update.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="update-action-btn update-delete-btn" data-update-id="${update.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

/**
 * Setup Updates Event Listeners
 * Configures event listeners for updates functionality
 */
function setupUpdatesEventListeners() {
    // Add update button
    const addUpdateBtn = document.getElementById('add-update-btn');
    if (addUpdateBtn) {
        addUpdateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openUpdateModal();
        });
    }
    
    // Modal event listeners
    const overlay = document.getElementById('updateOverlay');
    const cancelBtn = document.getElementById('update-cancel-btn');
    const form = document.getElementById('update-form');
    
    if (overlay) {
        overlay.addEventListener('click', closeUpdateModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeUpdateModal);
    }
    
    if (form) {
        form.addEventListener('submit', handleUpdateSubmit);
    }
    
    // Edit and Delete buttons (delegated)
    const container = document.getElementById('updatesContainer');
    if (container) {
        container.addEventListener('click', function(e) {
            const updateId = e.target.closest('.update-action-btn')?.getAttribute('data-update-id');
            if (!updateId) return;
            
            if (e.target.closest('.update-edit-btn')) {
                e.stopPropagation();
                editUpdate(updateId);
            } else if (e.target.closest('.update-delete-btn')) {
                e.stopPropagation();
                removeUpdate(updateId);
            }
        });
    }
}

/**
 * Open Update Modal
 * Opens modal for adding or editing updates
 */
function openUpdateModal(updateId = null) {
    const modal = document.getElementById('update-modal');
    const form = document.getElementById('update-form');
    const title = document.getElementById('updateTitle');
    
    if (!modal) {
        console.error('Update modal not found!');
        return;
    }
    
    // Set today's date and current time as default
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    if (updateId) {
        // Edit mode
        console.log('Opening edit modal for update ID:', updateId);
        editUpdateId = updateId;
        const update = updates.find(u => u.id == updateId);
        
        if (!update) {
            console.error('Update not found with ID:', updateId);
            return;
        }
        
        title.textContent = 'Edit Update';
        document.getElementById('update-title').value = update.title || '';
        document.getElementById('update-date').value = update.date || today;
        document.getElementById('update-time').value = update.time || now;
        document.getElementById('update-icon').value = update.icon || 'fas fa-edit';
        document.getElementById('update-type').value = update.type || 'update';
    } else {
        // Add mode
        console.log('Opening add modal for new update');
        editUpdateId = null;
        title.textContent = 'Add Update';
        if (form) form.reset();
        document.getElementById('update-date').value = today;
        document.getElementById('update-time').value = now;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close Update Modal
 * Closes the update modal and resets state
 */
function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editUpdateId = null;
}

/**
 * Handle Update Form Submission
 * Processes update form data for create/update operations
 */
async function handleUpdateSubmit(e) {
    e.preventDefault();
    console.log('Handling update form submission...');
    
    const title = document.getElementById('update-title').value.trim();
    const date = document.getElementById('update-date').value;
    const time = document.getElementById('update-time').value;
    const icon = document.getElementById('update-icon').value;
    const type = document.getElementById('update-type').value;
    
    if (!title || !date || !time) {
        alert('Please fill all required fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editUpdateId) {
            // Update existing update
            console.log('Updating existing update with ID:', editUpdateId);
            
            // Build update data - removed updated_at field
            const updateData = {
                title: title,
                date: date,
                time: time,
                icon: icon,
                type: type
            };
            
            console.log('Update data:', updateData);
            
            const { data, error } = await supabaseClient
                .from('updates')
                .update(updateData)
                .eq('id', editUpdateId)
                .select();

            if (error) {
                console.error('Supabase update error:', error);
                throw error;
            }
            
            console.log('Update successful, returned data:', data);
            
        } else {
            // Add new update
            console.log('Adding new update');
            
            const newUpdate = {
                title: title,
                date: date,
                time: time,
                icon: icon,
                type: type
            };
            
            console.log('New update data:', newUpdate);
            
            const { data, error } = await supabaseClient
                .from('updates')
                .insert([newUpdate])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }
            
            console.log('Insert successful, returned data:', data);
        }
        
        // Reload updates to reflect changes
        await loadUpdates();
        closeUpdateModal();
        
    } catch (error) {
        console.error('Error saving update:', error);
        
        // Specific error handling for schema issues
        if (error.message && error.message.includes('does not exist')) {
            console.log('Updates table or column does not exist');
            alert('Database configuration issue. Please check your Supabase setup.');
        } else {
            alert('Error saving update: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

/**
 * Edit Update
 * Opens update modal in edit mode
 */
function editUpdate(updateId) {
    console.log('Edit update called with ID:', updateId);
    openUpdateModal(updateId);
}

/**
 * Remove Update
 * Deletes an update
 */
async function removeUpdate(updateId) {
    if (!confirm('Are you sure you want to delete this update?')) {
        return;
    }
    
    showLoading();
    
    try {
        console.log('Deleting update with ID:', updateId);
        
        const { error } = await supabaseClient
            .from('updates')
            .delete()
            .eq('id', updateId);

        if (error) {
            console.error('Supabase delete error:', error);
            throw error;
        }

        // Reload updates
        await loadUpdates();
        
    } catch (error) {
        console.error('Error deleting update:', error);
        
        // Check if it's a Supabase table doesn't exist error
        if (error.message && error.message.includes('does not exist')) {
            console.log('Updates table does not exist, using local fallback');
            // Remove from local array
            updates = updates.filter(update => update.id !== updateId);
            renderUpdates();
        } else {
            alert('Error deleting update: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

/**
 * Setup Updates Scroll Functionality
 * Adds scroll indicators for updates containers with many items
 */
function setupUpdatesScroll() {
    const container = document.getElementById('updatesContainer');
    const showMoreIndicator = document.getElementById('updatesMoreIndicator');
    
    if (!container || !showMoreIndicator) return;
    
    const updateItems = container.querySelectorAll('.update-item');
    
    if (updateItems.length > 3) {
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

// =============================================
// END OF CRM DASHBOARD JAVASCRIPT
// =============================================