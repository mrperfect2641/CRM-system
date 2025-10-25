// =============================================
// CRM DASHBOARD - MAIN JAVASCRIPT FILE
// =============================================

// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://kqaqnhbdqnflbpjhrazq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXFuaGJkcW5mbGJwamhyYXpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMTIyMTksImV4cCI6MjA3NTY4ODIxOX0.5tAfWDw2gnkrgICmOr0ZQ8EiPG3aLMQ5TxuCuBUI5sU';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== GLOBAL VARIABLES =====
let projects = [];
let portfolioImages = [];
let skills = [];
let updates = [];
let todos = [];
let urgentItems = [];
let deadlines = [];
let clients = [];
let selectedProjectId = null;
let editProjectId = null;
let editPortfolioImageId = null;
let editSkillId = null;
let editUpdateId = null;
let editTodoId = null;
let editUrgentId = null;
let editDeadlineId = null;
let editClientId = null;
let currentPortfolioImageFile = null;

// Custom Analytics Fields
let customAnalyticsFields = [];
let editingFieldId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing CRM Dashboard...');
    initializeApp();
});

/**
 * Initialize the entire application
 */
async function initializeApp() {
    showLoading();
    
    // Load local data first for fallback
    loadImportantInfoFromLocalStorage();
    
    await Promise.all([
        loadProjects(),
        initializePortfolioImages(),
        initializeSkills(),
        initializeUpdates(),
        initializeTodoList(),
        initializePortfolioAnalytics(),
        initializeImportantInfo(),
        initializeCustomAnalyticsFields(),
        initializeConnections() // Add custom fields
    ]);
    
    updateStatusCounts();
    initializeProjectsTableScroll();
    setupEventListeners();
    setupSectionSwitching();
    
    hideLoading();
}

// ===== LOADING FUNCTIONS =====
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// ===== FREELANCE PROJECTS FUNCTIONS =====

/**
 * Load projects from Supabase database
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
 * Initialize projects table with loaded data
 */
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
            <td>${escapeHtml(project.name)}</td>
            <td>${escapeHtml(project.client)}</td>
            <td>${formatDisplayDate(project.start_date)}</td>
            <td><span class="status ${project.status}">${getStatusText(project.status)}</span></td>
            <td class="actions">
                <button class="btn btn-edit" data-project-id="${project.id}">Edit</button>
                <button class="btn btn-remove" data-project-id="${project.id}">Remove</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    setupProjectRowClickEvents();
}

/**
 * Setup click events for project table rows
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
 * Initialize portfolio images functionality
 */
async function initializePortfolioImages() {
    await loadPortfolioImages();
    setupPortfolioImagesEventListeners();
}

/**
 * Load portfolio images from Supabase
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
 * Render portfolio images to the container
 */
function renderPortfolioImages() {
    const container = document.getElementById('portfolioImagesContainer');
    if (!container) return;
    
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

    portfolioImages.forEach((image) => {
        const imageElement = createPortfolioImageElement(image);
        container.appendChild(imageElement);
    });

    initializePortfolioImagesScroll();
}

/**
 * Create HTML element for portfolio image
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
 * Setup all event listeners for the application
 */
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    setupSearchFunctionality();
    setupNotesFunctionality();
    setupProjectModalEvents();
    setupSkillsEventListeners();
    setupUpdatesEventListeners();
    setupPortfolioImagesEventListeners();
}

/**
 * Setup search functionality
 */
function setupSearchFunctionality() {
    document.getElementById('searchInput').addEventListener('input', function(e) {
        filterProjects(e.target.value);
    });
}

/**
 * Setup notes functionality
 */
function setupNotesFunctionality() {
    document.getElementById('addNoteBtn').addEventListener('click', addNote);
    
    document.getElementById('noteTextarea').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addNote();
        }
    });
    
    document.getElementById('projectsTableContainer').addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-edit')) {
            e.stopPropagation();
            editProject(e.target.getAttribute('data-project-id'));
        } else if (e.target.classList.contains('btn-remove')) {
            e.stopPropagation();
            e.preventDefault();
            const projectId = e.target.getAttribute('data-project-id');
            if (confirm('Are you sure you want to remove this project?')) {
                removeProject(projectId);
            }
        }
    });
}

/**
 * Setup project modal events
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
 * Setup portfolio images event listeners
 */
function setupPortfolioImagesEventListeners() {
    console.log('Setting up portfolio images event listeners...');
    
    const addImageBtn = document.getElementById('addPortfolioImageBtn');
    if (addImageBtn) {
        // Remove existing listeners and add fresh one
        addImageBtn.replaceWith(addImageBtn.cloneNode(true));
        document.getElementById('addPortfolioImageBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openPortfolioImageModal();
        });
    }
    
    const overlay = document.getElementById('portfolioImageOverlay');
    const cancelBtn = document.getElementById('portfolioImageCancel');
    const form = document.getElementById('portfolio-image-form');
    
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                e.preventDefault();
                e.stopPropagation();
                closePortfolioImageModal();
            }
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
    
    setupImageUploadEvents();
    
    // Fix: Use event delegation with proper event stopping
    const container = document.getElementById('portfolioImagesContainer');
    if (container) {
        // Remove any existing event listeners
        container.replaceWith(container.cloneNode(true));
        const freshContainer = document.getElementById('portfolioImagesContainer');
        
        freshContainer.addEventListener('click', function(e) {
            const target = e.target;
            const removeBtn = target.closest('.btn-remove');
            
            if (removeBtn) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Important: Stop all propagation
                
                const imageId = removeBtn.getAttribute('data-image-id') || 
                               removeBtn.closest('[data-image-id]')?.getAttribute('data-image-id');
                
                if (imageId && confirm('Are you sure you want to remove this portfolio image?')) {
                    removePortfolioImage(imageId);
                }
                return; // Stop further processing
            }
            
            const editBtn = target.closest('.btn-edit');
            if (editBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const imageId = editBtn.getAttribute('data-image-id') || 
                               editBtn.closest('[data-image-id]')?.getAttribute('data-image-id');
                
                if (imageId) {
                    editPortfolioImage(imageId);
                }
            }
        });
    }
}
/**
 * Setup image upload events
 */
function setupImageUploadEvents() {
    const uploadTrigger = document.getElementById('portfolioUploadTrigger');
    const imageInput = document.getElementById('portfolioImageInput');
    const imagePreview = document.getElementById('portfolioImagePreview');
    
    // Remove any existing event listeners first
    if (uploadTrigger) {
        uploadTrigger.replaceWith(uploadTrigger.cloneNode(true));
    }
    if (imageInput) {
        imageInput.replaceWith(imageInput.cloneNode(true));
    }
    if (imagePreview) {
        imagePreview.replaceWith(imagePreview.cloneNode(true));
    }
    
    // Get fresh references after cloning
    const freshUploadTrigger = document.getElementById('portfolioUploadTrigger');
    const freshImageInput = document.getElementById('portfolioImageInput');
    const freshImagePreview = document.getElementById('portfolioImagePreview');
    
    if (freshUploadTrigger) {
        freshUploadTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (freshImageInput) freshImageInput.click();
        });
    }
    
    if (freshImageInput) {
        freshImageInput.addEventListener('change', handlePortfolioImageUpload);
    }
    
    if (freshImagePreview) {
        freshImagePreview.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (freshImageInput) freshImageInput.click();
        });
    }
}

// ===== SECTION SWITCHING =====

/**
 * Setup section switching functionality
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
 * Switch between main sections
 */
function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionName}-section`);
    const targetNavItem = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
    
    if (targetSection && targetNavItem) {
        targetSection.classList.remove('hidden');
        targetNavItem.classList.add('active');
        
        // Refresh data when switching to Important Info section
        if (sectionName === 'info') {
            loadProjectOverview();
        }
    }
}

// ===== PROJECT MODAL FUNCTIONS =====

/**
 * Open project modal for adding/editing
 */
function openProjectModal(projectId = null) {
    const modal = document.getElementById('project-modal');
    const form = document.getElementById('project-form');
    const title = document.getElementById('pjTitle');
    
    if (!modal) return;
    
    if (projectId) {
        editProjectId = projectId;
        const project = projects.find(p => p.id == projectId);
        
        if (project) {
            title.textContent = 'Edit Project';
            document.getElementById('pj-name').value = project.name;
            document.getElementById('pj-client').value = project.client;
            document.getElementById('pj-start').value = project.start_date;
            document.getElementById('pj-status').value = project.status;
        }
    } else {
        editProjectId = null;
        title.textContent = 'New Project';
        form.reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('pj-start').value = today;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close project modal
 */
function closeProjectModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editProjectId = null;
}

/**
 * Handle project form submission
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
            const { data, error } = await supabaseClient
                .from('projects')
                .insert([{
                    name: name,
                    client: client,
                    start_date: start,
                    status: status
                }])
                .select();

            if (error) throw error;
        }
        
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
 * Handle portfolio image upload
 */
function handlePortfolioImageUpload(e) {
    console.log('Image upload triggered');
    
    // Prevent multiple triggers
    e.preventDefault();
    e.stopPropagation();
    
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
    
    // Reset the input to allow selecting the same file again
    e.target.value = '';
}

/**
 * Open portfolio image modal
 */
function openPortfolioImageModal(imageId = null) {
    const modal = document.getElementById('portfolio-image-modal');
    const form = document.getElementById('portfolio-image-form');
    const title = document.getElementById('portfolioImageTitle');
    
    if (!modal) {
        console.error('Portfolio image modal element not found!');
        return;
    }
    
    // Setup upload events when modal opens
    setupImageUploadEvents();
    
    if (imageId) {
        editPortfolioImageId = imageId;
        const image = portfolioImages.find(img => img.id == imageId);
        title.textContent = 'Edit Portfolio Image';
        document.getElementById('portfolioImageUrl').value = image.url || '';
        document.getElementById('portfolioImageSize').value = image.size || '';
        document.getElementById('portfolioImageTitleInput').value = image.title || '';
        
        const preview = document.getElementById('portfolioImagePreview');
        if (image.image_url) {
            preview.innerHTML = `<img src="${image.image_url}" alt="Preview">`;
            preview.classList.add('has-image');
        } else {
            preview.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Click to upload image</span>';
            preview.classList.remove('has-image');
        }
    } else {
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
 * Close portfolio image modal
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
 * Handle portfolio image form submission
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
        
        // Handle image upload properly
        if (currentPortfolioImageFile) {
            const fileName = `${Date.now()}-${currentPortfolioImageFile.name}`;
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('portfolio-images')
                .upload(fileName, currentPortfolioImageFile);
                
            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw uploadError;
            }
            
            const { data: urlData } = supabaseClient.storage
                .from('portfolio-images')
                .getPublicUrl(fileName);
                
            imageUrl = urlData.publicUrl;
        }
        
        if (editPortfolioImageId) {
            const updateData = {
                url: url,
                size: size,
                title: title,
                updated_at: new Date().toISOString()
            };
            
            // Only update image_url if a new file was uploaded
            if (currentPortfolioImageFile) {
                updateData.image_url = imageUrl;
            }
            
            const { error } = await supabaseClient
                .from('portfolio_images')
                .update(updateData)
                .eq('id', editPortfolioImageId);

            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient
                .from('portfolio_images')
                .insert([{
                    url: url,
                    size: size,
                    title: title,
                    image_url: imageUrl
                }])
                .select();

            if (error) throw error;
        }
        
        await loadPortfolioImages();
        closePortfolioImageModal();
        
    } catch (error) {
        console.error('Error saving portfolio image:', error);
        
        // Provide more specific error messages
        if (error.message && error.message.includes('does not exist')) {
            alert('Portfolio images table does not exist. Please create the table in Supabase first.');
        } else if (error.message && error.message.includes('storage')) {
            alert('Error uploading image to storage. Please check your storage configuration.');
        } else {
            alert('Error saving image: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

// ===== CRUD OPERATIONS =====

/**
 * Edit project
 */
function editProject(projectId) {
    openProjectModal(projectId);
}

/**
 * Remove project
 */
async function removeProject(projectId) {
    showLoading();
    
    try {
        // Only delete project notes if they exist
        try {
            const { error: notesError } = await supabaseClient
                .from('project_notes')
                .delete()
                .eq('project_id', projectId);

            if (notesError && !notesError.message.includes('does not exist')) {
                throw notesError;
            }
        } catch (notesError) {
            console.log('Project notes table might not exist, continuing...');
        }

        const { error: projectError } = await supabaseClient
            .from('projects')
            .delete()
            .eq('id', projectId);

        if (projectError) throw projectError;

        await loadProjects();
        updateStatusCounts();
        
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
 * Edit portfolio image
 */
function editPortfolioImage(imageId) {
    openPortfolioImageModal(imageId);
}

/**
 * Remove portfolio image
 */
async function removePortfolioImage(imageId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('portfolio_images')
            .delete()
            .eq('id', imageId);

        if (error) throw error;

        await loadPortfolioImages();
        
    } catch (error) {
        console.error('Error removing portfolio image:', error);
        
        // Handle case where table doesn't exist
        if (error.message && error.message.includes('does not exist')) {
            // Remove from local array
            portfolioImages = portfolioImages.filter(img => img.id !== imageId);
            renderPortfolioImages();
            alert('Portfolio image removed locally (table does not exist in database).');
        } else {
            alert('Error removing image: ' + error.message);
        }
    } finally {
        hideLoading();
    }
}

// ===== NOTES FUNCTIONALITY =====

/**
 * Select project and display notes
 */
async function selectProject(projectId) {
    document.querySelectorAll('.projects-table-container tbody tr').forEach(r => {
        r.classList.remove('active');
    });
    
    const selectedRow = document.querySelector(`tr[data-project-id="${projectId}"]`);
    if (selectedRow) {
        selectedRow.classList.add('active');
    }
    
    selectedProjectId = projectId;
    await displayNotes(projectId);
}

/**
 * Load notes for a project
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
 * Display notes for selected project
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
    
    notes.forEach(note => {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.innerHTML = `
            <p>${escapeHtml(note.note_text)}</p>
            <div class="note-date">${formatDisplayDate(note.created_at)}</div>
        `;
        notesContent.appendChild(noteItem);
    });
}

/**
 * Add note to selected project
 */
async function addNote() {
    const noteTextarea = document.getElementById('noteTextarea');
    const noteText = noteTextarea.value.trim();
    
    if (noteText && selectedProjectId) {
        showLoading();
        
        try {
            const { data, error } = await supabaseClient
                .from('project_notes')
                .insert([{
                    project_id: selectedProjectId,
                    note_text: noteText
                }])
                .select();

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

// ===== DATE FORMATTING UTILITIES =====

/**
 * Format date for display
 */
function formatDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
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
 * Format updates date for display
 */
function formatUpdatesDisplayDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
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
 * Format time for display
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
 * Filter projects based on search term
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
 * Update status counts in status boxes
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
    
    document.querySelector('.all-projects .count').textContent = allCount;
    document.querySelector('.pending .count').textContent = pendingCount;
    document.querySelector('.waiting .count').textContent = waitingCount;
    document.querySelector('.completed .count').textContent = completedCount;
}

/**
 * Initialize projects table scroll functionality
 */
function initializeProjectsTableScroll() {
    const tableContainer = document.getElementById('projectsTableContainer');
    const showMoreIndicator = document.getElementById('showMoreIndicator');
    
    if (!tableContainer || !showMoreIndicator) return;
    
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
 * Initialize portfolio images scroll functionality
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
 * Get status text from status code
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
 * Escape HTML to prevent XSS
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
 * Initialize skills functionality
 */
async function initializeSkills() {
    await loadSkills();
    setupSkillsEventListeners();
}

/**
 * Load skills from Supabase
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
 * Render skills to the container
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
 * Create HTML element for skill
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
 * Setup skills event listeners
 */
function setupSkillsEventListeners() {
    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openSkillModal();
        });
    }
    
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
    
    // Fix: Skills container with proper event handling
    const container = document.getElementById('skillsListContainer');
    if (container) {
        // Remove existing listeners
        container.replaceWith(container.cloneNode(true));
        const freshContainer = document.getElementById('skillsListContainer');
        
        freshContainer.addEventListener('click', function(e) {
            const target = e.target;
            const removeBtn = target.closest('.btn-remove');
            
            if (removeBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const skillId = removeBtn.getAttribute('data-skill-id');
                if (skillId && confirm('Are you sure you want to remove this skill?')) {
                    removeSkill(skillId);
                }
                return;
            }
            
            const editBtn = target.closest('.btn-edit');
            if (editBtn) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const skillId = editBtn.getAttribute('data-skill-id');
                if (skillId) {
                    editSkill(skillId);
                }
            }
        });
    }
}

/**
 * Open skill modal
 */
function openSkillModal(skillId = null) {
    const modal = document.getElementById('skill-modal');
    const form = document.getElementById('skill-form');
    const title = document.getElementById('skillTitle');
    
    if (!modal) return;
    
    if (skillId) {
        editSkillId = skillId;
        const skill = skills.find(s => s.id == skillId);
        title.textContent = 'Edit Skill';
        document.getElementById('skill-name').value = skill.name || '';
    } else {
        editSkillId = null;
        title.textContent = 'Add Skill';
        if (form) form.reset();
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close skill modal
 */
function closeSkillModal() {
    const modal = document.getElementById('skill-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editSkillId = null;
}

/**
 * Handle skill form submission
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
            const { error } = await supabaseClient
                .from('skills')
                .update({
                    name: name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editSkillId);

            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient
                .from('skills')
                .insert([{
                    name: name
                }])
                .select();

            if (error) throw error;
        }
        
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
 * Edit skill
 */
function editSkill(skillId) {
    openSkillModal(skillId);
}

/**
 * Remove skill
 */
async function removeSkill(skillId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('skills')
            .delete()
            .eq('id', skillId);

        if (error) throw error;

        await loadSkills();
        
    } catch (error) {
        console.error('Error removing skill:', error);
        alert('Error removing skill: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Initialize skills scroll functionality
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
 * Initialize updates functionality
 */
async function initializeUpdates() {
    await loadUpdates();
    setupUpdatesEventListeners();
}

/**
 * Load updates from Supabase
 */
async function loadUpdates() {
    try {
        const { data, error } = await supabaseClient
            .from('updates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading updates from Supabase:', error);
            updates = getSampleUpdates();
            renderUpdates();
            return;
        }

        updates = data || [];
        renderUpdates();
    } catch (error) {
        console.error('Error loading updates:', error);
        updates = getSampleUpdates();
        renderUpdates();
    }
}

/**
 * Get sample updates for fallback
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
        }
    ];
}

/**
 * Render updates to the container
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
 * Create HTML element for update
 */
function createUpdateElement(update) {
    const div = document.createElement('div');
    div.className = 'update-item';
    div.setAttribute('data-update-id', update.id);
    
    const displayDate = formatUpdatesDisplayDate(update.date);
    const displayTime = formatDisplayTime(update.time);
    
    div.innerHTML = `
        <div class="update-icon">
            <i class="${update.icon}"></i>
        </div>
        <div class="update-content">
            <h4 class="update-title">${escapeHtml(update.title)}</h4>
            <div class="update-details">
                <span class="update-date">${displayDate}</span>
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
 * Setup updates event listeners
 */
function setupUpdatesEventListeners() {
    const addUpdateBtn = document.getElementById('add-update-btn');
    if (addUpdateBtn) {
        addUpdateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openUpdateModal();
        });
    }
    
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
    
    const container = document.getElementById('updatesContainer');
    if (container) {
        container.addEventListener('click', function(e) {
            const updateId = e.target.closest('.update-action-btn')?.getAttribute('data-update-id');
            if (!updateId) return;
            
            if (e.target.closest('.update-edit-btn')) {
                e.stopPropagation();
                editUpdate(updateId);
            } else if (e.target.closest('.update-delete-btn')) {
                e.stopImmediatePropagation();
                if (confirm('Are you sure you want to delete this update?')) {
                    removeUpdate(updateId);
                }
            }
        });
    }
}

/**
 * Open update modal
 */
function openUpdateModal(updateId = null) {
    const modal = document.getElementById('update-modal');
    const form = document.getElementById('update-form');
    const title = document.getElementById('updateTitle');
    
    if (!modal) {
        console.error('Update modal not found!');
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    if (updateId) {
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
 * Close update modal
 */
function closeUpdateModal() {
    const modal = document.getElementById('update-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editUpdateId = null;
}

/**
 * Handle update form submission
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
            console.log('Updating existing update with ID:', editUpdateId);
            
            const updateData = {
                title: title,
                date: date,
                time: time,
                icon: icon,
                type: type,
                updated_at: new Date().toISOString()
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
        
        await loadUpdates();
        closeUpdateModal();
        
    } catch (error) {
        console.error('Error saving update:', error);
        
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
 * Edit update
 */
function editUpdate(updateId) {
    console.log('Edit update called with ID:', updateId);
    openUpdateModal(updateId);
}

/**
 * Remove update
 */
async function removeUpdate(updateId) {
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

        await loadUpdates();
        
    } catch (error) {
        console.error('Error deleting update:', error);
        
        if (error.message && error.message.includes('does not exist')) {
            console.log('Updates table does not exist, using local fallback');
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
 * Setup updates scroll functionality
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

// ===== TO-DO LIST FUNCTIONALITY =====

/**
 * Initialize To-Do List
 */
async function initializeTodoList() {
    await loadTodos();
    setupTodoEventListeners();
}

/**
 * Load To-Dos from Supabase
 */
async function loadTodos() {
    try {
        const { data, error } = await supabaseClient
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading todos from Supabase:', error);
            loadTodosFromLocalStorage();
            return;
        }

        todos = data || [];
        renderTodos();
    } catch (error) {
        console.error('Error loading todos:', error);
        loadTodosFromLocalStorage();
    }
}

/**
 * Load To-Dos from Local Storage (Fallback)
 */
function loadTodosFromLocalStorage() {
    try {
        const savedTodos = localStorage.getItem('crm_todos');
        if (savedTodos) {
            todos = JSON.parse(savedTodos);
        }
        renderTodos();
    } catch (error) {
        console.error('Error loading todos from local storage:', error);
        todos = [];
    }
}

/**
 * Save To-Dos to Supabase
 */
async function saveTodos() {
    try {
        if (todos.length > 0) {
            console.log('Saving todos to Supabase...');
        }
        
        localStorage.setItem('crm_todos', JSON.stringify(todos));
    } catch (error) {
        console.error('Error saving todos:', error);
        localStorage.setItem('crm_todos', JSON.stringify(todos));
    }
}

/**
 * Setup To-Do Event Listeners
 */
function setupTodoEventListeners() {
    const addTodoBtn = document.getElementById('add-todo-btn');
    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', showTodoInput);
    }

    const saveTodoBtn = document.getElementById('save-todo-btn');
    if (saveTodoBtn) {
        saveTodoBtn.addEventListener('click', addTodo);
    }

    const cancelTodoBtn = document.getElementById('cancel-todo-btn');
    if (cancelTodoBtn) {
        cancelTodoBtn.addEventListener('click', hideTodoInput);
    }

    const todoInput = document.getElementById('todoInput');
    if (todoInput) {
        todoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }

    const todoListContainer = document.getElementById('todoListContainer');
    if (todoListContainer) {
        todoListContainer.addEventListener('click', handleTodoActions);
    }
}

/**
 * Show To-Do Input
 */
function showTodoInput() {
    const inputContainer = document.getElementById('todoInputContainer');
    const todoInput = document.getElementById('todoInput');
    
    if (inputContainer && todoInput) {
        inputContainer.style.display = 'block';
        todoInput.focus();
        todoInput.value = '';
        editTodoId = null;
    }
}

/**
 * Hide To-Do Input
 */
function hideTodoInput() {
    const inputContainer = document.getElementById('todoInputContainer');
    const todoInput = document.getElementById('todoInput');
    
    if (inputContainer && todoInput) {
        inputContainer.style.display = 'none';
        todoInput.value = '';
        editTodoId = null;
    }
}

/**
 * Add New To-Do
 */
async function addTodo() {
    const todoInput = document.getElementById('todoInput');
    const text = todoInput?.value.trim();

    if (!text) {
        alert('Please enter a task description');
        return;
    }

    try {
        if (editTodoId) {
            const todoIndex = todos.findIndex(todo => todo.id === editTodoId);
            if (todoIndex !== -1) {
                todos[todoIndex].text = text;
                todos[todoIndex].updated_at = new Date().toISOString();
                
                try {
                    const { error } = await supabaseClient
                        .from('todos')
                        .update({
                            text: text,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', editTodoId);

                    if (error) throw error;
                } catch (supabaseError) {
                    console.log('Failed to update todo in Supabase, using local storage:', supabaseError);
                }
            }
        } else {
            const newTodo = {
                id: generateTodoId(),
                text: text,
                completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            try {
                const { data, error } = await supabaseClient
                    .from('todos')
                    .insert([{
                        text: text,
                        completed: false
                    }])
                    .select();

                if (error) throw error;
                
                if (data && data[0]) {
                    newTodo.id = data[0].id;
                }
            } catch (supabaseError) {
                console.log('Failed to save todo to Supabase, using local storage:', supabaseError);
            }
            
            todos.unshift(newTodo);
        }

        await saveTodos();
        renderTodos();
        hideTodoInput();
        
    } catch (error) {
        console.error('Error saving todo:', error);
        alert('Error saving task: ' + error.message);
    }
}

/**
 * Generate Unique To-Do ID
 */
function generateTodoId() {
    return 'local_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Render To-Dos
 */
function renderTodos() {
    const container = document.getElementById('todoListContainer');
    const noTodosMessage = document.getElementById('noTodosMessage');
    
    if (!container) return;

    if (todos.length === 0) {
        container.innerHTML = `
            <div class="no-todos" id="noTodosMessage">
                <i class="fas fa-clipboard-list"></i>
                <p>No tasks yet. Add your first task to get started!</p>
            </div>
        `;
        updateTodoStats();
        return;
    }

    if (noTodosMessage) {
        noTodosMessage.style.display = 'none';
    }

    container.innerHTML = '';
    
    todos.forEach(todo => {
        const todoElement = createTodoElement(todo);
        container.appendChild(todoElement);
    });
    
    updateTodoStats();
}

/**
 * Create To-Do Element
 */
function createTodoElement(todo) {
    const div = document.createElement('div');
    div.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    div.setAttribute('data-todo-id', todo.id);

    div.innerHTML = `
        <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-action="toggle"></div>
        <div class="todo-text">${escapeHtml(todo.text)}</div>
        <div class="todo-actions">
            <button class="todo-action-btn todo-edit-btn" data-action="edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="todo-action-btn todo-delete-btn" data-action="delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return div;
}

/**
 * Handle To-Do Actions
 */
function handleTodoActions(e) {
    const todoItem = e.target.closest('.todo-item');
    if (!todoItem) return;

    const todoId = todoItem.getAttribute('data-todo-id');
    const action = e.target.closest('[data-action]')?.getAttribute('data-action');

    if (!action || !todoId) return;

    switch (action) {
        case 'toggle':
            toggleTodoCompletion(todoId);
            break;
        case 'edit':
            editTodo(todoId);
            break;
        case 'delete':
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTodo(todoId);
            }
            break;
    }
}

/**
 * Toggle To-Do Completion
 */
async function toggleTodoCompletion(todoId) {
    const todoIndex = todos.findIndex(todo => todo.id === todoId);
    if (todoIndex !== -1) {
        todos[todoIndex].completed = !todos[todoIndex].completed;
        todos[todoIndex].updated_at = new Date().toISOString();
        
        try {
            const { error } = await supabaseClient
                .from('todos')
                .update({
                    completed: todos[todoIndex].completed,
                    updated_at: new Date().toISOString()
                })
                .eq('id', todoId);

            if (error) throw error;
        } catch (supabaseError) {
            console.log('Failed to update todo completion in Supabase, using local storage:', supabaseError);
        }
        
        await saveTodos();
        renderTodos();
    }
}

/**
 * Edit To-Do
 */
function editTodo(todoId) {
    const todo = todos.find(todo => todo.id === todoId);
    if (!todo) return;

    const inputContainer = document.getElementById('todoInputContainer');
    const todoInput = document.getElementById('todoInput');
    
    if (inputContainer && todoInput) {
        inputContainer.style.display = 'block';
        todoInput.value = todo.text;
        todoInput.focus();
        editTodoId = todoId;
    }
}

/**
 * Delete To-Do
 */
async function deleteTodo(todoId) {
    try {
        const { error } = await supabaseClient
            .from('todos')
            .delete()
            .eq('id', todoId);

        if (error) throw error;
    } catch (supabaseError) {
        console.log('Failed to delete todo from Supabase, using local storage:', supabaseError);
    }

    todos = todos.filter(todo => todo.id !== todoId);
    await saveTodos();
    renderTodos();
}

/**
 * Get Todo Statistics
 */
function getTodoStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;

    return {
        total,
        completed,
        pending
    };
}

/**
 * Update To-Do Statistics
 */
function updateTodoStats() {
    const stats = getTodoStats();
    const statsContainer = document.getElementById('todoStats');
    const totalTasks = document.getElementById('totalTasks');
    const completedTasks = document.getElementById('completedTasks');
    const pendingTasks = document.getElementById('pendingTasks');
    
    if (statsContainer && totalTasks && completedTasks && pendingTasks) {
        if (stats.total > 0) {
            statsContainer.style.display = 'flex';
            totalTasks.textContent = stats.total;
            completedTasks.textContent = stats.completed;
            pendingTasks.textContent = stats.pending;
        } else {
            statsContainer.style.display = 'none';
        }
    }
}

// ===== PORTFOLIO ANALYTICS FUNCTIONS =====

/**
 * Load portfolio analytics data
 */
async function loadPortfolioAnalyticsData() {
    try {
        const { data, error } = await supabaseClient
            .from('portfolio_visits')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return [];
        return data || [];
    } catch (error) {
        return [];
    }
}

/**
 * Update portfolio statistics
 */
function updatePortfolioStats(visits) {
    const totalVisits = visits.length;
    const uniqueVisitors = new Set(visits.map(v => v.ip_address)).size;
    const today = new Date().toDateString();
    const todayVisits = visits.filter(v => new Date(v.created_at).toDateString() === today).length;
    const liveVisits = visits.filter(v => !v.environment || v.environment === 'live').length;

    const statCards = document.querySelectorAll('.portfolio-stats .stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.stat-number').textContent = totalVisits.toLocaleString();
        statCards[0].querySelector('.stat-label').textContent = 'Total Views';
        
        statCards[1].querySelector('.stat-number').textContent = uniqueVisitors.toLocaleString();
        statCards[1].querySelector('.stat-label').textContent = 'Unique Visitors';
        
        statCards[2].querySelector('.stat-number').textContent = todayVisits.toLocaleString();
        statCards[2].querySelector('.stat-label').textContent = "Today's Views";
        
        statCards[3].querySelector('.stat-number').textContent = liveVisits.toLocaleString();
        statCards[3].querySelector('.stat-label').textContent = 'Live Visits';
    }
}

/**
 * Initialize portfolio analytics
 */
async function initializePortfolioAnalytics() {
    const visits = await loadPortfolioAnalyticsData();
    updatePortfolioStats(visits);
}

// ===== CUSTOM ANALYTICS FIELDS =====

/**
 * Initialize custom analytics fields
 */
async function initializeCustomAnalyticsFields() {
    await loadCustomAnalyticsFields();
    setupCustomAnalyticsEvents();
}

/**
 * Load custom analytics fields from Supabase
 */
async function loadCustomAnalyticsFields() {
    try {
        const { data, error } = await supabaseClient
            .from('portfolio_analytics')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.log('Creating default custom analytics fields');
            await createDefaultCustomFields();
            return;
        }

        customAnalyticsFields = data || [];
        renderCustomAnalyticsFields();
        
    } catch (error) {
        console.error('Error loading custom analytics:', error);
        await createDefaultCustomFields();
    }
}

/**
 * Create default custom fields
 */
async function createDefaultCustomFields() {
    const defaultFields = [
        { name: 'Website Size', value: '4.02 MB', type: 'text' },
        { name: 'Loading Time', value: '3.0 seconds', type: 'text' },
    ];

    try {
        const { data, error } = await supabaseClient
            .from('portfolio_analytics')
            .insert(defaultFields)
            .select();

        if (error) throw error;

        customAnalyticsFields = data || [];
        renderCustomAnalyticsFields();
    } catch (error) {
        console.error('Error creating default fields:', error);
        customAnalyticsFields = defaultFields;
        renderCustomAnalyticsFields();
    }
}

/**
 * Render custom analytics fields
 */
function renderCustomAnalyticsFields() {
    const container = document.getElementById('portfolioAnalyticsContainer');
    if (!container) {
        console.log('Custom analytics container not found');
        return;
    }

    container.innerHTML = '';

    if (customAnalyticsFields.length === 0) {
        container.innerHTML = `
            <div class="no-analytics">
                <i class="fas fa-chart-bar"></i>
                <p>No analytics data available</p>
            </div>
        `;
        return;
    }

    customAnalyticsFields.forEach((field) => {
        const fieldElement = createCustomFieldElement(field);
        container.appendChild(fieldElement);
    });
}

/**
 * Create custom field element
 */
function createCustomFieldElement(field) {
    const div = document.createElement('div');
    div.className = 'analytics-item';
    div.setAttribute('data-field-id', field.id);
    
    div.innerHTML = `
        <div class="analytics-content">
            <div class="analytics-name">${escapeHtml(field.name)}</div>
            <div class="analytics-value">${escapeHtml(field.value)}</div>
        </div>
        <div class="analytics-actions">
            <button class="btn btn-edit btn-sm" onclick="editCustomField('${field.id}')">Edit</button>
            ${!isDefaultCustomField(field.name) ? 
                `<button class="btn btn-remove btn-sm" onclick="deleteCustomField('${field.id}')">Remove</button>` : 
                ''
            }
        </div>
    `;
    
    return div;
}

/**
 * Check if field is default
 */
function isDefaultCustomField(name) {
    const defaultFields = ['Website Size', 'Loading Time'];
    return defaultFields.includes(name);
}

/**
 * Setup custom analytics events
 */
function setupCustomAnalyticsEvents() {
    const addBtn = document.getElementById('addAnalyticsFieldBtn');
    if (addBtn) {
        addBtn.onclick = () => openCustomFieldModal();
    }

    // Modal event listeners
    const overlay = document.getElementById('analyticsOverlay');
    const cancelBtn = document.getElementById('analytics-cancel-btn');
    const form = document.getElementById('analytics-field-form');

    if (overlay) {
        overlay.onclick = closeCustomFieldModal;
    }

    if (cancelBtn) {
        cancelBtn.onclick = closeCustomFieldModal;
    }

    if (form) {
        form.onsubmit = handleCustomFieldSubmit;
    }
}

/**
 * Open custom field modal
 */
function openCustomFieldModal(fieldId = null) {
    const modal = document.getElementById('analytics-field-modal');
    if (!modal) {
        console.error('Custom field modal not found');
        return;
    }
    
    if (fieldId) {
        const field = customAnalyticsFields.find(f => f.id == fieldId);
        if (field) {
            document.getElementById('analyticsFieldTitle').textContent = 'Edit Field';
            document.getElementById('analytics-field-name').value = field.name;
            document.getElementById('analytics-field-value').value = field.value;
            document.getElementById('analytics-field-type').value = field.type;
            editingFieldId = fieldId;
        }
    } else {
        document.getElementById('analyticsFieldTitle').textContent = 'Add Field';
        document.getElementById('analytics-field-form').reset();
        document.getElementById('analytics-field-type').value = 'text';
        editingFieldId = null;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close custom field modal
 */
function closeCustomFieldModal() {
    const modal = document.getElementById('analytics-field-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editingFieldId = null;
}

/**
 * Handle custom field form submission
 */
async function handleCustomFieldSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('analytics-field-name').value.trim();
    const value = document.getElementById('analytics-field-value').value.trim();
    const type = document.getElementById('analytics-field-type').value;
    
    if (!name || !value) {
        alert('Please fill all fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editingFieldId) {
            await supabaseClient
                .from('portfolio_analytics')
                .update({
                    name: name,
                    value: value,
                    type: type,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingFieldId);
        } else {
            await supabaseClient
                .from('portfolio_analytics')
                .insert([{
                    name: name,
                    value: value,
                    type: type
                }]);
        }
        
        await loadCustomAnalyticsFields();
        closeCustomFieldModal();
        
    } catch (error) {
        console.error('Error saving custom field:', error);
        alert('Error saving field: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Edit custom field (global function)
 */
function editCustomField(fieldId) {
    openCustomFieldModal(fieldId);
}

/**
 * Delete custom field (global function)
 */
async function deleteCustomField(fieldId) {
    if (!confirm('Are you sure you want to remove this field?')) return;
    
    showLoading();
    try {
        await supabaseClient
            .from('portfolio_analytics')
            .delete()
            .eq('id', fieldId);
        
        await loadCustomAnalyticsFields();
    } catch (error) {
        alert('Error removing field: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== IMPORTANT INFO SECTION - FULL FUNCTIONALITY =====

/**
 * Initialize Important Info Section
 */
async function initializeImportantInfo() {
    await Promise.all([
        loadProjectOverview(),
        loadUrgentItems(),
        loadDeadlines(),
        loadClients()
    ]);
    setupImportantInfoEventListeners();
}

/**
 * Load Project Overview Data
 */
async function loadProjectOverview() {
    try {
        const { data: projectsData, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading projects for overview:', error);
            return;
        }

        updateProjectOverview(projectsData || []);
        updateRecentProjects(projectsData || []);
        
    } catch (error) {
        console.error('Error loading project overview:', error);
    }
}

/**
 * Update Project Overview Statistics
 */
function updateProjectOverview(projects) {
    const totalProjects = projects.length;
    const inProgressProjects = projects.filter(p => p.status === 'in-process').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const pendingProjects = projects.filter(p => p.status === 'waiting' || p.status === 'planned').length;

    // Update the summary items
    const totalEl = document.getElementById('totalProjects');
    const inProgressEl = document.getElementById('inProgressProjects');
    const completedEl = document.getElementById('completedProjects');
    const pendingEl = document.getElementById('pendingProjects');

    if (totalEl) totalEl.textContent = totalProjects;
    if (inProgressEl) inProgressEl.textContent = inProgressProjects;
    if (completedEl) completedEl.textContent = completedProjects;
    if (pendingEl) pendingEl.textContent = pendingProjects;

    // Update status boxes in Important Info section
    updateImportantInfoStats(totalProjects, inProgressProjects, completedProjects, pendingProjects);
}

/**
 * Update Important Info Status Boxes
 */
function updateImportantInfoStats(total, inProgress, completed, pending) {
    const statusBoxes = document.querySelectorAll('#info-section .status-box');
    if (statusBoxes.length >= 4) {
        statusBoxes[0].querySelector('.count').textContent = total;
        statusBoxes[1].querySelector('.count').textContent = inProgress;
        statusBoxes[2].querySelector('.count').textContent = pending;
        statusBoxes[3].querySelector('.count').textContent = completed;
    }
}

/**
 * Update Recent Projects List - Show only top 3
 */
function updateRecentProjects(projects) {
    const container = document.getElementById('recentProjectsList');
    if (!container) return;

    container.innerHTML = '';

    // Take only the latest 3 projects
    const recentProjects = projects.slice(0, 3);

    if (recentProjects.length === 0) {
        container.innerHTML = '<div class="no-data"><p>No projects found</p></div>';
        return;
    }

    recentProjects.forEach(project => {
        const projectElement = createRecentProjectElement(project);
        container.appendChild(projectElement);
    });
}

/**
 * Create Recent Project Element
 */
function createRecentProjectElement(project) {
    const div = document.createElement('div');
    div.className = 'project-item';
    
    const statusClass = getProjectStatusClass(project.status);
    const statusText = getStatusText(project.status);
    
    div.innerHTML = `
        <div class="project-name">${escapeHtml(project.name)}</div>
        <div class="project-status ${statusClass}">${statusText}</div>
    `;
    
    // Add click event to navigate to project
    div.addEventListener('click', () => {
        switchSection('freelance');
        setTimeout(() => {
            selectProject(project.id);
        }, 100);
    });
    
    return div;
}

/**
 * Get Project Status Class for Styling
 */
function getProjectStatusClass(status) {
    const statusMap = {
        'completed': 'completed',
        'in-process': 'in-progress',
        'waiting': 'pending',
        'planned': 'planned'
    };
    return statusMap[status] || 'pending';
}

/**
 * Load Urgent Items from Supabase
 */
async function loadUrgentItems() {
    try {
        const { data, error } = await supabaseClient
            .from('urgent_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading urgent items:', error);
            urgentItems = [];
        } else {
            urgentItems = data || [];
        }

        updateUrgentItems();
        
    } catch (error) {
        console.error('Error loading urgent items:', error);
        urgentItems = [];
        updateUrgentItems();
    }
}

/**
 * Update Urgent Items Display
 */
function updateUrgentItems() {
    const container = document.getElementById('urgentItemsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (urgentItems.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-check-circle"></i>
                <p>No urgent items at the moment</p>
            </div>
        `;
        return;
    }

    urgentItems.forEach(item => {
        const itemElement = createUrgentItemElement(item);
        container.appendChild(itemElement);
    });

    initializeUrgentItemsScroll();
}

/**
 * Create Urgent Item Element
 */
function createUrgentItemElement(item) {
    const div = document.createElement('div');
    div.className = `urgent-item ${item.priority}`;
    
    const deadline = formatDisplayDate(item.deadline);
    
    div.innerHTML = `
        <div class="urgent-priority ${item.priority}">${item.priority}</div>
        <div class="urgent-content">
            <div class="urgent-title">${escapeHtml(item.title)}</div>
            <div class="urgent-description">${escapeHtml(item.description)}</div>
            <div class="urgent-deadline">Due: ${deadline}</div>
        </div>
        <div class="urgent-actions">
            <button class="btn btn-edit btn-sm" data-item-id="${item.id}">Edit</button>
            <button class="btn btn-remove btn-sm" data-item-id="${item.id}">Remove</button>
        </div>
    `;
    
    return div;
}

/**
 * Load Deadlines from Supabase
 */
async function loadDeadlines() {
    try {
        const { data, error } = await supabaseClient
            .from('deadlines')
            .select('*')
            .order('deadline_date', { ascending: true })
            .order('deadline_time', { ascending: true }) 
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading deadlines:', error);
            deadlines = [];
        } else {
            deadlines = data || [];
        }

        updateDeadlines();
        
    } catch (error) {
        console.error('Error loading deadlines:', error);
        deadlines = [];
        updateDeadlines();
    }
}

/**
 * Update Deadlines Display
 */
function updateDeadlines() {
    const container = document.getElementById('deadlinesContainer');
    if (!container) return;

    container.innerHTML = '';

    if (deadlines.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-flag"></i>
                <p>No upcoming deadlines</p>
            </div>
        `;
        return;
    }

    deadlines.forEach(deadline => {
        const deadlineElement = createDeadlineElement(deadline);
        container.appendChild(deadlineElement);
    });

    initializeDeadlinesScroll();
}

/**
 * Create Deadline Element
 */
function createDeadlineElement(deadline) {
    const div = document.createElement('div');
    div.className = 'deadline-item';
    
    const deadlineDate = formatDisplayDate(deadline.deadline_date);
    const deadlineTime = formatDisplayTime(deadline.deadline_time);
    
    div.innerHTML = `
        <div class="deadline-icon">
            <i class="fas fa-flag"></i>
        </div>
        <div class="deadline-content">
            <div class="deadline-title">${escapeHtml(deadline.title)}</div>
            <div class="deadline-description">${escapeHtml(deadline.description)}</div>
            <div class="deadline-time">${deadlineDate} at ${deadlineTime}</div>
        </div>
        <div class="deadline-type">${deadline.type}</div>
    `;
    
    return div;
}

/**
 * Load Clients from Supabase
 */
async function loadClients() {
    try {
        const { data, error } = await supabaseClient
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading clients:', error);
            clients = [];
        } else {
            clients = data || [];
        }

        updateClients();
        
    } catch (error) {
        console.error('Error loading clients:', error);
        clients = [];
        updateClients();
    }
}

/**
 * Update Clients Display
 */
function updateClients() {
    const container = document.getElementById('clientsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (clients.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-user-tie"></i>
                <p>No client information added</p>
            </div>
        `;
        return;
    }

    clients.forEach(client => {
        const clientElement = createClientElement(client);
        container.appendChild(clientElement);
    });

    initializeClientsScroll();
}

/**
 * Create Client Element
 */
function createClientElement(client) {
    const div = document.createElement('div');
    div.className = 'client-item';
    
    const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    div.innerHTML = `
        <div class="client-avatar">${initials}</div>
        <div class="client-info">
            <div class="client-name">${escapeHtml(client.name)}</div>
            <div class="client-company">${escapeHtml(client.company || 'No company')}</div>
            <div class="client-contact">${escapeHtml(client.email)}</div>
        </div>
        <div class="client-actions">
            <button class="btn btn-edit btn-sm" data-client-id="${client.id}">Edit</button>
            <button class="btn btn-remove btn-sm" data-client-id="${client.id}">Remove</button>
        </div>
    `;
    
    return div;
}

/**
 * Setup Important Info Event Listeners
 */
function setupImportantInfoEventListeners() {
    // Refresh buttons
    const refreshProjectsBtn = document.getElementById('refresh-projects-btn');
    const refreshAnalyticsBtn = document.getElementById('refresh-analytics-btn');
    const refreshFinanceBtn = document.getElementById('refresh-finance-btn');
    
    if (refreshProjectsBtn) {
        refreshProjectsBtn.addEventListener('click', loadProjectOverview);
    }
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', () => {
            switchSection('portfolio');
        });
    }
    if (refreshFinanceBtn) {
        refreshFinanceBtn.addEventListener('click', loadProjectOverview);
    }
    
    // Add buttons
    const addUrgentBtn = document.getElementById('add-urgent-btn');
    const addDeadlineBtn = document.getElementById('add-deadline-btn');
    const addClientBtn = document.getElementById('add-client-btn');
    
    if (addUrgentBtn) {
        addUrgentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openUrgentModal();
        });
    }
    if (addDeadlineBtn) {
        addDeadlineBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openDeadlineModal();
        });
    }
    if (addClientBtn) {
        addClientBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openClientModal();
        });
    }
    
    // Modal event listeners
    setupImportantInfoModals();
    
    // Action listeners for urgent items, deadlines, and clients
    setupImportantInfoActionListeners();
}

/**
 * Setup Important Info Modal Event Listeners
 */
function setupImportantInfoModals() {
    // Urgent Modal
    const urgentOverlay = document.getElementById('urgentOverlay');
    const urgentCancelBtn = document.getElementById('urgent-cancel-btn');
    const urgentForm = document.getElementById('urgent-form');
    
    if (urgentOverlay) urgentOverlay.addEventListener('click', closeUrgentModal);
    if (urgentCancelBtn) urgentCancelBtn.addEventListener('click', closeUrgentModal);
    if (urgentForm) urgentForm.addEventListener('submit', handleUrgentSubmit);
    
    // Deadline Modal
    const deadlineOverlay = document.getElementById('deadlineOverlay');
    const deadlineCancelBtn = document.getElementById('deadline-cancel-btn');
    const deadlineForm = document.getElementById('deadline-form');
    
    if (deadlineOverlay) deadlineOverlay.addEventListener('click', closeDeadlineModal);
    if (deadlineCancelBtn) deadlineCancelBtn.addEventListener('click', closeDeadlineModal);
    if (deadlineForm) deadlineForm.addEventListener('submit', handleDeadlineSubmit);
    
    // Client Modal
    const clientOverlay = document.getElementById('clientOverlay');
    const clientCancelBtn = document.getElementById('client-cancel-btn');
    const clientForm = document.getElementById('client-form');
    
    if (clientOverlay) clientOverlay.addEventListener('click', closeClientModal);
    if (clientCancelBtn) clientCancelBtn.addEventListener('click', closeClientModal);
    if (clientForm) clientForm.addEventListener('submit', handleClientSubmit);
}

/**
 * Setup Action Listeners for Important Info Items
 */
function setupImportantInfoActionListeners() {
    // Urgent items actions
    const urgentContainer = document.getElementById('urgentItemsContainer');
    if (urgentContainer) {
        urgentContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                e.stopPropagation();
                editUrgentItem(e.target.getAttribute('data-item-id'));
            } else if (e.target.classList.contains('btn-remove')) {
                e.stopPropagation();
                if (confirm('Are you sure you want to remove this urgent item?')) {
                    removeUrgentItem(e.target.getAttribute('data-item-id'));
                }
            }
        });
    }
    
    // Clients actions
    const clientsContainer = document.getElementById('clientsContainer');
    if (clientsContainer) {
        clientsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-edit')) {
                e.stopPropagation();
                editClient(e.target.getAttribute('data-client-id'));
            } else if (e.target.classList.contains('btn-remove')) {
                e.stopPropagation();
                if (confirm('Are you sure you want to remove this client?')) {
                    removeClient(e.target.getAttribute('data-client-id'));
                }
            }
        });
    }
}

// ===== URGENT ITEMS MODAL FUNCTIONS =====

function openUrgentModal(itemId = null) {
    const modal = document.getElementById('urgent-modal');
    const form = document.getElementById('urgent-form');
    const title = document.getElementById('urgentTitle');
    
    if (!modal) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (itemId) {
        editUrgentId = itemId;
        const item = urgentItems.find(i => i.id == itemId);
        if (item) {
            title.textContent = 'Edit Urgent Item';
            document.getElementById('urgent-title').value = item.title || '';
            document.getElementById('urgent-description').value = item.description || '';
            document.getElementById('urgent-priority').value = item.priority || 'medium';
            document.getElementById('urgent-deadline').value = item.deadline || today;
            document.getElementById('urgent-related').value = item.related_to || '';
        }
    } else {
        editUrgentId = null;
        title.textContent = 'Add Urgent Item';
        if (form) form.reset();
        document.getElementById('urgent-deadline').value = today;
    }
    
    modal.classList.remove('hidden');
}

function closeUrgentModal() {
    const modal = document.getElementById('urgent-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editUrgentId = null;
}

async function handleUrgentSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('urgent-title').value.trim();
    const description = document.getElementById('urgent-description').value.trim();
    const priority = document.getElementById('urgent-priority').value;
    const deadline = document.getElementById('urgent-deadline').value;
    const related = document.getElementById('urgent-related').value.trim();
    
    if (!title || !description || !deadline) {
        alert('Please fill all required fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editUrgentId) {
            // Update existing urgent item
            const updateData = {
                title: title,
                description: description,
                priority: priority,
                deadline: deadline,
                related_to: related,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await supabaseClient
                .from('urgent_items')
                .update(updateData)
                .eq('id', editUrgentId);

            if (error) throw error;
            
        } else {
            // Create new urgent item
            const { data, error } = await supabaseClient
                .from('urgent_items')
                .insert([{
                    title: title,
                    description: description,
                    priority: priority,
                    deadline: deadline,
                    related_to: related
                }])
                .select();

            if (error) throw error;
        }
        
        await loadUrgentItems();
        closeUrgentModal();
        
    } catch (error) {
        console.error('Error saving urgent item:', error);
        alert('Error saving urgent item: ' + error.message);
    } finally {
        hideLoading();
    }
}

function editUrgentItem(itemId) {
    openUrgentModal(itemId);
}

async function removeUrgentItem(itemId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('urgent_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;

        await loadUrgentItems();
        
    } catch (error) {
        console.error('Error removing urgent item:', error);
        alert('Error removing urgent item: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== DEADLINES MODAL FUNCTIONS =====

function openDeadlineModal(deadlineId = null) {
    const modal = document.getElementById('deadline-modal');
    const form = document.getElementById('deadline-form');
    const title = document.getElementById('deadlineTitle');
    
    if (!modal) return;
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    
    if (deadlineId) {
        editDeadlineId = deadlineId;
        const deadline = deadlines.find(d => d.id == deadlineId);
        if (deadline) {
            title.textContent = 'Edit Deadline';
            document.getElementById('deadline-title').value = deadline.title || '';
            document.getElementById('deadline-description').value = deadline.description || '';
            document.getElementById('deadline-date').value = deadline.deadline_date || today;
            document.getElementById('deadline-time').value = deadline.deadline_time || now;
            document.getElementById('deadline-type').value = deadline.type || 'project';
        }
    } else {
        editDeadlineId = null;
        title.textContent = 'Add Deadline';
        if (form) form.reset();
        document.getElementById('deadline-date').value = today;
        document.getElementById('deadline-time').value = now;
    }
    
    modal.classList.remove('hidden');
}

function closeDeadlineModal() {
    const modal = document.getElementById('deadline-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editDeadlineId = null;
}

async function handleDeadlineSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('deadline-title').value.trim();
    const description = document.getElementById('deadline-description').value.trim();
    const date = document.getElementById('deadline-date').value;
    const time = document.getElementById('deadline-time').value;
    const type = document.getElementById('deadline-type').value;
    
    if (!title || !date || !time) {
        alert('Please fill all required fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editDeadlineId) {
            // Update existing deadline
            const updateData = {
                title: title,
                description: description,
                deadline_date: date,
                deadline_time: time,
                type: type,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await supabaseClient
                .from('deadlines')
                .update(updateData)
                .eq('id', editDeadlineId);

            if (error) throw error;
            
        } else {
            // Create new deadline
            const { data, error } = await supabaseClient
                .from('deadlines')
                .insert([{
                    title: title,
                    description: description,
                    deadline_date: date,
                    deadline_time: time,
                    type: type
                }])
                .select();

            if (error) throw error;
        }
        
        await loadDeadlines();
        closeDeadlineModal();
        
    } catch (error) {
        console.error('Error saving deadline:', error);
        alert('Error saving deadline: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== CLIENTS MODAL FUNCTIONS =====

function openClientModal(clientId = null) {
    const modal = document.getElementById('client-modal');
    const form = document.getElementById('client-form');
    const title = document.getElementById('clientTitle');
    
    if (!modal) return;
    
    if (clientId) {
        editClientId = clientId;
        const client = clients.find(c => c.id == clientId);
        if (client) {
            title.textContent = 'Edit Client';
            document.getElementById('client-name').value = client.name || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('client-company').value = client.company || '';
            document.getElementById('client-notes').value = client.notes || '';
        }
    } else {
        editClientId = null;
        title.textContent = 'Add Client';
        if (form) form.reset();
    }
    
    modal.classList.remove('hidden');
}

function closeClientModal() {
    const modal = document.getElementById('client-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editClientId = null;
}

async function handleClientSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('client-name').value.trim();
    const email = document.getElementById('client-email').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const company = document.getElementById('client-company').value.trim();
    const notes = document.getElementById('client-notes').value.trim();
    
    if (!name || !email) {
        alert('Please fill all required fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editClientId) {
            // Update existing client
            const updateData = {
                name: name,
                email: email,
                phone: phone,
                company: company,
                notes: notes,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await supabaseClient
                .from('clients')
                .update(updateData)
                .eq('id', editClientId);

            if (error) throw error;
            
        } else {
            // Create new client
            const { data, error } = await supabaseClient
                .from('clients')
                .insert([{
                    name: name,
                    email: email,
                    phone: phone,
                    company: company,
                    notes: notes
                }])
                .select();

            if (error) throw error;
        }
        
        await loadClients();
        closeClientModal();
        
    } catch (error) {
        console.error('Error saving client:', error);
        alert('Error saving client: ' + error.message);
    } finally {
        hideLoading();
    }
}

function editClient(clientId) {
    openClientModal(clientId);
}

async function removeClient(clientId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) throw error;

        await loadClients();
        
    } catch (error) {
        console.error('Error removing client:', error);
        alert('Error removing client: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ===== DATA PERSISTENCE FUNCTIONS =====

/**
 * Save Important Info Data to Local Storage
 */
async function saveImportantInfoData() {
    try {
        const importantInfoData = {
            urgentItems: urgentItems,
            deadlines: deadlines,
            clients: clients,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('crm_important_info', JSON.stringify(importantInfoData));
    } catch (error) {
        console.error('Error saving important info data:', error);
    }
}

/**
 * Load Important Info Data from Local Storage
 */
function loadImportantInfoFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('crm_important_info');
        if (savedData) {
            const data = JSON.parse(savedData);
            urgentItems = data.urgentItems || [];
            deadlines = data.deadlines || [];
            clients = data.clients || [];
        }
    } catch (error) {
        console.error('Error loading important info from local storage:', error);
    }
}

// ===== SCROLL FUNCTIONALITY =====

function initializeUrgentItemsScroll() {
    const container = document.getElementById('urgentItemsContainer');
    const indicator = document.getElementById('urgentMoreIndicator');
    initializeScrollContainer(container, indicator);
}

function initializeDeadlinesScroll() {
    const container = document.getElementById('deadlinesContainer');
    const indicator = document.getElementById('deadlinesMoreIndicator');
    initializeScrollContainer(container, indicator);
}

function initializeClientsScroll() {
    const container = document.getElementById('clientsContainer');
    const indicator = document.getElementById('clientsMoreIndicator');
    initializeScrollContainer(container, indicator);
}

function initializeScrollContainer(container, indicator) {
    if (!container || !indicator) return;
    
    const items = container.children;
    
    if (items.length > 3) {
        indicator.style.display = 'block';
        
        container.addEventListener('scroll', function() {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            if (scrollTop + clientHeight >= scrollHeight - 10) {
                indicator.style.display = 'none';
            } else {
                indicator.style.display = 'block';
            }
        });
        
        indicator.addEventListener('click', function() {
            container.scrollBy({ top: 100, behavior: 'smooth' });
        });
    } else {
        indicator.style.display = 'none';
    }
}
// ===== CONNECTIONS SECTION =====
let connections = [];
let editConnectionId = null;

/**
 * Initialize Connections Section
 */
async function initializeConnections() {
    await loadConnections();
    setupConnectionsEventListeners();
}

/**
 * Load connections from Supabase
 */
async function loadConnections() {
    try {
        const { data, error } = await supabaseClient
            .from('connections')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            await createConnectionsTable();
            return;
        }

        connections = data || [];
        renderConnectionsTable();
        
    } catch (error) {
        await createConnectionsTable();
    }
}

/**
 * Create connections table with sample data
 */
async function createConnectionsTable() {
    const sampleData = [
        {
            name: 'Mike Johnson',
            email: 'mike.johnson@startup.com',
            company: 'Startup Inc',
            position: 'CTO',
            status: 'inactive',
            last_contact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: 'Follow up needed'
        }
    ];

    try {
        const { data, error } = await supabaseClient
            .from('connections')
            .insert(sampleData)
            .select();

        if (error) throw error;

        connections = data || [];
        renderConnectionsTable();
    } catch (error) {
        connections = sampleData.map((item, index) => ({ ...item, id: index + 1 }));
        renderConnectionsTable();
    }
}

/**
 * Render connections table
 */
function renderConnectionsTable() {
    const tableBody = document.getElementById('connectionsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (connections.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; display: block; color: #bdc3c7;"></i>
                    No connections found. Click "Add Connection" to get started.
                </td>
            </tr>
        `;
        return;
    }

    connections.forEach((connection, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="connection-info">
                    <div class="connection-name">${escapeHtml(connection.name)}</div>
                    <div class="connection-email">${escapeHtml(connection.email)}</div>
                </div>
            </td>
            <td>${escapeHtml(connection.company || '-')}</td>
            <td>${escapeHtml(connection.position || '-')}</td>
            <td>
                <span class="status-badge status-${connection.status}">
                    ${connection.status === 'active' ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDisplayDate(connection.last_contact)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-edit btn-sm" data-connection-id="${connection.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-remove btn-sm" data-connection-id="${connection.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Setup connections event listeners
 */
function setupConnectionsEventListeners() {
    const addBtn = document.getElementById('addConnectionBtn');
    if (addBtn) {
        addBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openConnectionModal();
        });
    }

    const tableBody = document.getElementById('connectionsTableBody');
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const target = e.target;
            const btn = target.closest('button');
            if (!btn) return;

            const connectionId = btn.getAttribute('data-connection-id');
            if (!connectionId) return;

            if (btn.classList.contains('btn-edit')) {
                e.stopPropagation();
                editConnection(connectionId);
            } else if (btn.classList.contains('btn-remove')) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this connection?')) {
                    removeConnection(connectionId);
                }
            }
        });
    }

    const overlay = document.getElementById('connectionOverlay');
    const cancelBtn = document.getElementById('connectionCancelBtn');
    const form = document.getElementById('connectionForm');

    if (overlay) overlay.addEventListener('click', closeConnectionModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeConnectionModal);
    if (form) form.addEventListener('submit', handleConnectionSubmit);
}

/**
 * Open connection modal
 */
function openConnectionModal(connectionId = null) {
    const modal = document.getElementById('connectionModal');
    if (!modal) return;

    const today = new Date().toISOString().split('T')[0];
    
    if (connectionId) {
        editConnectionId = connectionId;
        const connection = connections.find(c => c.id == connectionId);
        if (connection) {
            document.getElementById('connectionTitle').textContent = 'Edit Connection';
            document.getElementById('connectionName').value = connection.name || '';
            document.getElementById('connectionEmail').value = connection.email || '';
            document.getElementById('connectionCompany').value = connection.company || '';
            document.getElementById('connectionPosition').value = connection.position || '';
            document.getElementById('connectionStatus').value = connection.status || 'active';
            document.getElementById('connectionLastContact').value = connection.last_contact || today;
            document.getElementById('connectionNotes').value = connection.notes || '';
        }
    } else {
        editConnectionId = null;
        document.getElementById('connectionTitle').textContent = 'Add Connection';
        document.getElementById('connectionForm').reset();
        document.getElementById('connectionStatus').value = 'active';
        document.getElementById('connectionLastContact').value = today;
    }
    
    modal.classList.remove('hidden');
}

/**
 * Close connection modal
 */
function closeConnectionModal() {
    const modal = document.getElementById('connectionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    editConnectionId = null;
}

/**
 * Handle connection form submission
 */
async function handleConnectionSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('connectionName').value.trim();
    const email = document.getElementById('connectionEmail').value.trim();
    const company = document.getElementById('connectionCompany').value.trim();
    const position = document.getElementById('connectionPosition').value.trim();
    const status = document.getElementById('connectionStatus').value;
    const lastContact = document.getElementById('connectionLastContact').value;
    const notes = document.getElementById('connectionNotes').value.trim();
    
    if (!name || !email) {
        alert('Please fill in name and email fields');
        return;
    }
    
    showLoading();
    
    try {
        if (editConnectionId) {
            const { error } = await supabaseClient
                .from('connections')
                .update({
                    name,
                    email,
                    company,
                    position,
                    status,
                    last_contact: lastContact,
                    notes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editConnectionId);

            if (error) throw error;
        } else {
            const { data, error } = await supabaseClient
                .from('connections')
                .insert([{
                    name,
                    email,
                    company,
                    position,
                    status,
                    last_contact: lastContact,
                    notes
                }])
                .select();

            if (error) throw error;
        }
        
        await loadConnections();
        closeConnectionModal();
        
    } catch (error) {
        alert('Error saving connection: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Edit connection
 */
function editConnection(connectionId) {
    openConnectionModal(connectionId);
}

/**
 * Remove connection
 */
async function removeConnection(connectionId) {
    showLoading();
    
    try {
        const { error } = await supabaseClient
            .from('connections')
            .delete()
            .eq('id', connectionId);

        if (error) throw error;

        await loadConnections();
        
    } catch (error) {
        alert('Error removing connection: ' + error.message);
    } finally {
        hideLoading();
    }
}

// testing the website Performance
// =============================================
// END OF CRM DASHBOARD JAVASCRIPT
// =============================================